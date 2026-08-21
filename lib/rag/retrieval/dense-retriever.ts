import type { DenseResult } from "../types/retrieval";
import type { IVectorStore } from "../storage/interface";
import type { IEmbeddingProvider } from "../embeddings/interface";

export class DenseRetriever {
  private vectorStore: IVectorStore;
  private embeddingProvider: IEmbeddingProvider;

  constructor(vectorStore: IVectorStore, embeddingProvider: IEmbeddingProvider) {
    this.vectorStore = vectorStore;
    this.embeddingProvider = embeddingProvider;
  }

  public async retrieve(
    query: string,
    topK = 30,
    minScore = 0.15,
    filter?: { fileTypes?: string[]; documentIds?: string[] }
  ): Promise<DenseResult[]> {
    if (!query || query.trim().length === 0) return [];
    const queryVector = await this.embeddingProvider.embedText(query);
    return this.vectorStore.search(queryVector, topK, minScore, filter);
  }
}
