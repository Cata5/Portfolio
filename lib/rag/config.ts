import type { DeepPartial, RAGConfig } from "./types/config";
import type { ModelConfig } from "./types/models";
import { queryCache } from "./caching/query-cache";
import { stateStore } from "./storage/state-store";

export function getDefaultRAGConfig(): RAGConfig {
  const llmBaseUrl =
    process.env.LOCAL_LLM_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "http://127.0.0.1:8888/v1";

  const embeddingBaseUrl =
    process.env.LOCAL_EMBEDDING_BASE_URL ||
    llmBaseUrl;

  const rerankerBaseUrl =
    process.env.LOCAL_RERANKER_BASE_URL ||
    llmBaseUrl;

  return {
    models: {
      embeddingProvider: (process.env.RAG_EMBEDDING_PROVIDER as ModelConfig["embeddingProvider"]) || "openai-compatible",
      embeddingBaseUrl,
      embeddingModel: process.env.LOCAL_EMBEDDING_MODEL || "text-embedding-nomic-embed-text-v1.5",
      embeddingDimension: parseInt(process.env.LOCAL_EMBEDDING_DIM || "768", 10),

      rerankerProvider: (process.env.RAG_RERANKER_PROVIDER as ModelConfig["rerankerProvider"]) || "local-cross-encoder",
      rerankerBaseUrl,
      rerankerModel: process.env.LOCAL_RERANKER_MODEL || "qwen3-reranker-0.6b",

      generationProvider: (process.env.RAG_GENERATION_PROVIDER as ModelConfig["generationProvider"]) || "openai-compatible",
      generationBaseUrl: llmBaseUrl,
      generationModel: process.env.LOCAL_LLM_MODEL || "unsloth/gemma-4-E2B-it-qat-GGUF",
      apiKey: process.env.LOCAL_LLM_API_KEY || "",
      temperature: parseFloat(process.env.LOCAL_LLM_TEMPERATURE || "0.2"),
      maxTokens: parseInt(process.env.LOCAL_LLM_MAX_TOKENS || "2048", 10),
      topP: parseFloat(process.env.LOCAL_LLM_TOP_P || "0.95"),
      frequencyPenalty: parseFloat(process.env.LOCAL_LLM_FREQUENCY_PENALTY || "0.0"),
      presencePenalty: parseFloat(process.env.LOCAL_LLM_PRESENCE_PENALTY || "0.0"),
    },
    retrieval: {
      denseTopK: parseInt(process.env.RAG_DENSE_TOP_K || "30", 10),
      bm25TopK: parseInt(process.env.RAG_BM25_TOP_K || "30", 10),
      denseThreshold: parseFloat(process.env.RAG_DENSE_THRESHOLD || "0.15"),
      bm25Threshold: parseFloat(process.env.RAG_BM25_THRESHOLD || "0.05"),
      enableMultiQuery: process.env.RAG_ENABLE_MULTI_QUERY !== "false",
      maxQueryVariants: parseInt(process.env.RAG_MAX_QUERY_VARIANTS || "3", 10),
    },
    fusion: {
      rrfK: parseInt(process.env.RAG_RRF_K || "60", 10),
      denseWeight: parseFloat(process.env.RAG_DENSE_WEIGHT || "0.5"),
      bm25Weight: parseFloat(process.env.RAG_BM25_WEIGHT || "0.5"),
      candidatePoolSize: parseInt(process.env.RAG_CANDIDATE_POOL || "30", 10),
    },
    reranker: {
      enabled: process.env.RAG_RERANKER_ENABLED !== "false",
      topCandidates: parseInt(process.env.RAG_RERANKER_CANDIDATES || "25", 10),
      finalTopK: parseInt(process.env.RAG_FINAL_TOP_K || "8", 10),
      minScoreThreshold: parseFloat(process.env.RAG_RERANKER_THRESHOLD || "0.1"),
      batchSize: parseInt(process.env.RAG_RERANKER_BATCH_SIZE || "16", 10),
    },
    context: {
      maxContextTokens: parseInt(process.env.RAG_MAX_CONTEXT_TOKENS || "3072", 10),
      targetChunkTokens: parseInt(process.env.RAG_TARGET_CHUNK_TOKENS || "250", 10),
      chunkOverlapTokens: parseInt(process.env.RAG_CHUNK_OVERLAP_TOKENS || "40", 10),
      enableParentContextExpansion: process.env.RAG_PARENT_EXPANSION !== "false",
    },
    indexing: {
      batchSize: parseInt(process.env.RAG_INDEX_BATCH_SIZE || "32", 10),
      enableIncremental: process.env.RAG_INCREMENTAL !== "false",
      enableEmbeddingCache: process.env.RAG_EMBEDDING_CACHE !== "false",
    },
    debug: process.env.RAG_DEBUG === "true" || process.env.NODE_ENV !== "production",
  };
}

/** Shallow-per-section merge so partial patches never drop sibling fields. */
function mergeConfig(base: RAGConfig, patch: DeepPartial<RAGConfig> | null): RAGConfig {
  if (!patch) return base;
  return {
    ...base,
    ...patch,
    models: { ...base.models, ...(patch.models || {}) } as ModelConfig,
    retrieval: { ...base.retrieval, ...(patch.retrieval || {}) } as RAGConfig["retrieval"],
    fusion: { ...base.fusion, ...(patch.fusion || {}) } as RAGConfig["fusion"],
    reranker: { ...base.reranker, ...(patch.reranker || {}) } as RAGConfig["reranker"],
    context: { ...base.context, ...(patch.context || {}) } as RAGConfig["context"],
    indexing: { ...base.indexing, ...(patch.indexing || {}) } as RAGConfig["indexing"],
  } as RAGConfig;
}

// Console tuning survives restarts via `.rag/config.json` (keys excluded).
let activeConfig: RAGConfig = mergeConfig(getDefaultRAGConfig(), stateStore.loadConfigSync());

export function getRAGConfig(): RAGConfig {
  return activeConfig;
}

export function updateRAGConfig(patch: DeepPartial<RAGConfig>): RAGConfig {
  activeConfig = mergeConfig(activeConfig, patch);
  // Answers cached under the previous configuration are no longer valid.
  queryCache.clear();
  void stateStore.saveConfig(activeConfig);
  return activeConfig;
}
