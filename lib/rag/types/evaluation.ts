export interface EvalQuery {
  id: string;
  query: string;
  category: "vortex" | "projects" | "ml" | "tech_stack" | "experience" | "contact" | "negative_injection";
  expectedDocumentIds: string[];
  expectedKeywords: string[];
  expectedAnswerSubstring?: string;
  shouldRefuse?: boolean; // For negative / out-of-domain queries
  relevanceJudgments: Record<string, number>; // documentId -> graded relevance (0 = irrelevant, 1 = partially relevant, 2 = highly relevant, 3 = perfect match)
}

export interface RetrievalMetrics {
  recallAtK: Record<number, number>; // e.g. { 1: 0.7, 3: 0.85, 5: 0.95 }
  precisionAtK: Record<number, number>; // e.g. { 1: 0.7, 3: 0.6, 5: 0.45 }
  mrr: number; // Mean Reciprocal Rank
  ndcgAtK: Record<number, number>; // Normalized Discounted Cumulative Gain
}

export interface RerankingMetrics {
  mrrBefore: number;
  mrrAfter: number;
  mrrDelta: number;
  ndcgBefore: number;
  ndcgAfter: number;
  ndcgDelta: number;
}

export interface GenerationMetrics {
  citationAccuracy: number; // 0 to 1 (% of citations that exist in retrieved evidence)
  groundednessScore: number; // 0 to 1 (hallucination check)
  answerRelevance: number; // 0 to 1 (keyword & intent coverage)
  unsupportedClaimRate: number; // 0 to 1 (lower is better)
  refusalAccuracy: number; // 0 to 1 (for negative/out-of-domain queries)
}

export interface PerformanceMetrics {
  avgIndexingLatencyMs: number;
  avgQueryUnderstandingLatencyMs: number;
  avgDenseRetrievalLatencyMs: number;
  avgBM25RetrievalLatencyMs: number;
  avgRRFLatencyMs: number;
  avgRerankingLatencyMs: number;
  avgContextAssemblyLatencyMs: number;
  avgGenerationLatencyMs: number;
  avgTotalLatencyMs: number;
  cacheHitRate: number;
}

export interface ConfigurationBenchmarkResult {
  configurationName: string;
  description: string;
  retrieval: RetrievalMetrics;
  reranking?: RerankingMetrics;
  generation: GenerationMetrics;
  performance: PerformanceMetrics;
  passedCount: number;
  totalCount: number;
  timestamp: number;
}

export interface BenchmarkComparison {
  testedAt: number;
  datasetSize: number;
  configurations: {
    denseOnly: ConfigurationBenchmarkResult;
    bm25Only: ConfigurationBenchmarkResult;
    hybridRRF: ConfigurationBenchmarkResult;
    hybridReranker: ConfigurationBenchmarkResult;
    hybridRerankerQueryExpansion: ConfigurationBenchmarkResult;
  };
  summary: {
    bestRetrievalConfig: string;
    bestGroundednessConfig: string;
    rerankerImprovementPct: number;
    hybridVsDenseGainPct: number;
  };
}
