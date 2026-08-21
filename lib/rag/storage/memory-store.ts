import type { DenseResult } from "../types/retrieval";
import type { IVectorStore, VectorRecord } from "./interface";

export class MemoryVectorStore implements IVectorStore {
  public readonly name = "memory-vector-store";
  private records = new Map<string, VectorRecord>();

  public async init(): Promise<void> {
    // Initialized in memory
  }

  public async healthCheck(): Promise<boolean> {
    return true;
  }

  public async upsert(records: VectorRecord[]): Promise<void> {
    for (const rec of records) {
      this.records.set(rec.id, rec);
    }
  }

  public async delete(chunkIds: string[]): Promise<void> {
    for (const id of chunkIds) {
      this.records.delete(id);
    }
  }

  public async deleteByDocumentId(documentId: string): Promise<void> {
    const toDelete: string[] = [];
    for (const [id, rec] of this.records.entries()) {
      if (rec.chunk.documentId === documentId) {
        toDelete.push(id);
      }
    }
    for (const id of toDelete) {
      this.records.delete(id);
    }
  }

  public async search(
    queryVector: number[],
    topK = 30,
    minScore = 0.15,
    filter?: { fileTypes?: string[]; documentIds?: string[] }
  ): Promise<DenseResult[]> {
    if (this.records.size === 0 || queryVector.length === 0) return [];

    const scored: { rec: VectorRecord; score: number }[] = [];

    for (const rec of this.records.values()) {
      // Apply filters if present
      if (filter?.fileTypes && !filter.fileTypes.includes(rec.chunk.metadata.fileType)) {
        continue;
      }
      if (filter?.documentIds && !filter.documentIds.includes(rec.chunk.documentId)) {
        continue;
      }

      // Cosine similarity for normalized vectors: dot product
      const vec = rec.vector;
      let dot = 0;
      const len = Math.min(queryVector.length, vec.length);
      for (let i = 0; i < len; i++) {
        dot += queryVector[i] * vec[i];
      }

      // Normalize to [0, 1] range: (dot + 1) / 2 or max(0, dot)
      const score = Math.max(0, dot);

      if (score >= minScore) {
        scored.push({ rec, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    const results: DenseResult[] = [];
    const sliced = scored.slice(0, topK);
    for (let i = 0; i < sliced.length; i++) {
      results.push({
        chunk: sliced[i].rec.chunk,
        score: sliced[i].score,
        rank: i + 1,
      });
    }

    return results;
  }

  public async count(): Promise<number> {
    return this.records.size;
  }

  public async clear(): Promise<void> {
    this.records.clear();
  }

  public exportState(): VectorRecord[] {
    return Array.from(this.records.values());
  }

  public importState(records: VectorRecord[]): void {
    this.records.clear();
    for (const r of records) {
      this.records.set(r.id, r);
    }
  }
}

export const defaultVectorStore = new MemoryVectorStore();
