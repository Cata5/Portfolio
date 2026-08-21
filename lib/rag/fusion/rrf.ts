import type { BM25Result, DenseResult, FusedResult } from "../types/retrieval";
import type { Chunk } from "../types/document";

export interface RRFOptions {
  k?: number; // default: 60
  denseWeight?: number; // default: 0.5
  bm25Weight?: number; // default: 0.5
  topK?: number; // default: 30
}

export function reciprocalRankFusion(
  denseResults: DenseResult[],
  bm25Results: BM25Result[],
  options: RRFOptions = {}
): FusedResult[] {
  const k = options.k ?? 60;
  const denseWeight = options.denseWeight ?? 0.5;
  const bm25Weight = options.bm25Weight ?? 0.5;
  const topK = options.topK ?? 30;

  const fusedMap = new Map<
    string,
    {
      chunk: Chunk;
      rrfScore: number;
      denseRank?: number;
      denseScore?: number;
      bm25Rank?: number;
      bm25Score?: number;
    }
  >();

  // Add Dense ranks
  for (let i = 0; i < denseResults.length; i++) {
    const res = denseResults[i];
    const rank = i + 1;
    const scoreComponent = denseWeight / (k + rank);

    const existing = fusedMap.get(res.chunk.id) || {
      chunk: res.chunk,
      rrfScore: 0,
    };
    existing.rrfScore += scoreComponent;
    existing.denseRank = rank;
    existing.denseScore = res.score;
    fusedMap.set(res.chunk.id, existing);
  }

  // Add BM25 ranks
  for (let i = 0; i < bm25Results.length; i++) {
    const res = bm25Results[i];
    const rank = i + 1;
    const scoreComponent = bm25Weight / (k + rank);

    const existing = fusedMap.get(res.chunk.id) || {
      chunk: res.chunk,
      rrfScore: 0,
    };
    existing.rrfScore += scoreComponent;
    existing.bm25Rank = rank;
    existing.bm25Score = res.score;
    fusedMap.set(res.chunk.id, existing);
  }

  const results: FusedResult[] = Array.from(fusedMap.values()).map((entry) => ({
    chunk: entry.chunk,
    rrfScore: entry.rrfScore,
    rank: 0,
    denseRank: entry.denseRank,
    denseScore: entry.denseScore,
    bm25Rank: entry.bm25Rank,
    bm25Score: entry.bm25Score,
  }));

  // Sort by RRF score descending
  results.sort((a, b) => b.rrfScore - a.rrfScore);

  const sliced = results.slice(0, topK);
  for (let i = 0; i < sliced.length; i++) {
    sliced[i].rank = i + 1;
  }

  return sliced;
}
