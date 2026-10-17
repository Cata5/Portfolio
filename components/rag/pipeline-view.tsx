"use client";

import { useRAG } from "./rag-context";
import { ArrowDown, Layers } from "lucide-react";

export function PipelineView() {
  const { diagnostics, messages } = useRAG();

  // Find latest message with diagnostics if not in active state
  const latestDiag =
    diagnostics ||
    messages.slice().reverse().find((m) => m.diagnostics)?.diagnostics;

  if (!latestDiag) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <Layers className="size-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-medium">No Pipeline Diagnostics Yet</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Ask a question in the Chat tab to view real-time intermediate scores,
          dense vs BM25 rankings, RRF fusion, and cross-encoder scores!
        </p>
      </div>
    );
  }

  const timings = latestDiag.timings || {};

  return (
    <div data-lenis-prevent className="h-full overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-8">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-saffron">
            Query Pipeline Trace
          </span>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            &ldquo;{latestDiag.query}&rdquo;
          </h2>
        </div>
        <span className="font-mono text-[12px] text-muted-foreground">
          Total Latency: {timings.totalMs || 0} ms
        </span>
      </div>

      {/* Latency Timing Breakdown */}
      <div className="rounded-xl border border-border/50 bg-card/60 p-4">
        <h3 className="font-mono text-[12px] uppercase tracking-wider text-muted-foreground mb-3">
          Per-Stage Latency Breakdown
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-background/80 p-2.5">
            <span className="text-[10px] uppercase font-mono text-muted-foreground">Dense Search</span>
            <p className="mt-1 font-mono text-sm font-semibold text-foreground">{timings.denseRetrievalMs || 0} ms</p>
          </div>
          <div className="rounded-lg bg-background/80 p-2.5">
            <span className="text-[10px] uppercase font-mono text-muted-foreground">BM25 Search</span>
            <p className="mt-1 font-mono text-sm font-semibold text-foreground">{timings.bm25RetrievalMs || 0} ms</p>
          </div>
          <div className="rounded-lg bg-background/80 p-2.5">
            <span className="text-[10px] uppercase font-mono text-muted-foreground">RRF Fusion</span>
            <p className="mt-1 font-mono text-sm font-semibold text-foreground">{timings.fusionMs || 0} ms</p>
          </div>
          <div className="rounded-lg bg-background/80 p-2.5">
            <span className="text-[10px] uppercase font-mono text-muted-foreground">Cross-Encoder</span>
            <p className="mt-1 font-mono text-sm font-semibold text-foreground">{timings.rerankingMs || 0} ms</p>
          </div>
        </div>
      </div>

      {/* Step 1: Multi-Query Expansions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 font-mono text-[12px] font-semibold text-saffron">
          <span>1. Query Understanding &amp; Multi-Query Expansion</span>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/60 p-4 font-mono text-[12px] space-y-1.5">
          <p className="text-muted-foreground">Normalized Query: <span className="text-foreground">{latestDiag.normalizedQuery}</span></p>
          {latestDiag.rewrittenQueries && latestDiag.rewrittenQueries.length > 0 && (
            <div>
              <span className="text-muted-foreground">Retrieved Across Query Variants:</span>
              <ul className="mt-1 list-disc pl-5 space-y-1 text-foreground/90">
                {latestDiag.rewrittenQueries.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center text-muted-foreground/60"><ArrowDown className="size-4" /></div>

      {/* Step 2: Dense vs BM25 Top Matches */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 font-mono text-[12px] font-semibold text-signal">
          <span>
            2. Parallel Hybrid Retrieval: Dense (Cosine) &amp; Lexical (BM25)
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Dense Results */}
          <div className="rounded-xl border border-border/50 bg-card/60 p-4">
            <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2">
              <span className="font-mono text-[12px] font-semibold text-signal">Dense Vector Matches</span>
              <span className="font-mono text-[10px] text-muted-foreground">{latestDiag.denseResults.length} candidates</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[11px]">
              {latestDiag.denseResults.slice(0, 5).map((d) => (
                <div key={d.chunkId} className="flex items-center justify-between border-b border-border/30 pb-1.5">
                  <div className="truncate pr-2">
                    <span className="text-signal font-semibold">#{d.rank}</span> {d.title}
                  </div>
                  <span className="text-muted-foreground shrink-0">{d.score.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* BM25 Results */}
          <div className="rounded-xl border border-border/50 bg-card/60 p-4">
            <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2">
              <span className="font-mono text-[12px] font-semibold text-saffron">BM25 Lexical Matches</span>
              <span className="font-mono text-[10px] text-muted-foreground">{latestDiag.bm25Results.length} candidates</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[11px]">
              {latestDiag.bm25Results.slice(0, 5).map((b) => (
                <div key={b.chunkId} className="flex items-center justify-between border-b border-border/30 pb-1.5">
                  <div className="truncate pr-2">
                    <span className="text-saffron font-semibold">#{b.rank}</span> {b.title}
                  </div>
                  <span className="text-muted-foreground shrink-0">{b.score.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center text-muted-foreground/60"><ArrowDown className="size-4" /></div>

      {/* Step 3: RRF Fusion & Cross-Encoder Reranking */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 font-mono text-[12px] font-semibold text-foreground">
          <span>3. Reciprocal Rank Fusion &amp; Cross-Encoder Reranker</span>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/60 p-4">
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[11px]">
              <thead>
                <tr className="border-b border-border/50 text-left text-muted-foreground">
                  <th className="pb-2">Chunk Title</th>
                  <th className="pb-2">RRF Rank</th>
                  <th className="pb-2">RRF Score</th>
                  <th className="pb-2">Rerank Score</th>
                  <th className="pb-2">Final Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {latestDiag.rerankedResults.slice(0, 8).map((r) => {
                  const fused = latestDiag.fusedResults.find((f) => f.chunkId === r.chunkId);
                  return (
                    <tr key={r.chunkId} className="hover:bg-muted/30">
                      <td className="py-2 truncate max-w-[200px] text-foreground">{r.title}</td>
                      <td className="py-2 text-muted-foreground">{fused?.denseRank ? `#${fused.denseRank}` : "-"}</td>
                      <td className="py-2 text-muted-foreground">{fused?.rrfScore.toFixed(4) || "-"}</td>
                      <td className="py-2 font-semibold text-signal">{r.rerankerScore.toFixed(3)}</td>
                      <td className="py-2 font-semibold text-saffron">#{r.rank}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex justify-center text-muted-foreground/60"><ArrowDown className="size-4" /></div>

      {/* Step 4: Final Token Budget & Grounded Evidence */}
      <div className="space-y-3 pb-6">
        <div className="flex items-center gap-2 font-mono text-[12px] font-semibold text-signal">
          <span>4. Token Budget Allocation &amp; Final Grounded Evidence</span>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/60 p-4 font-mono text-[12px] space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Context Budget Usage:</span>
            <span className="text-foreground font-semibold">
              {latestDiag.tokenBudget.usedTokens} / {latestDiag.tokenBudget.maxTokens} tokens
            </span>
          </div>
          <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border/50">
            <div
              className="bg-signal h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (latestDiag.tokenBudget.usedTokens / latestDiag.tokenBudget.maxTokens) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground pt-1">
            {latestDiag.finalEvidence.length} evidence blocks selected with deterministic delimiters and prompt-injection defenses.
          </p>
        </div>
      </div>
    </div>
  );
}
