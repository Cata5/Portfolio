export interface EmbeddingProviderHealth {
  /**
   * Which vectors the provider is actually producing right now:
   * `server` = real embeddings, `hash-fallback` = deterministic local
   * substitution (degraded retrieval), `unknown` = nothing embedded yet.
   */
  mode: "server" | "hash-fallback" | "unknown";
  /** Last observed server state (`null` = not probed yet). */
  serverOk: boolean | null;
  /** How many deterministic fallback vectors this instance has produced. */
  fallbackEmbeddings: number;
  cacheEnabled: boolean;
}

export interface IEmbeddingProvider {
  readonly modelName: string;
  readonly dimension: number;
  embedText(text: string): Promise<number[]>;
  embedBatch(texts: string[], batchSize?: number): Promise<number[][]>;
  healthCheck(): Promise<boolean>;
  /** Optional diagnostics for status reporting (not all providers implement it). */
  getHealth?(): EmbeddingProviderHealth;
}

export interface IRerankerProvider {
  readonly modelName: string;
  rerank(
    query: string,
    candidates: { id: string; text: string }[],
    topK?: number
  ): Promise<{ id: string; score: number }[]>;
  healthCheck(): Promise<boolean>;
}

export interface GenerationChunk {
  delta: string;
  done: boolean;
}

export interface IGenerationProvider {
  readonly modelName: string;
  generate(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
      stopSequences?: string[];
    }
  ): Promise<string>;
  generateStream(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
      stopSequences?: string[];
      onDelta?: (delta: string) => void;
    }
  ): Promise<ReadableStream<GenerationChunk> | AsyncIterable<GenerationChunk>>;
  healthCheck(): Promise<boolean>;
}

export interface ModelConfig {
  embeddingProvider: "openai-compatible" | "ollama" | "local-deterministic" | "qdrant-fast";
  embeddingBaseUrl: string;
  embeddingModel: string;
  embeddingDimension: number;

  rerankerProvider: "openai-compatible" | "local-cross-encoder" | "llm-prompt" | "lexical-semantic";
  rerankerBaseUrl: string;
  rerankerModel: string;

  generationProvider: "openai-compatible" | "ollama" | "local-synthesis";
  generationBaseUrl: string;
  generationModel: string;
  apiKey?: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  repeatPenalty?: number;
}

export interface HardwareSpec {
  platform: string;
  arch: string;
  cpuCores: number;
  totalMemoryMB: number;
  freeMemoryMB: number;
  hasGpu: boolean;
  gpuName?: string;
  recommendedBatchSize: number;
  recommendedMaxContext: number;
}
