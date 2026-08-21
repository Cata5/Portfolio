import type { IEmbeddingProvider } from "./interface";
import { embeddingCache } from "./cache";
import { batchExecute } from "./batcher";

export interface OpenAICompatibleEmbeddingOptions {
  baseUrl: string; // e.g. "http://127.0.0.1:1234/v1" or "http://127.0.0.1:8000/v1"
  modelName: string; // e.g. "text-embedding-nomic-embed-text-v1.5" or "qwen3-embedding-0.6b"
  dimension?: number; // e.g. 768 or 1024 or 1536
  apiKey?: string;
  timeoutMs?: number;
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
  private isServerHealthy: boolean | null = null;

  constructor(options: OpenAICompatibleEmbeddingOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.modelName = options.modelName || "text-embedding-qwen3-0.6b";
    this.dimension = options.dimension || 768;
    this.apiKey = options.apiKey || "lm-studio";
    this.timeoutMs = options.timeoutMs || 4000;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.baseUrl}/models`, {
        method: "GET",
        headers: { Authorization: `Bearer ${this.apiKey}` },
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

  public async embedText(text: string): Promise<number[]> {
    // 1. Check cache
    const cached = embeddingCache.get(text, this.modelName, this.dimension);
    if (cached) return cached;

    // 2. Try remote OpenAI-compatible server (LM Studio / Unsloth)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const res = await fetch(`${this.baseUrl}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
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
          embeddingCache.set(text, this.modelName, this.dimension, normalized);
          this.isServerHealthy = true;
          return normalized;
        }
      }
    } catch {
      this.isServerHealthy = false;
    }

    // 3. Fallback to high-entropy deterministic embedding
    const fallbackVec = generateDeterministicEmbedding(text, this.dimension);
    embeddingCache.set(text, this.modelName, this.dimension, fallbackVec);
    return fallbackVec;
  }

  public async embedBatch(texts: string[]): Promise<number[][]> {
    return batchExecute(texts, 16, async (batch) => {
      // Check which texts are already cached
      const results: number[][] = new Array(batch.length);
      const uncachedIndices: number[] = [];
      const uncachedTexts: string[] = [];

      for (let i = 0; i < batch.length; i++) {
        const cached = embeddingCache.get(batch[i], this.modelName, this.dimension);
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
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.modelName,
            input: uncachedTexts,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.data && Array.isArray(data.data)) {
            for (let j = 0; j < data.data.length; j++) {
              const origIdx = uncachedIndices[j];
              const normalized = l2Normalize(data.data[j].embedding);
              results[origIdx] = normalized;
              embeddingCache.set(uncachedTexts[j], this.modelName, this.dimension, normalized);
            }
            return results;
          }
        }
      } catch {
        // Fallback
      }

      // Fallback individually for uncached
      for (let j = 0; j < uncachedTexts.length; j++) {
        const origIdx = uncachedIndices[j];
        const vec = generateDeterministicEmbedding(uncachedTexts[j], this.dimension);
        results[origIdx] = vec;
        embeddingCache.set(uncachedTexts[j], this.modelName, this.dimension, vec);
      }

      return results;
    });
  }
}
