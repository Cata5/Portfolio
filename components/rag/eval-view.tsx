"use client";

import { useRAG } from "./rag-context";
import { Play, BarChart3, AlertTriangle } from "lucide-react";

export function EvalView() {
  const { evalComparison, runEvaluation, isEvaluating, evalError } = useRAG();

  const configs = evalComparison ? Object.values(evalComparison.configurations) : [];
  const bestMrr = configs.length > 0 ? Math.max(...configs.map((c) => c.retrieval.mrr)) : 0;
  const bestMrrName =
    configs.find((c) => c.retrieval.mrr === bestMrr)?.configurationName ?? "—";
  const bestRecallAt5 =
    configs.length > 0 ? Math.max(...configs.map((c) => c.retrieval.recallAtK[5] ?? 0)) : 0;
  const citationAccuracy =
    evalComparison?.configurations.hybridRerankerQueryExpansion.generation.citationAccuracy;
  const pct = (v: number | undefined, digits = 1) =>
    v === undefined || Number.isNaN(v) ? "—" : `${(v * 100).toFixed(digits)}%`;

  return (
    <div data-lenis-prevent className="h-full overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
      {/* Header & Run Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-saffron">
            RAG Performance & Quality Evaluation
          </span>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            Multi-Configuration Benchmark
          </h2>
        </div>
        <button
          type="button"
          onClick={runEvaluation}
          disabled={isEvaluating}
          className="inline-flex items-center gap-2 rounded-lg bg-signal px-4 py-2 font-mono text-[12px] font-semibold text-signal-ink transition-opacity disabled:opacity-50 hover:opacity-90"
        >
          <Play className={`size-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
          {isEvaluating ? "Running Benchmark..." : "Run Evaluation"}
        </button>
      </div>

      {evalError && !isEvaluating && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/50 bg-destructive/10 p-3.5 font-mono text-xs text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="leading-snug">{evalError}</span>
        </div>
      )}

      {!evalComparison && !isEvaluating ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center space-y-3">
          <BarChart3 className="size-12 mx-auto text-muted-foreground/40" />
          <h3 className="text-base font-medium">Ready to Evaluate Configurations</h3>
          <p className="max-w-md mx-auto text-sm text-muted-foreground">
            Click &ldquo;Run Evaluation&rdquo; to execute the test suite across Configurations A (Dense), B (BM25), C (Hybrid+RRF), D (Hybrid+RRF+Reranker), and E (Full Pipeline).
          </p>
        </div>
      ) : isEvaluating ? (
        <div className="rounded-2xl border border-border/50 bg-card/60 p-12 text-center space-y-4">
          <div className="size-10 mx-auto border-2 border-signal border-t-transparent animate-spin rounded-full" />
          <h3 className="text-base font-medium">Running 17 Ground-Truth Benchmark Queries...</h3>
          <p className="text-sm font-mono text-muted-foreground">
            Measuring Recall@K, Precision@K, MRR, nDCG, Groundedness, and Latency...
          </p>
        </div>
      ) : (
        evalComparison && (
          <div className="space-y-6">
            {/* Benchmark Summary Callout */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-border/50 bg-card/60 p-4">
                <span className="font-mono text-[10px] uppercase text-muted-foreground">Highest MRR</span>
                <p className="mt-1 font-mono text-lg font-semibold text-signal">
                  {bestMrr.toFixed(3)}
                </p>
                <span className="font-mono text-[10px] text-muted-foreground">{bestMrrName}</span>
              </div>

              <div className="rounded-xl border border-border/50 bg-card/60 p-4">
                <span className="font-mono text-[10px] uppercase text-muted-foreground">Top Recall@5</span>
                <p className="mt-1 font-mono text-lg font-semibold text-saffron">
                  {pct(bestRecallAt5)}
                </p>
                <span className="font-mono text-[10px] text-muted-foreground">Best configuration</span>
              </div>

              <div className="rounded-xl border border-border/50 bg-card/60 p-4">
                <span className="font-mono text-[10px] uppercase text-muted-foreground">Citation Accuracy</span>
                <p className="mt-1 font-mono text-lg font-semibold text-signal">
                  {pct(citationAccuracy, 0)}
                </p>
                <span className="font-mono text-[10px] text-muted-foreground">Full pipeline generation</span>
              </div>

              <div className="rounded-xl border border-border/50 bg-card/60 p-4">
                <span className="font-mono text-[10px] uppercase text-muted-foreground">Avg Latency</span>
                <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                  {evalComparison.configurations.hybridRerankerQueryExpansion.performance.avgTotalLatencyMs} ms
                </p>
                <span className="font-mono text-[10px] text-muted-foreground">Full Pipeline</span>
              </div>
            </div>

            {/* Comparative Metrics Table */}
            <div className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-4">
              <h3 className="font-mono text-[12px] uppercase tracking-wider text-muted-foreground">
                Configuration Comparison Matrix
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-[12px]">
                  <thead>
                    <tr className="border-b border-border/50 text-left text-muted-foreground">
                      <th className="pb-3 font-semibold">Configuration</th>
                      <th className="pb-3 text-center">Recall@3</th>
                      <th className="pb-3 text-center">Recall@5</th>
                      <th className="pb-3 text-center">Precision@3</th>
                      <th className="pb-3 text-center">MRR</th>
                      <th className="pb-3 text-center">nDCG@5</th>
                      <th className="pb-3 text-center">Groundedness</th>
                      <th className="pb-3 text-right">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {Object.values(evalComparison.configurations).map((cfg) => (
                      <tr key={cfg.configurationName} className="hover:bg-muted/30">
                        <td className="py-3 font-semibold text-foreground">{cfg.configurationName}</td>
                        <td className="py-3 text-center text-muted-foreground">{(cfg.retrieval.recallAtK[3] * 100).toFixed(1)}%</td>
                        <td className="py-3 text-center text-muted-foreground">{(cfg.retrieval.recallAtK[5] * 100).toFixed(1)}%</td>
                        <td className="py-3 text-center text-muted-foreground">{(cfg.retrieval.precisionAtK[3] * 100).toFixed(1)}%</td>
                        <td className="py-3 text-center font-semibold text-signal">{cfg.retrieval.mrr.toFixed(3)}</td>
                        <td className="py-3 text-center text-muted-foreground">{cfg.retrieval.ndcgAtK[5].toFixed(3)}</td>
                        <td className="py-3 text-center text-saffron">{(cfg.generation.groundednessScore * 100).toFixed(1)}%</td>
                        <td className="py-3 text-right text-muted-foreground">{cfg.performance.avgTotalLatencyMs} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
