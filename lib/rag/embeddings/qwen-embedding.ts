import type { IEmbeddingProvider, EmbeddingProviderHealth } from "./interface";
import { embeddingCache } from "./cache";
import { batchExecute } from "./batcher";
import { truncateToTokenBudget } from "../chunking/tokenizer";

/** Conservative default: most local embedding models cap inputs near 512 tokens. */
const DEFAULT_EMBEDDING_TOKEN_BUDGET = 400;
/** Floor for the adaptive cap; below this the request is treated as failed. */
const MIN_EMBEDDING_TOKEN_BUDGET = 100;
/** Extra attempts after the server reports an input as too long. */
const MAX_BUDGET_RETRIES = 3;

export interface OpenAICompatibleEmbeddingOptions {
  baseUrl: string; // e.g. "http://127.0.0.1:1234/v1" or "http://127.0.0.1:8000/v1"
  modelName: string; // e.g. "text-embedding-nomic-embed-text-v1.5" or "qwen3-embedding-0.6b"
  dimension?: number; // e.g. 768 or 1024 or 1536
  /** Per-input token budget; longer chunks are trimmed before embedding. */
  maxInputTokens?: number;
  apiKey?: string;
  timeoutMs?: number;
  /** Reuse/store embeddings in the in-memory cache (config: `indexing.enableEmbeddingCache`). */
  cacheEnabled?: boolean;
}
export function l2Normalize(vector: number[]): number[] {
  let sumSq = 0;
  for (let i = 0; i < vector.length; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return vector;
  return vector.map((v) => v / norm);
}

/**
 * Deterministic local semantic embedding fallback.
 * Uses high-entropy subword hashing & position weighting to generate
 * dense semantic representations when local server is offline.
 */
/** Exported for diagnostics/tests: lets callers detect hash-fallback vectors. */
export function generateDeterministicEmbedding(text: string, dimension = 768): number[] {
  const vec = new Array(dimension).fill(0);
  if (!text || text.length === 0) return vec;

  const normalized = text.toLowerCase().trim();
  const words = normalized.split(/\s+/);

  for (let wIdx = 0; wIdx < words.length; wIdx++) {
    const word = words[wIdx];
    const weight = 1.0 / Math.sqrt(wIdx + 1);

    // Character 3-grams and whole word hashing
    const ngrams = [word];
    for (let i = 0; i < word.length - 2; i++) {
      ngrams.push(word.slice(i, i + 3));
    }

    for (const ng of ngrams) {
      let h = 2166136261;
      for (let i = 0; i < ng.length; i++) {
        h ^= ng.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      const idx = Math.abs(h) % dimension;
      const sign = (h & 1) === 0 ? 1 : -1;
      vec[idx] += sign * weight;
    }
  }

  return l2Normalize(vec);
}

export class OpenAICompatibleEmbeddingProvider implements IEmbeddingProvider {
  public readonly modelName: string;
  public readonly dimension: number;
  private baseUrl: string;
  private apiKey: string;
  private timeoutMs: number;
  private cacheEnabled: boolean;
  private isServerHealthy: boolean | null = null;
  private fallbackEmbeddings = 0;
  private warnedFallback = false;
  /**
   * Dimension actually observed from the server. Starts at the configured
   * value and is corrected on the first successful response so hash-fallback
   * vectors can never be a different length than the real ones (a mixed-length
   * index silently wrecks cosine ranking).
   */
  private effectiveDimension: number;
  private warnedDimension = false;
  /**
   * Current per-input token cap. Local servers reject a whole batch when any
   * single input exceeds the model window (bge-small: 510 tokens) and the
   * token estimator is only approximate, so this shrinks on rejection rather
   * than trusting one configured number.
   */
  private tokenBudget: number;
  private truncatedInputs = 0;
  private warnedTruncation = false;

  constructor(options: OpenAICompatibleEmbeddingOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.modelName = options.modelName || "text-embedding-qwen3-0.6b";
    this.dimension = options.dimension || 768;
    this.effectiveDimension = this.dimension;
    // No fake default key: keyless servers (Unsloth) must receive no auth header.
    this.apiKey = options.apiKey || "";
    this.timeoutMs = options.timeoutMs || 4000;
    this.cacheEnabled = options.cacheEnabled !== false;
    // Leave generous headroom under the common 512-token window.
    this.tokenBudget = options.maxInputTokens ?? DEFAULT_EMBEDDING_TOKEN_BUDGET;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;
    return headers;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.baseUrl}/models`, {
        method: "GET",
        headers: this.getHeaders(),
        signal: controller.signal,
      });
      clearTimeout(id);
      this.isServerHealthy = res.ok;
      return res.ok;
    } catch {
      this.isServerHealthy = false;
      return false;
    }
  }

  public getHealth(): EmbeddingProviderHealth {
    const mode: EmbeddingProviderHealth["mode"] =
      this.isServerHealthy === true && this.fallbackEmbeddings === 0
        ? "server"
        : this.isServerHealthy === false || this.fallbackEmbeddings > 0
          ? "hash-fallback"
          : "unknown";
    return {
      mode,
      serverOk: this.isServerHealthy,
      fallbackEmbeddings: this.fallbackEmbeddings,
      cacheEnabled: this.cacheEnabled,
    };
  }

  /** Fallback vectors are never cached, so a recovered server replaces them. */
  private makeFallbackVec(text: string): number[] {
    this.fallbackEmbeddings++;
    if (!this.warnedFallback) {
      this.warnedFallback = true;
      console.warn(
        `[RAG embeddings] Embedding server unavailable at ${this.baseUrl} — using deterministic hash fallback ` +
          `(degraded retrieval quality). Fix the server/model, then re-index to replace fallback vectors.`
      );
    }
    return generateDeterministicEmbedding(text, this.effectiveDimension);
  }

  /** Keep fallback vectors the same length as the vectors the server returns. */
  private adoptDimension(observed: number): void {
    if (!Number.isFinite(observed) || observed <= 0 || observed === this.effectiveDimension) return;
    if (!this.warnedDimension) {
      this.warnedDimension = true;
      console.warn(
        `[RAG embeddings] ${this.modelName} returns ${observed}-dim vectors but the configured ` +
          `dimension is ${this.dimension}; using ${observed} so fallback vectors stay consistent.`
      );
    }
    this.effectiveDimension = observed;
  }

  /**
   * Trim an input to the current token budget. Servers reject the *whole*
   * batch when any single input is too long (bge-small: 510 tokens), which
   * silently replaces every vector in that batch with hash fallbacks.
   */
  private limitInput(text: string): string {
    if (this.tokenBudget <= 0) return text;
    const { text: limited, truncated } = truncateToTokenBudget(text, this.tokenBudget);
    if (!truncated) return text;
    this.truncatedInputs++;
    if (!this.warnedTruncation) {
      this.warnedTruncation = true;
      console.warn(
        `[RAG embeddings] inputs over ${this.tokenBudget} tokens are trimmed before embedding ` +
          `(${this.modelName}); raise LOCAL_EMBEDDING_MAX_TOKENS if the model allows more.`
      );
    }
    return limited;
  }

  /** Tighten the input cap after a rejection; false when the floor is reached. */
  private shrinkTokenBudget(): boolean {
    const next = Math.floor(this.tokenBudget * 0.75);
    if (next < MIN_EMBEDDING_TOKEN_BUDGET) return false;
    this.tokenBudget = next;
    console.warn(
      `[RAG embeddings] ${this.modelName} rejected inputs as too long; retrying with a ${next}-token cap.`
    );
    return true;
  }

  /**
   * POST /embeddings for the given inputs, returning one vector per input in
   * the original order (`null` per malformed item) or `null` when the request
   * could not be satisfied. Over-long inputs are truncated, and a `400`
   * rejection tightens the budget and retries, since the token estimate is
   * content-dependent (code splits into more tokens than prose).
   */
  private async fetchVectors(
    inputs: string[],
    timeoutMs: number
  ): Promise<(number[] | null)[] | null> {
    for (let attempt = 0; attempt <= MAX_BUDGET_RETRIES; attempt++) {
      let res: Response;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        res = await fetch(`${this.baseUrl}/embeddings`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            model: this.modelName,
            input: inputs.map((text) => this.limitInput(text)),
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch {
        return null;
      }

      if (!res.ok) {
        if (res.status === 400 && this.shrinkTokenBudget()) continue;
        return null;
      }

      const data = await res.json().catch(() => null);
      const items: { index?: number; embedding?: number[] }[] = Array.isArray(data?.data)
        ? data.data
        : [];
      if (items.length !== inputs.length) return null;

      const ordered: (number[] | null)[] = new Array(inputs.length).fill(null);
      for (let j = 0; j < items.length; j++) {
        const item = items[j];
        // OpenAI-compatible servers may return items out of order (via `index`)
        const at =
          typeof item.index === "number" && item.index >= 0 && item.index < inputs.length
            ? item.index
            : j;
        ordered[at] = Array.isArray(item.embedding) && item.embedding.length > 0 ? item.embedding : null;
      }
      return ordered;
    }
    return null;
  }

  /**
   * One-shot readiness probe with a generous budget.
   *
   * Local servers (llama.cpp / LM Studio / Unsloth Studio) load an embedding
   * model lazily on first use, which can take far longer than a normal request
   * timeout. Without this probe the first batches abort, fall back to hash
   * vectors, and the index ends up with mixed-dimension garbage. Failures are
   * swallowed: the caller keeps its normal per-batch fallback behaviour.
   */
  public async warmUp(timeoutMs = 60000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(`${this.baseUrl}/embeddings`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ model: this.modelName, input: "warmup" }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = res.ok ? await res.json() : null;
      const vector = data?.data?.[0]?.embedding;
      if (Array.isArray(vector) && vector.length > 0) {
        this.adoptDimension(vector.length);
        this.isServerHealthy = true;
        return true;
      }
      this.isServerHealthy = false;
      return false;
    } catch {
      this.isServerHealthy = false;
      return false;
    }
  }

  public async embedText(text: string): Promise<number[]> {
    // 1. Check cache
    if (this.cacheEnabled) {
      const cached = embeddingCache.get(text, this.modelName, this.dimension);
      if (cached) return cached;
    }

    // 2. Try remote OpenAI-compatible server (LM Studio / Unsloth)
    const vectors = await this.fetchVectors([text], this.timeoutMs);
    const vector = vectors?.[0];
    if (vector) {
      this.adoptDimension(vector.length);
      const normalized = l2Normalize(vector);
      if (this.cacheEnabled) {
        embeddingCache.set(text, this.modelName, this.dimension, normalized);
      }
      this.isServerHealthy = true;
      return normalized;
    }
    this.isServerHealthy = false;

    // 3. Fallback to deterministic embedding (never cached)
    return this.makeFallbackVec(text);
  }

  public async embedBatch(texts: string[], batchSize = 16): Promise<number[][]> {
    return batchExecute(texts, batchSize, async (batch) => {
      // Check which texts are already cached
      const results: number[][] = new Array(batch.length);
      const uncachedIndices: number[] = [];
      const uncachedTexts: string[] = [];

      for (let i = 0; i < batch.length; i++) {
        const cached = this.cacheEnabled
          ? embeddingCache.get(batch[i], this.modelName, this.dimension)
          : null;
        if (cached) {
          results[i] = cached;
        } else {
          uncachedIndices.push(i);
          uncachedTexts.push(batch[i]);
        }
      }

      if (uncachedTexts.length === 0) return results;

      // One request for the whole batch; over-long inputs are trimmed and a
      // rejection retries with a smaller cap instead of poisoning the batch.
      const vectors = await this.fetchVectors(uncachedTexts, this.timeoutMs * 2);
      if (vectors) {
        let complete = vectors.length === uncachedTexts.length;
        for (let j = 0; complete && j < vectors.length; j++) {
          const vector = vectors[j];
          if (!vector) {
            complete = false;
            break;
          }
          const origIdx = uncachedIndices[j];
          this.adoptDimension(vector.length);
          const normalized = l2Normalize(vector);
          results[origIdx] = normalized;
          if (this.cacheEnabled) {
            embeddingCache.set(uncachedTexts[j], this.modelName, this.dimension, normalized);
          }
        }
        if (complete) {
          this.isServerHealthy = true;
          return results;
        }
      }
      this.isServerHealthy = false;

      // Fallback individually for anything the server did not provide (never cached)
      for (let j = 0; j < uncachedTexts.length; j++) {
        const origIdx = uncachedIndices[j];
        if (results[origIdx]) continue;
        results[origIdx] = this.makeFallbackVec(uncachedTexts[j]);
      }

      return results;
    });
  }
}
