import type { GroundedEvidence, RetrievalDiagnostics } from "./retrieval";

export type RAGPipelineStage =
  | "query_understanding"
  | "retrieval"
  | "fusion"
  | "reranking"
  | "context_assembly"
  | "generation"
  | "citation_validation"
  | "completed"
  | "error";

export interface PipelineTimings {
  queryUnderstandingMs: number;
  denseRetrievalMs: number;
  bm25RetrievalMs: number;
  fusionMs: number;
  rerankingMs: number;
  contextAssemblyMs: number;
  generationMs: number;
  citationValidationMs: number;
  totalMs: number;
}

export type RAGStreamEvent =
  | {
      type: "status";
      stage: RAGPipelineStage;
      message: string;
      timings?: Partial<PipelineTimings>;
    }
  | {
      type: "evidence";
      evidence: GroundedEvidence[];
    }
  | {
      type: "delta";
      content: string;
    }
  | {
      type: "citations";
      citations: {
        citationId: number;
        title: string;
        filePath: string;
        heading?: string;
        preview: string;
      }[];
    }
  | {
      type: "debug";
      diagnostics: RetrievalDiagnostics;
    }
  | {
      type: "done";
      timings: PipelineTimings;
    }
  | {
      type: "error";
      message: string;
    };
