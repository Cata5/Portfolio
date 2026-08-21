import type { DenseResult } from "../types/retrieval";
import type { IVectorStore, VectorRecord } from "./interface";

import type { Chunk, ChunkMetadata } from "../types/document";

export interface QdrantStoreOptions {
  url?: string; // default: "http://localhost:6333"
  collectionName?: string; // default: "portfolio_rag"
  dimension?: number; // default: 768
}

interface QdrantSearchHit {
  score: number;
  payload: {
    chunk: Chunk;
    metadata: ChunkMetadata;
  };
}

export class QdrantVectorStore implements IVectorStore {
  public readonly name = "qdrant-vector-store";
  private url: string;
  private collectionName: string;
  private dimension: number;
  private isAvailable = false;

  constructor(options: QdrantStoreOptions = {}) {
    this.url = (options.url || "http://localhost:6333").replace(/\/+$/, "");
    this.collectionName = options.collectionName || "portfolio_rag";
    this.dimension = options.dimension || 768;
  }

  public async init(): Promise<void> {
    try {
      const healthy = await this.healthCheck();
      if (!healthy) return;

      // Check if collection exists
      const checkRes = await fetch(`${this.url}/collections/${this.collectionName}`);
      if (!checkRes.ok && checkRes.status === 404) {
        // Create collection with Cosine distance
        await fetch(`${this.url}/collections/${this.collectionName}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vectors: {
              size: this.dimension,
              distance: "Cosine",
            },
          }),
        });
      }
    } catch {
      this.isAvailable = false;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${this.url}/healthz`, { signal: controller.signal });
      clearTimeout(id);
      this.isAvailable = res.ok;
      return res.ok;
    } catch {
      this.isAvailable = false;
      return false;
    }
  }

  public async upsert(records: VectorRecord[]): Promise<void> {
    if (!this.isAvailable || records.length === 0) return;

    const points = records.map((r, idx) => ({
      id: idx + 1,
      vector: r.vector,
      payload: {
        chunkId: r.id,
        chunk: r.chunk,
        metadata: r.metadata,
      },
    }));

    await fetch(`${this.url}/collections/${this.collectionName}/points`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points }),
    });
  }

  public async delete(chunkIds: string[]): Promise<void> {
    if (!this.isAvailable) return;
    // Delete points via filter
    await fetch(`${this.url}/collections/${this.collectionName}/points/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filter: {
          must: [
            {
              key: "chunkId",
              match: { any: chunkIds },
            },
          ],
        },
      }),
    });
  }

  public async deleteByDocumentId(documentId: string): Promise<void> {
    if (!this.isAvailable) return;
    await fetch(`${this.url}/collections/${this.collectionName}/points/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filter: {
          must: [
            {
              key: "metadata.documentId",
              match: { value: documentId },
            },
          ],
        },
      }),
    });
  }

  public async search(
    queryVector: number[],
    topK = 30,
    minScore = 0.15
  ): Promise<DenseResult[]> {
    if (!this.isAvailable) return [];

    try {
      const res = await fetch(`${this.url}/collections/${this.collectionName}/points/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vector: queryVector,
          limit: topK,
          score_threshold: minScore,
          with_payload: true,
        }),
      });

      if (!res.ok) return [];
      const data = await res.json();
      if (!data.result || !Array.isArray(data.result)) return [];

      const hits = data.result as QdrantSearchHit[];
      return hits.map((pt, idx: number) => ({
        chunk: pt.payload.chunk,
        score: pt.score,
        rank: idx + 1,
      }));
    } catch {
      return [];
    }
  }

  public async count(): Promise<number> {
    if (!this.isAvailable) return 0;
    try {
      const res = await fetch(`${this.url}/collections/${this.collectionName}`);
      if (!res.ok) return 0;
      const data = await res.json();
      return data.result?.points_count || 0;
    } catch {
      return 0;
    }
  }

  public async clear(): Promise<void> {
    if (!this.isAvailable) return;
    await fetch(`${this.url}/collections/${this.collectionName}`, {
      method: "DELETE",
    });
    await this.init();
  }
}
