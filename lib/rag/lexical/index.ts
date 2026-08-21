import { BM25Engine, defaultBM25Engine } from "./bm25";
import type { Chunk } from "../types/document";

export class LexicalIndexManager {
  private engine: BM25Engine;

  constructor(engine: BM25Engine = defaultBM25Engine) {
    this.engine = engine;
  }

  public indexChunk(chunk: Chunk): void {
    this.engine.addChunk(chunk);
  }

  public indexChunks(chunks: Chunk[]): void {
    this.engine.addChunks(chunks);
  }

  public deleteChunk(chunkId: string): void {
    this.engine.removeChunk(chunkId);
  }

  public deleteDocument(documentId: string): void {
    this.engine.removeDocument(documentId);
  }

  public search(query: string, topK = 30, minThreshold = 0.05) {
    return this.engine.search(query, topK, minThreshold);
  }

  public getStats() {
    return {
      indexedChunks: this.engine.getDocumentCount(),
    };
  }

  public reset(): void {
    this.engine.clear();
  }
}

export const lexicalIndex = new LexicalIndexManager();
