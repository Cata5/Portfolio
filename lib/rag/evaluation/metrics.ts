import type { EvalQuery, RetrievalMetrics } from "../types/evaluation";

export function computeRecallAtK(
  retrievedDocIds: string[],
  expectedDocIds: string[],
  k: number
): number {
  if (expectedDocIds.length === 0) return 1.0;
  const topKRetrieved = new Set(retrievedDocIds.slice(0, k));
  let hits = 0;
  for (const exp of expectedDocIds) {
    if (topKRetrieved.has(exp)) hits++;
  }
  return hits / expectedDocIds.length;
}

export function computePrecisionAtK(
  retrievedDocIds: string[],
  expectedDocIds: string[],
  k: number
): number {
  if (k === 0) return 0;
  const topKRetrieved = retrievedDocIds.slice(0, k);
  if (topKRetrieved.length === 0) return 0;
  const expectedSet = new Set(expectedDocIds);
  let hits = 0;
  for (const docId of topKRetrieved) {
    if (expectedSet.has(docId)) hits++;
  }
  return hits / topKRetrieved.length;
}

export function computeReciprocalRank(
  retrievedDocIds: string[],
  expectedDocIds: string[]
): number {
  if (expectedDocIds.length === 0) return 1.0;
  const expectedSet = new Set(expectedDocIds);
  for (let i = 0; i < retrievedDocIds.length; i++) {
    if (expectedSet.has(retrievedDocIds[i])) {
      return 1 / (i + 1);
    }
  }
  return 0;
}

export function computeDCGAtK(
  retrievedDocIds: string[],
  relevanceJudgments: Record<string, number>,
  k: number
): number {
  let dcg = 0;
  const slice = retrievedDocIds.slice(0, k);
  for (let i = 0; i < slice.length; i++) {
    const docId = slice[i];
    const rel = relevanceJudgments[docId] || 0;
    const gain = Math.pow(2, rel) - 1;
    const discount = Math.log2(i + 2); // log2(rank + 1), since i is 0-indexed: log2(0+2) = log2(2) = 1
    dcg += gain / discount;
  }
  return dcg;
}

export function computeIDCGAtK(
  relevanceJudgments: Record<string, number>,
  k: number
): number {
  const sortedGains = Object.values(relevanceJudgments).sort((a, b) => b - a);
  let idcg = 0;
  const len = Math.min(k, sortedGains.length);
  for (let i = 0; i < len; i++) {
    const rel = sortedGains[i];
    const gain = Math.pow(2, rel) - 1;
    const discount = Math.log2(i + 2);
    idcg += gain / discount;
  }
  return idcg;
}

export function computeNDCGAtK(
  retrievedDocIds: string[],
  relevanceJudgments: Record<string, number>,
  k: number
): number {
  const dcg = computeDCGAtK(retrievedDocIds, relevanceJudgments, k);
  const idcg = computeIDCGAtK(relevanceJudgments, k);
  if (idcg === 0) return dcg > 0 ? 1.0 : 0.0;
  return dcg / idcg;
}

export function evaluateRetrievalRun(
  evalQueries: EvalQuery[],
  resultsPerQuery: { queryId: string; retrievedDocIds: string[] }[]
): RetrievalMetrics {
  const queryMap = new Map(evalQueries.map((q) => [q.id, q]));
  const kValues = [1, 3, 5, 10];

  const totalRecall: Record<number, number> = { 1: 0, 3: 0, 5: 0, 10: 0 };
  const totalPrecision: Record<number, number> = { 1: 0, 3: 0, 5: 0, 10: 0 };
  const totalNDCG: Record<number, number> = { 1: 0, 3: 0, 5: 0, 10: 0 };
  let totalMRR = 0;
  let nonNegativeQueryCount = 0;

  for (const run of resultsPerQuery) {
    const query = queryMap.get(run.queryId);
    if (!query) continue;
    if (query.shouldRefuse) continue; // skip negative/injection tests from positive recall metrics

    nonNegativeQueryCount++;

    for (const k of kValues) {
      totalRecall[k] += computeRecallAtK(run.retrievedDocIds, query.expectedDocumentIds, k);
      totalPrecision[k] += computePrecisionAtK(run.retrievedDocIds, query.expectedDocumentIds, k);
      totalNDCG[k] += computeNDCGAtK(run.retrievedDocIds, query.relevanceJudgments, k);
    }

    totalMRR += computeReciprocalRank(run.retrievedDocIds, query.expectedDocumentIds);
  }

  const N = Math.max(1, nonNegativeQueryCount);
  const recallAtK: Record<number, number> = {};
  const precisionAtK: Record<number, number> = {};
  const ndcgAtK: Record<number, number> = {};

  for (const k of kValues) {
    recallAtK[k] = parseFloat((totalRecall[k] / N).toFixed(4));
    precisionAtK[k] = parseFloat((totalPrecision[k] / N).toFixed(4));
    ndcgAtK[k] = parseFloat((totalNDCG[k] / N).toFixed(4));
  }

  return {
    recallAtK,
    precisionAtK,
    ndcgAtK,
    mrr: parseFloat((totalMRR / N).toFixed(4)),
  };
}
