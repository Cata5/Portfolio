import type { Chunk, ChunkMetadata } from "../types/document";
import type { DenseResult } from "../types/retrieval";

export interface VectorRecord {
  id: string; // chunkId
  vector: number[];
  chunk: Chunk;
  metadata: ChunkMetadata;
}

export interface IVectorStore {
  readonly name: string;
  init(): Promise<void>;
  healthCheck(): Promise<boolean>;
  upsert(records: VectorRecord[]): Promise<void>;
  delete(chunkIds: string[]): Promise<void>;
  deleteByDocumentId(documentId: string): Promise<void>;
  search(
    queryVector: number[],
    topK?: number,
    minScore?: number,
    filter?: { fileTypes?: string[]; documentIds?: string[] }
  ): Promise<DenseResult[]>;
  count(): Promise<number>;
  clear(): Promise<void>;
}
