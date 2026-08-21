import { createHash } from "crypto";

export class EmbeddingCache {
  private cache = new Map<string, number[]>();
  private hits = 0;
  private misses = 0;

  private computeKey(text: string, modelName: string, dimension: number): string {
    const hash = createHash("sha256").update(text, "utf8").digest("hex");
    return `${modelName}_${dimension}_${hash}`;
  }

  public get(text: string, modelName: string, dimension: number): number[] | undefined {
    const key = this.computeKey(text, modelName, dimension);
    const result = this.cache.get(key);
    if (result) {
      this.hits++;
    } else {
      this.misses++;
    }
    return result;
  }

  public set(text: string, modelName: string, dimension: number, embedding: number[]): void {
    const key = this.computeKey(text, modelName, dimension);
    this.cache.set(key, embedding);
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

export const embeddingCache = new EmbeddingCache();
