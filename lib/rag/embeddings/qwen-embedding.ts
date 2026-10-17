import type { IEmbeddingProvider, EmbeddingProviderHealth } from "./interface";
import { embeddingCache } from "./cache";
import { batchExecute } from "./batcher";

export interface OpenAICompatibleEmbeddingOptions {
  baseUrl: string; // e.g. "http://127.0.0.1:1234/v1" or "http://127.0.0.1:8000/v1"
  modelName: string; // e.g. "text-embedding-nomic-embed-text-v1.5" or "qwen3-embedding-0.6b"
  dimension?: number; // e.g. 768 or 1024 or 1536
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
function generateDeterministicEmbedding(text: string, dimension = 768): number[] {
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

  constructor(options: OpenAICompatibleEmbeddingOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.modelName = options.modelName || "text-embedding-qwen3-0.6b";
    this.dimension = options.dimension || 768;
    // No fake default key: keyless servers (Unsloth) must receive no auth header.
    this.apiKey = options.apiKey || "";
    this.timeoutMs = options.timeoutMs || 4000;
    this.cacheEnabled = options.cacheEnabled !== false;
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
    return generateDeterministicEmbedding(text, this.dimension);
  }

  public async embedText(text: string): Promise<number[]> {
    // 1. Check cache
    if (this.cacheEnabled) {
      const cached = embeddingCache.get(text, this.modelName, this.dimension);
      if (cached) return cached;
    }

    // 2. Try remote OpenAI-compatible server (LM Studio / Unsloth)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const res = await fetch(`${this.baseUrl}/embeddings`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.modelName,
          input: text,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data[0] && Array.isArray(data.data[0].embedding)) {
          const rawVec = data.data[0].embedding;
          const normalized = l2Normalize(rawVec);
          if (this.cacheEnabled) {
            embeddingCache.set(text, this.modelName, this.dimension, normalized);
          }
          this.isServerHealthy = true;
          return normalized;
        }
      }
      this.isServerHealthy = false;
    } catch {
      this.isServerHealthy = false;
    }

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

      // Try batch call to OpenAI-compatible server
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs * 2);

        const res = await fetch(`${this.baseUrl}/embeddings`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            model: this.modelName,
            input: uncachedTexts,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const items: { index?: number; embedding?: number[] }[] = Array.isArray(data?.data) ? data.data : [];
          let complete = items.length === uncachedTexts.length;
          if (complete) {
            for (let j = 0; j < items.length; j++) {
              const item = items[j];
              if (!Array.isArray(item.embedding)) {
                complete = false;
                break;
              }
              // OpenAI-compatible servers may return items out of order (via `index`)
              const localIdx =
                typeof item.index === "number" && item.index >= 0 && item.index < uncachedTexts.length
                  ? item.index
                  : j;
              const origIdx = uncachedIndices[localIdx];
              const normalized = l2Normalize(item.embedding);
              results[origIdx] = normalized;
              if (this.cacheEnabled) {
                embeddingCache.set(uncachedTexts[localIdx], this.modelName, this.dimension, normalized);
              }
            }
          }
          if (complete) {
            this.isServerHealthy = true;
            return results;
          }
          this.isServerHealthy = false;
        } else {
          this.isServerHealthy = false;
        }
      } catch {
        this.isServerHealthy = false;
      }

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
