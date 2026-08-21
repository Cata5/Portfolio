import { normalizeQuery } from "./query-normalizer";
import { generateQueryVariants } from "./query-rewriter";
import { DenseRetriever } from "./dense-retriever";
import { defaultBM25Engine } from "../lexical/bm25";
import { reciprocalRankFusion } from "../fusion/rrf";
import type { IVectorStore } from "../storage/interface";
import type { IEmbeddingProvider } from "../embeddings/interface";
import type { IRerankerProvider } from "../reranking/interface";
import { defaultVectorStore } from "../storage/memory-store";
import { OpenAICompatibleEmbeddingProvider } from "../embeddings/qwen-embedding";
import { QwenRerankerProvider } from "../reranking/qwen-reranker";
import { getRAGConfig } from "../config";
import type {
  BM25Result,
  DenseResult,
  FusedResult,
  RerankedResult,
  RetrievalDiagnostics,
  RetrievalQuery,
} from "../types/retrieval";

export interface HybridRetrievalResult {
  query: RetrievalQuery;
  denseResults: DenseResult[];
  bm25Results: BM25Result[];
  fusedResults: FusedResult[];
  rerankedResults: RerankedResult[];
  diagnostics: Partial<RetrievalDiagnostics>;
  timings: {
    queryUnderstandingMs: number;
    denseRetrievalMs: number;
    bm25RetrievalMs: number;
    fusionMs: number;
    rerankingMs: number;
  };
}

export class HybridRetriever {
  private denseRetriever: DenseRetriever;
  private reranker: IRerankerProvider;

  constructor(
    vectorStore?: IVectorStore,
    embeddingProvider?: IEmbeddingProvider,
    reranker?: IRerankerProvider
  ) {
    const config = getRAGConfig();
    const vStore = vectorStore || defaultVectorStore;
    const emb =
      embeddingProvider ||
      new OpenAICompatibleEmbeddingProvider({
        baseUrl: config.models.embeddingBaseUrl,
        modelName: config.models.embeddingModel,
        dimension: config.models.embeddingDimension,
      });

    this.denseRetriever = new DenseRetriever(vStore, emb);
    this.reranker =
      reranker ||
      new QwenRerankerProvider({
        baseUrl: config.models.rerankerBaseUrl,
        modelName: config.models.rerankerModel,
      });
  }

  public async retrieve(
    userQuery: string,
    options?: {
      denseTopK?: number;
      bm25TopK?: number;
      enableMultiQuery?: boolean;
      enableReranker?: boolean;
      finalTopK?: number;
      history?: import("../types/retrieval").HistoryTurn[];
    }
  ): Promise<HybridRetrievalResult> {
    const config = getRAGConfig();
    const denseTopK = options?.denseTopK ?? config.retrieval.denseTopK;
    const bm25TopK = options?.bm25TopK ?? config.retrieval.bm25TopK;
    const enableMultiQuery = options?.enableMultiQuery ?? config.retrieval.enableMultiQuery;
    const enableReranker = options?.enableReranker ?? config.reranker.enabled;
    const finalTopK = options?.finalTopK ?? config.reranker.finalTopK;

    // 1. Query understanding & normalization
    const t0 = Date.now();
    const query = normalizeQuery(userQuery);
    query.history = options?.history;
    const variants = enableMultiQuery
      ? generateQueryVariants(query, config.retrieval.maxQueryVariants)
      : [query.normalizedQuery];
    query.rewrittenQueries = variants;
    const queryUnderstandingMs = Date.now() - t0;

    // 2. Parallel Dense & BM25 Retrieval across query variants
    const t1 = Date.now();
    const densePromises = variants.map((v) =>
      this.denseRetriever.retrieve(v, denseTopK, config.retrieval.denseThreshold)
    );
    const denseBatches = await Promise.all(densePromises);
    const denseRetrievalMs = Date.now() - t1;

    const t2 = Date.now();
    const bm25Batches = variants.map((v) =>
      defaultBM25Engine.search(v, bm25TopK, config.retrieval.bm25Threshold)
    );
    const bm25RetrievalMs = Date.now() - t2;

    // Merge dense batches by highest score
    const denseMap = new Map<string, DenseResult>();
    for (const batch of denseBatches) {
      for (const res of batch) {
        const existing = denseMap.get(res.chunk.id);
        if (!existing || res.score > existing.score) {
          denseMap.set(res.chunk.id, res);
        }
      }
    }
    const denseResults = Array.from(denseMap.values()).sort((a, b) => b.score - a.score);
    for (let i = 0; i < denseResults.length; i++) denseResults[i].rank = i + 1;

    // Merge BM25 batches by highest score
    const bm25Map = new Map<string, BM25Result>();
    for (const batch of bm25Batches) {
      for (const res of batch) {
        const existing = bm25Map.get(res.chunk.id);
        if (!existing || res.score > existing.score) {
          bm25Map.set(res.chunk.id, res);
        }
      }
    }
    const bm25Results = Array.from(bm25Map.values()).sort((a, b) => b.score - a.score);
    for (let i = 0; i < bm25Results.length; i++) bm25Results[i].rank = i + 1;

    // 3. Reciprocal Rank Fusion (RRF)
    const t3 = Date.now();
    const fusedResults = reciprocalRankFusion(denseResults, bm25Results, {
      k: config.fusion.rrfK,
      denseWeight: config.fusion.denseWeight,
      bm25Weight: config.fusion.bm25Weight,
      topK: config.fusion.candidatePoolSize,
    });
    const fusionMs = Date.now() - t3;

    // 4. Cross-Encoder Reranking
    const t4 = Date.now();
    let rerankedResults: RerankedResult[] = [];

    if (enableReranker && fusedResults.length > 0) {
      const candidates = fusedResults
        .slice(0, config.reranker.topCandidates)
        .map((f) => ({ id: f.chunk.id, text: f.chunk.content }));

      const scores = await this.reranker.rerank(
        query.normalizedQuery,
        candidates,
        finalTopK
      );

      const scoreMap = new Map(scores.map((s) => [s.id, s.score]));

      for (const f of fusedResults) {
        if (scoreMap.has(f.chunk.id)) {
          const rScore = scoreMap.get(f.chunk.id)!;
          if (rScore >= config.reranker.minScoreThreshold) {
            rerankedResults.push({
              chunk: f.chunk,
              rerankerScore: rScore,
              rank: 0,
              initialRank: f.rank,
              rrfScore: f.rrfScore,
              denseScore: f.denseScore,
              bm25Score: f.bm25Score,
            });
          }
        }
      }

      rerankedResults.sort((a, b) => b.rerankerScore - a.rerankerScore);
      rerankedResults = rerankedResults.slice(0, finalTopK);
      for (let i = 0; i < rerankedResults.length; i++) {
        rerankedResults[i].rank = i + 1;
      }
    } else {
      // Fallback to top RRF items as reranked
      rerankedResults = fusedResults.slice(0, finalTopK).map((f, i) => ({
        chunk: f.chunk,
        rerankerScore: f.rrfScore,
        rank: i + 1,
        initialRank: f.rank,
        rrfScore: f.rrfScore,
        denseScore: f.denseScore,
        bm25Score: f.bm25Score,
      }));
    }
    const rerankingMs = Date.now() - t4;

    const diagnostics: Partial<RetrievalDiagnostics> = {
      query: userQuery,
      normalizedQuery: query.normalizedQuery,
      rewrittenQueries: query.rewrittenQueries,
      denseResults: denseResults.slice(0, 15).map((d) => ({
        chunkId: d.chunk.id,
        title: d.chunk.metadata.title,
        score: d.score,
        rank: d.rank,
        snippet: d.chunk.cleanContent.slice(0, 120),
      })),
      bm25Results: bm25Results.slice(0, 15).map((b) => ({
        chunkId: b.chunk.id,
        title: b.chunk.metadata.title,
        score: b.score,
        rank: b.rank,
        snippet: b.chunk.cleanContent.slice(0, 120),
      })),
      fusedResults: fusedResults.slice(0, 15).map((f) => ({
        chunkId: f.chunk.id,
        title: f.chunk.metadata.title,
        rrfScore: f.rrfScore,
        denseRank: f.denseRank,
        bm25Rank: f.bm25Rank,
      })),
      rerankedResults: rerankedResults.map((r) => ({
        chunkId: r.chunk.id,
        title: r.chunk.metadata.title,
        rerankerScore: r.rerankerScore,
        rank: r.rank,
      })),
    };

    return {
      query,
      denseResults,
      bm25Results,
      fusedResults,
      rerankedResults,
      diagnostics,
      timings: {
        queryUnderstandingMs,
        denseRetrievalMs,
        bm25RetrievalMs,
        fusionMs,
        rerankingMs,
      },
    };
  }
}

export const hybridRetriever = new HybridRetriever();
