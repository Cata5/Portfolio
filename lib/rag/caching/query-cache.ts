import type { ValidatedCitation } from "../citations/validator";
import type { RetrievalDiagnostics } from "../types/retrieval";

export interface CachedQueryResult {
  answer: string;
  citations: ValidatedCitation[];
  sources: {
    citationId: number;
    title: string;
    filePath: string;
    heading?: string;
    preview: string;
  }[];
  diagnostics?: RetrievalDiagnostics;
  cachedAt: number;
}

export class QueryCache {
  private cache = new Map<string, CachedQueryResult>();
  private ttlMs: number;
  private hits = 0;
  private misses = 0;

  constructor(ttlMs = 1000 * 60 * 10) {
    // 10 minute default TTL
    this.ttlMs = ttlMs;
  }

  private normalizeKey(query: string): string {
    return query.toLowerCase().trim().replace(/\s+/g, " ");
  }

  public get(query: string): CachedQueryResult | undefined {
    const key = this.normalizeKey(query);
    const item = this.cache.get(key);
    if (!item) {
      this.misses++;
      return undefined;
    }

    if (Date.now() - item.cachedAt > this.ttlMs) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    this.hits++;
    return item;
  }

  public set(query: string, result: Omit<CachedQueryResult, "cachedAt">): void {
    const key = this.normalizeKey(query);
    this.cache.set(key, {
      ...result,
      cachedAt: Date.now(),
    });
  }

  public getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

export const queryCache = new QueryCache();
