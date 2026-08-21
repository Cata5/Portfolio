import type { ModelConfig } from "./models";

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface RetrievalConfig {
  denseTopK: number; // default: 30
  bm25TopK: number; // default: 30
  denseThreshold: number; // default: 0.15
  bm25Threshold: number; // default: 0.05
  enableMultiQuery: boolean; // default: true
  maxQueryVariants: number; // default: 3
}

export interface FusionConfig {
  rrfK: number; // default: 60
  denseWeight: number; // default: 0.5
  bm25Weight: number; // default: 0.5
  candidatePoolSize: number; // default: 30
}

export interface RerankerConfig {
  enabled: boolean; // default: true
  topCandidates: number; // default: 25
  finalTopK: number; // default: 8
  minScoreThreshold: number; // default: 0.1
  batchSize: number; // default: 16
}

export interface ContextBudgetConfig {
  maxContextTokens: number; // default: 3072
  reservedGenerationTokens: number; // default: 1024
  targetChunkTokens: number; // default: 250
  chunkOverlapTokens: number; // default: 40
  enableParentContextExpansion: boolean; // default: true
}

export interface IndexingConfig {
  chunkSizeTokens: number; // default: 250
  chunkOverlapTokens: number; // default: 40
  batchSize: number; // default: 32
  enableIncremental: boolean; // default: true
  enableEmbeddingCache: boolean; // default: true
  autoScanIntervalMinutes: number; // default: 0 (disabled)
}

export interface RAGConfig {
  models: ModelConfig;
  retrieval: RetrievalConfig;
  fusion: FusionConfig;
  reranker: RerankerConfig;
  context: ContextBudgetConfig;
  indexing: IndexingConfig;
  debug: boolean;
}
