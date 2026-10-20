"use client";

/**
 * Renders one offline-archive answer (prose, bullets, sources, run trace).
 *
 * All three standby themes show the same answer shape; only the typography
 * differs, so the structure lives in one component and each theme supplies its
 * variant. Sources and the trace line stay visible in every theme: the static
 * assistant is honest about where an answer came from.
 */

import type { OfflineBlock, OfflineSource, OfflineTrace } from "@/lib/rag/offline/types";

export type StandbyVariant = "holographic" | "cyberpunk" | "cyberdeck";

interface VariantStyles {
  text: string;
  list: string;
  item: string;
  marker: string;
  meta: string;
  metaLabel: string;
  metaLine: string;
}

const STYLES: Record<StandbyVariant, VariantStyles> = {
  holographic: {
    text: "text-xs 2xl:text-[13.5px] leading-relaxed text-foreground/90",
    list: "space-y-1.5",
    item: "text-xs 2xl:text-[13px] text-muted-foreground leading-relaxed",
    marker: "text-signal font-bold",
    meta: "rounded-xl border border-border/40 bg-card/30 px-2.5 py-2 font-mono text-[10.5px] space-y-0.5",
    metaLabel: "text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground/80",
    metaLine: "text-muted-foreground/90 leading-relaxed",
  },
  cyberpunk: {
    text: "text-xs 2xl:text-[13px] leading-relaxed text-foreground/90 font-mono",
    list: "space-y-1",
    item: "text-[11.5px] 2xl:text-xs text-muted-foreground leading-relaxed",
    marker: "text-signal font-bold",
    meta: "rounded border border-amber-500/20 bg-amber-500/5 px-2 py-1.5 text-[10.5px] space-y-0.5",
    metaLabel: "text-[9.5px] font-bold uppercase tracking-wider text-amber-300/80",
    metaLine: "text-muted-foreground leading-relaxed",
  },
  cyberdeck: {
    text: "text-xs leading-relaxed text-foreground/90 whitespace-pre-line",
    list: "space-y-0.5",
    item: "text-xs text-muted-foreground leading-relaxed",
    marker: "text-signal",
    meta: "rounded-lg border border-border/40 bg-neutral-950/40 px-2.5 py-1.5 text-[10.5px] space-y-0.5",
    metaLabel: "text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground/80",
    metaLine: "text-muted-foreground leading-relaxed",
  },
};

const MARKERS: Record<StandbyVariant, string> = {
  holographic: "•",
  cyberpunk: "•",
  cyberdeck: "→",
};

/** One honest line about how this answer was resolved. */
export function describeTrace(trace: OfflineTrace): string {
  if (trace.mode === "archive") {
    const run = trace.recordedMs ? ` · live run ${(trace.recordedMs / 1000).toFixed(1)}s` : "";
    const model = trace.model ? ` · ${trace.model.replace(/^unsloth\//, "")}` : "";
    return `ARCHIVE MATCH · pre-compiled answer${run}${model}`;
  }
  if (trace.mode === "corpus") {
    const terms = trace.matchedTerms?.length ? ` · matched: ${trace.matchedTerms.join(", ")}` : "";
    return `CORPUS SEARCH · ${trace.consulted} portfolio records${terms}`;
  }
  return `NO MATCH · ${trace.consulted} portfolio records searched`;
}

interface OfflineAnswerBodyProps {
  blocks: OfflineBlock[];
  sources?: OfflineSource[];
  trace?: OfflineTrace;
  variant: StandbyVariant;
}

export function OfflineAnswerBody({ blocks, sources = [], trace, variant }: OfflineAnswerBodyProps) {
  const styles = STYLES[variant];
  const marker = MARKERS[variant];

  return (
    <div className="space-y-2.5">
      {blocks.map((block, blockIndex) =>
        block.kind === "text" ? (
          <div key={blockIndex} className={`${styles.text} whitespace-pre-line`}>
            {block.text}
          </div>
        ) : (
          <div key={blockIndex} className={styles.list}>
            {block.items.map((item, itemIndex) => (
              <div key={itemIndex} className={`flex items-start gap-2 ${styles.item}`}>
                <span className={`${styles.marker} select-none`}>{marker}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        )
      )}

      {(sources.length > 0 || trace) && (
        <div className={styles.meta}>
          {sources.length > 0 && (
            <div className={styles.metaLabel}>
              {sources.length === 1 ? "Source" : "Sources"} · {sources.length}
            </div>
          )}
          {sources.map((source) => (
            <div key={source.citationId} className={styles.metaLine}>
              [{source.citationId}]{" "}
              {source.heading && source.heading.startsWith(source.title)
                ? source.heading
                : [source.title, source.heading].filter(Boolean).join(" — ")}{" "}
              · {source.filePath}
            </div>
          ))}
          {trace && <div className={styles.metaLine}>{describeTrace(trace)}</div>}
        </div>
      )}
    </div>
  );
}
