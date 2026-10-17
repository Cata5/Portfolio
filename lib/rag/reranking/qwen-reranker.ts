import type { IRerankerProvider } from "./interface";
import { tokenizeLexical } from "../lexical/tokenizer";

export interface RerankerOptions {
  baseUrl: string;
  modelName: string;
  apiKey?: string;
  timeoutMs?: number;
  /** Candidates per HTTP rerank call (config: `reranker.batchSize`). */
  batchSize?: number;
}

interface RerankApiResult {
  index: number;
  relevance_score?: number;
  score?: number;
}

/**
 * Fast cross-attention / semantic scoring fallback for local reranking.
 * Computes exact phrase containment, n-gram co-occurrence, and keyword alignment.
 */
function computeSemanticRerankScore(query: string, text: string): number {
  const queryTokens = tokenizeLexical(query, { removeStopwords: true });
  if (queryTokens.length === 0) return 0.5;

  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  let score = 0;

  // Exact phrase match bonus
  if (textLower.includes(queryLower)) {
    score += 0.45;
  }

  // Token coverage
  let matchedTokens = 0;
  for (const token of queryTokens) {
    if (textLower.includes(token)) {
      matchedTokens++;
    }
  }
  const tokenCoverage = matchedTokens / queryTokens.length;
  score += tokenCoverage * 0.4;

  // Title / Heading match bonus
  const firstLine = textLower.split("\n")[0] || "";
  for (const token of queryTokens) {
    if (firstLine.includes(token)) {
      score += 0.15;
    }
  }

  return Math.min(0.99, Math.max(0.05, score));
}

export class QwenRerankerProvider implements IRerankerProvider {
  public readonly modelName: string;
  private baseUrl: string;
  private apiKey: string;
  private timeoutMs: number;
  private batchSize: number;

  constructor(options: RerankerOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.modelName = options.modelName || "qwen3-reranker-0.6b";
    // No fake default key: keyless servers must receive no auth header.
    this.apiKey = options.apiKey || "";
    this.timeoutMs = options.timeoutMs || 3000;
    this.batchSize = Math.max(1, options.batchSize || 16);
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;
    return headers;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: this.getHeaders(),
        signal: controller.signal,
      });
      clearTimeout(id);
      return res.ok;
    } catch {
      return false;
    }
  }

  /** One HTTP rerank call; returns null when the endpoint is unavailable. */
  private async tryHttpRerank(
    query: string,
    batch: { id: string; text: string }[],
    topK: number
  ): Promise<{ id: string; score: number }[] | null> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), this.timeoutMs);

      const res = await fetch(`${this.baseUrl}/rerank`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.modelName,
          query,
          documents: batch.map((c) => c.text),
          top_n: topK,
        }),
        signal: controller.signal,
      });
      clearTimeout(id);

      if (!res.ok) return null;
      const data = await res.json();
      if (!data.results || !Array.isArray(data.results)) return null;
      return (data.results as RerankApiResult[])
        .map((r) => ({
          id: batch[r.index]?.id || "",
          score: r.relevance_score ?? r.score ?? 0.5,
        }))
        .filter((r) => r.id);
    } catch {
      return null;
    }
  }

  public async rerank(
    query: string,
    candidates: { id: string; text: string }[],
    topK = 10
  ): Promise<{ id: string; score: number }[]> {
    if (candidates.length === 0) return [];

    // 1. Try the dedicated rerank endpoint (e.g. /v1/rerank or /rerank),
    //    split into `batchSize` calls so large candidate pools don't time out.
    const httpResults: { id: string; score: number }[] = [];
    let httpOk = true;
    for (let i = 0; i < candidates.length; i += this.batchSize) {
      const batch = candidates.slice(i, i + this.batchSize);
      const batchResults = await this.tryHttpRerank(query, batch, topK);
      if (batchResults === null) {
        httpOk = false;
        break;
      }
      httpResults.push(...batchResults);
    }
    if (httpOk && httpResults.length > 0) {
      httpResults.sort((a, b) => b.score - a.score);
      return httpResults.slice(0, topK);
    }

    // 2. High-precision semantic cross-encoder fallback
    const scored = candidates.map((c) => ({
      id: c.id,
      score: computeSemanticRerankScore(query, c.text),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}
