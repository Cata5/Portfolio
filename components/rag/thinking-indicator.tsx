"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight, Search } from "lucide-react";
import type { PipelineTimings, RAGPipelineStage } from "@/lib/rag/types/events";
import type { GroundedEvidence } from "@/lib/rag/types/retrieval";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/rag/chat-format";

/** Asterisk spinner frames, in the spirit of Claude Code's thinking line. */
const SPINNER_FRAMES = ["✢", "✳", "✶", "✻", "✽", "✻", "✶", "✳"];
const TICK_MS = 125;

interface ThinkingIndicatorProps {
  /** Current pipeline stage reported by the streaming API. */
  stage?: RAGPipelineStage;
  /** Raw stage message from the server (shown as the row tooltip). */
  stageMessage?: string;
  /** The visitor's query — shown in the expanded trace. */
  query: string;
  /** Evidence retrieved so far. */
  evidence?: GroundedEvidence[];
  /** True once answer tokens start streaming in. */
  hasContent: boolean;
  /** False once the pipeline finished (row collapses to a summary). */
  isStreaming: boolean;
  /** Phase timings, available once the `done` event arrives. */
  timings?: PipelineTimings;
}

function stageMs(stage: RAGPipelineStage, t: PipelineTimings): number {
  switch (stage) {
    case "query_understanding":
      return t.queryUnderstandingMs;
    case "retrieval":
      return t.denseRetrievalMs + t.bm25RetrievalMs;
    case "fusion":
      return t.fusionMs;
    case "reranking":
      return t.rerankingMs;
    case "context_assembly":
      return t.contextAssemblyMs;
    case "generation":
      return t.generationMs;
    case "citation_validation":
      return t.citationValidationMs;
    default:
      return 0;
  }
}

/**
 * Claude-Code-style thinking affordance: one quiet line with an animated
 * glyph and the current stage while the pipeline runs, collapsing to
 * "Thought for Xs" when done. Clicking expands the full trace — the stage
 * timeline with timings, the query that was searched, and the sources that
 * were read.
 */
export function ThinkingIndicator({
  stage,
  stageMessage,
  query,
  evidence,
  hasContent,
  isStreaming,
  timings,
}: ThinkingIndicatorProps) {
  const [expanded, setExpanded] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isStreaming) return;
    const id = window.setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => window.clearInterval(id);
  }, [isStreaming]);

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  const frame = SPINNER_FRAMES[(reducedMotion ? 3 : tick) % SPINNER_FRAMES.length];
  const elapsedSec = Math.floor((tick * TICK_MS) / 1000);

  const activeStage: RAGPipelineStage = stage ?? "query_understanding";
  const stepIndex = Math.max(STAGE_ORDER.indexOf(activeStage), 0);
  const sourceCount = evidence?.length ?? 0;
  const sourceTitles = sourceCount > 0 ? evidence!.map((e) => e.title) : [];
  const cached =
    !!timings && timings.generationMs === 0 && timings.totalMs < 150;

  const summary = !isStreaming
    ? cached
      ? "Answered instantly"
      : timings
        ? `Thought for ${(timings.totalMs / 1000).toFixed(1)}s`
        : "Thought process"
    : hasContent
      ? STAGE_LABELS.generation
      : STAGE_LABELS[activeStage] || "Thinking";

  return (
    <div className="mb-2.5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        title={stageMessage}
        className="group flex w-full items-center gap-2 text-left cursor-pointer"
      >
        <span
          aria-hidden
          className={`w-3.5 shrink-0 text-center text-[13px] leading-none ${
            isStreaming ? "text-signal" : "text-signal/60"
          }`}
        >
          {isStreaming ? frame : "✻"}
        </span>
        <span className="min-w-0 truncate text-[11.5px] italic text-muted-foreground transition-colors group-hover:text-foreground/80">
          {summary}
          {isStreaming ? "…" : ""}
        </span>
        {isStreaming && elapsedSec >= 1 && (
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground/60">
            {elapsedSec}s
          </span>
        )}
        <ChevronRight
          className={`ml-auto size-3 shrink-0 text-muted-foreground/50 transition-transform duration-200 group-hover:text-muted-foreground ${
            expanded ? "rotate-90" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5 rounded-lg border border-border/40 bg-neutral-950/40 px-2.5 py-2 animate-in fade-in slide-in-from-top-1">
          {cached ? (
            <p className="font-mono text-[10.5px] text-muted-foreground">
              Reused a cached answer — no new search was needed.
            </p>
          ) : (
            <>
              <ul className="space-y-1">
                {STAGE_ORDER.map((s, i) => {
                  const done = !isStreaming || i < stepIndex;
                  const active = isStreaming && i === stepIndex;
                  const ms = timings ? stageMs(s, timings) : 0;
                  return (
                    <li key={s} className="flex items-center gap-2 font-mono text-[10.5px] leading-none">
                      {done ? (
                        <Check className="size-3 shrink-0 text-signal/60" aria-hidden />
                      ) : active ? (
                        <span aria-hidden className="w-3 shrink-0 text-center text-[11px] text-signal">
                          {frame}
                        </span>
                      ) : (
                        <span aria-hidden className="w-3 shrink-0 text-center text-muted-foreground/40">
                          ·
                        </span>
                      )}
                      <span
                        className={
                          active
                            ? "text-signal"
                            : done
                              ? "text-muted-foreground"
                              : "text-muted-foreground/45"
                        }
                      >
                        {STAGE_LABELS[s]}
                      </span>
                      {!isStreaming && (
                        <span className="ml-auto tabular-nums text-muted-foreground/60">
                          {ms > 0 ? `${ms} ms` : ""}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="space-y-1 border-t border-border/40 pt-1.5">
                <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground">
                  <Search className="size-3 shrink-0 text-signal/60" aria-hidden />
                  <span className="truncate">“{query}”</span>
                </div>
                {sourceCount > 0 && (
                  <p className="font-mono text-[10.5px] leading-relaxed text-muted-foreground/80">
                    Read {sourceCount} source{sourceCount === 1 ? "" : "s"}:{" "}
                    <span className="text-muted-foreground">
                      {sourceTitles.slice(0, 4).join(" · ")}
                      {sourceCount > 4 ? ` +${sourceCount - 4} more` : ""}
                    </span>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
