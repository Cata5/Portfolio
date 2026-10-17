import type { Chunk, ChunkMetadata } from "./document";

export interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

export interface RetrievalQuery {
  rawQuery: string;
  normalizedQuery: string;
  history?: HistoryTurn[];
  rewrittenQueries?: string[];
  detectedLanguage?: string;
  detectedIntent?: "project_detail" | "tech_stack" | "experience" | "ml_experiment" | "general" | "code_lookup";
  filters?: {
    fileTypes?: string[];
    languages?: string[];
    sources?: string[];
    tags?: string[];
  };
}

export interface DenseResult {
  chunk: Chunk;
  score: number; // Cosine similarity: [0, 1]
  rank: number;
}

export interface BM25Result {
  chunk: Chunk;
  score: number; // Raw BM25 score
  rank: number;
  matchedTerms?: string[];
}

export interface FusedResult {
  chunk: Chunk;
  rrfScore: number; // RRF fusion score
  rank: number;
  denseRank?: number;
  denseScore?: number;
  bm25Rank?: number;
  bm25Score?: number;
}

export interface RerankedResult {
  chunk: Chunk;
  rerankerScore: number; // Cross-encoder relevance score
  rank: number;
  initialRank: number;
  rrfScore: number;
  denseScore?: number;
  bm25Score?: number;
}

export interface GroundedEvidence {
  citationId: number; // 1, 2, 3...
  chunkId: string;
  documentId: string;
  title: string;
  heading?: string;
  headingPath?: string[];
  filePath: string;
  fileType: string;
  language?: string;
  content: string;
  score: number;
  metadata: ChunkMetadata;
  tokenCount: number;
}

export interface RetrievalDiagnostics {
  query: string;
  normalizedQuery: string;
  rewrittenQueries: string[];
  denseResults: { chunkId: string; title: string; score: number; rank: number; snippet: string }[];
  bm25Results: { chunkId: string; title: string; score: number; rank: number; snippet: string }[];
  fusedResults: { chunkId: string; title: string; rrfScore: number; denseRank?: number; bm25Rank?: number }[];
  rerankedResults: { chunkId: string; title: string; rerankerScore: number; rank: number }[];
  finalEvidence: GroundedEvidence[];
  timings: Record<string, number>;
  tokenBudget: {
    maxTokens: number;
    usedTokens: number;
    /** Context budget still unused after evidence assembly. */
    availableForGeneration: number;
  };
  cacheHit: boolean;
  /** Set when the query tripped the prompt-injection heuristic (evidence treated as suspect). */
  securityFlags?: string[];
}
