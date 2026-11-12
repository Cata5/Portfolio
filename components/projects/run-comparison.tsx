"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { Maximize2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RoadmapRun, RoadmapRunsSection } from "@/data/roadmap";
import { cn } from "@/lib/utils";

/**
 * Six recorded training runs of the same model on the same corpus, compared
 * side by side.
 *
 * The interesting part of this project is the delta between runs: each stage
 * adds one mechanism (attention, more heads, a feed-forward net, depth, a
 * different tokenizer) and the only record of it is the log the script
 * printed. So the section is built around three synchronized views of one
 * run - the loss curve, the terminal screenshot, and the generated text -
 * with the other five runs dimmed behind them for context.
 */

/* ---- chart geometry ----------------------------------------------------- */

const W = 100;
const H = 56;
const PAD_X = 6;
const PAD_Y = 6;
/** Loss axis domain - low enough for the 1.2 floor, high enough for Phase 2 start at 10.4. */
const LOSS_MIN = 1;
const LOSS_MAX = 11;

const x = (step: number, maxSteps: number) =>
  PAD_X + ((W - PAD_X * 2) * step) / (maxSteps || 4000);
const y = (loss: number) =>
  H - PAD_Y - ((H - PAD_Y * 2) * (loss - LOSS_MIN)) / (LOSS_MAX - LOSS_MIN);

/**
 * A decaying loss curve drawn as a single cubic: steep drop early, long tail
 * flattening out.
 */
function curvePath(run: RoadmapRun, activeMaxSteps: number) {
  const steps = run.steps || 4000;
  // Normalize run x positions against active chart step range
  const x0 = x(0, activeMaxSteps);
  const x1 = PAD_X + ((W - PAD_X * 2) * steps) / activeMaxSteps;
  const y0 = y(run.lossStart);
  const y1 = y(run.lossEnd);
  const dx = x1 - x0;
  return `M ${x0} ${y0} C ${x0 + dx * 0.28} ${y0}, ${x0 + dx * 0.55} ${y1}, ${x1} ${y1}`;
}

/* ---- rail --------------------------------------------------------------- */

function RunTab({
  run,
  selected,
  onSelect,
  buttonRef,
}: {
  run: RoadmapRun;
  selected: boolean;
  onSelect: () => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      ref={buttonRef}
      id={`run-tab-${run.id}`}
      aria-selected={selected}
      aria-controls={`run-panel-${run.id}`}
      onClick={onSelect}
      className={cn(
        "group relative shrink-0 basis-[132px] border px-3 py-2.5 text-left transition-colors sm:basis-auto sm:min-w-[124px]",
        selected
          ? "border-signal/60 bg-signal/[0.07]"
          : "border-border/50 bg-background/40 hover:border-foreground/25",
      )}
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "font-mono text-[10px]",
            selected ? "text-signal" : "text-muted-foreground",
          )}
        >
          {String(run.n).padStart(2, "0")}
        </span>
        <span
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.14em]",
            run.tokenizerKind === "bpe" && "text-saffron",
            selected
              ? "text-foreground"
              : "text-muted-foreground group-hover:text-foreground",
          )}
        >
          {run.short}
        </span>
      </span>
      <span
        className={cn(
          "mt-1.5 block font-mono text-[15px] leading-none tabular-nums",
          selected ? "text-foreground" : "text-foreground/70",
        )}
      >
        {run.lossEnd.toFixed(2)}
      </span>
      <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
        {run.tokenizerKind === "bpe" ? "final loss · bpe" : "final loss"}
      </span>
    </button>
  );
}

/* ---- loss chart --------------------------------------------------------- */

function LossChart({
  runs,
  active,
  baselineLabel,
  chartLabel,
  reduced,
}: {
  runs: RoadmapRun[];
  active: RoadmapRun;
  baselineLabel: string;
  chartLabel: string;
  reduced: boolean;
}) {
  const activeSteps = active.steps || 4000;
  const stepTicks =
    activeSteps >= 10000
      ? [0, 5000, 10000]
      : activeSteps >= 5000
        ? [0, 2500, activeSteps]
        : [0, 2000, 4000];

  return (
    <figure className="m-0 overflow-hidden">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {chartLabel}
        </span>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">
          {active.lossStart.toFixed(2)} → {active.lossEnd.toFixed(4)}
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 block h-[200px] w-full overflow-hidden sm:h-[240px]"
        role="img"
        aria-label={`${chartLabel}: ${active.title} falls from ${active.lossStart.toFixed(2)} to ${active.lossEnd.toFixed(2)} over ${activeSteps} steps`}
      >
        <defs>
          <clipPath id="chart-area-clip">
            <rect
              x={PAD_X}
              y={PAD_Y}
              width={W - PAD_X * 2}
              height={H - PAD_Y * 2}
            />
          </clipPath>
        </defs>

        {/* horizontal gridlines + loss ticks */}
        {[1, 3, 5, 7, 9, 11].map((tick) => (
          <g key={tick}>
            <line
              x1={PAD_X}
              x2={W - PAD_X}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--border)"
              strokeWidth={0.15}
              opacity={0.5}
            />
            <text
              x={PAD_X - 1.6}
              y={y(tick) + 1}
              textAnchor="end"
              className="fill-muted-foreground"
              style={{ fontSize: 2.6, fontFamily: "var(--font-mono)" }}
            >
              {tick}
            </text>
          </g>
        ))}

        {/* step ticks */}
        {stepTicks.map((step) => (
          <text
            key={step}
            x={x(step, activeSteps)}
            y={H - PAD_Y + 4}
            textAnchor={step === 0 ? "start" : step === activeSteps ? "end" : "middle"}
            className="fill-muted-foreground"
            style={{ fontSize: 2.6, fontFamily: "var(--font-mono)" }}
          >
            {step}
          </text>
        ))}

        {/* random-init reference */}
        <line
          x1={PAD_X}
          x2={W - PAD_X}
          y1={y(4.17)}
          y2={y(4.17)}
          stroke="var(--saffron)"
          strokeWidth={0.2}
          strokeDasharray="1.2 1.2"
          opacity={0.55}
        />
        <text
          x={W - PAD_X}
          y={y(4.17) - 1.4}
          textAnchor="end"
          className="fill-saffron"
          style={{ fontSize: 2.5, fontFamily: "var(--font-mono)" }}
        >
          {baselineLabel}
        </text>

        {/* Curve group strictly clipped to the graph boundaries */}
        <g clipPath="url(#chart-area-clip)">
          {/* every run, dimmed, for comparison */}
          {runs
            .filter((r) => r.id !== active.id)
            .map((r) => (
              <path
                key={r.id}
                d={curvePath(r, activeSteps)}
                fill="none"
                stroke={
                  r.tokenizerKind === "bpe"
                    ? "var(--saffron)"
                    : "var(--foreground)"
                }
                strokeWidth={0.25}
                opacity={0.18}
              />
            ))}

          {/* the selected run */}
          <motion.path
            key={active.id}
            d={curvePath(active, activeSteps)}
            fill="none"
            stroke="var(--signal)"
            strokeWidth={0.6}
            strokeLinecap="round"
            initial={reduced ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
          />
        </g>

        {/* endpoints */}
        <circle
          cx={x(0, activeSteps)}
          cy={y(active.lossStart)}
          r={0.8}
          fill="var(--background)"
          stroke="var(--signal)"
          strokeWidth={0.4}
        />
        <motion.circle
          key={`${active.id}-end`}
          cx={x(activeSteps, activeSteps)}
          cy={y(active.lossEnd)}
          r={1.2}
          fill="var(--signal)"
          initial={reduced ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: reduced ? 0 : 0.6, duration: 0.35, ease: "backOut" }}
        />
        <text
          x={Math.min(W - PAD_X, x(activeSteps, activeSteps) - 1)}
          y={y(active.lossEnd) - 1.5}
          textAnchor="end"
          className="fill-signal font-mono text-[3px]"
        >
          {active.lossEnd.toFixed(2)}
        </text>
      </svg>
    </figure>
  );
}

/* ---- terminal ----------------------------------------------------------- */

function Terminal({
  run,
  onExpand,
}: {
  run: RoadmapRun;
  onExpand: () => void;
}) {
  return (
    <div className="overflow-hidden border border-border/50 bg-muted/25">
      <div
        aria-hidden="true"
        className="flex items-center gap-1.5 border-b border-border/40 px-3 py-2"
      >
        <span className="size-1.5 rounded-full bg-signal/60" />
        <span className="size-1.5 rounded-full bg-saffron/50" />
        <span className="size-1.5 rounded-full bg-border" />
        <span className="ml-2 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {run.file ?? "train"}
        </span>
      </div>
      <button
        type="button"
        onClick={onExpand}
        aria-label={`Enlarge the terminal output of ${run.title}`}
        className="group relative block w-full cursor-zoom-in bg-black/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-signal"
      >
        <Image
          src={run.shot}
          alt={`Terminal output of the ${run.title} run`}
          width={1024}
          height={700}
          className="w-full object-contain transition-[filter] duration-500 group-hover:brightness-110"
        />
        <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 border border-border/50 bg-background/80 px-1.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <Maximize2 className="size-3" aria-hidden="true" />
          enlarge
        </span>
      </button>
    </div>
  );
}

/* ---- section ------------------------------------------------------------ */

export function RunComparison({
  runs,
  copy,
}: {
  runs: RoadmapRun[];
  copy: RoadmapRunsSection;
}) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const reduced = useReducedMotion();
  const active = runs[index];

  const select = useCallback(
    (next: number) => {
      setIndex(((next % runs.length) + runs.length) % runs.length);
    },
    [runs.length],
  );

  // Arrow keys step through the runs once the rail has focus.
  const onRailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      select(index + 1);
      tabRefs.current[(index + 1) % runs.length]?.focus();
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      select(index - 1);
      tabRefs.current[((index - 1 + runs.length) % runs.length)]?.focus();
    }
    if (e.key === "Home") {
      e.preventDefault();
      select(0);
      tabRefs.current[0]?.focus();
    }
    if (e.key === "End") {
      e.preventDefault();
      select(runs.length - 1);
      tabRefs.current[runs.length - 1]?.focus();
    }
  };

  // Close the lightbox on Escape (the dialog primitive traps focus, this
  // keeps the run selection in sync when it is dismissed).
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  if (!active) return null;

  return (
    <section
      id="runs"
      className="mt-20 scroll-mt-32 border-t border-border/40 pt-16"
    >
      <div className="md:grid md:grid-cols-12 md:gap-10">
        <h2 className="min-w-0 text-[13px] font-semibold uppercase tracking-[0.03em] text-saffron md:col-span-3">
          {copy.label}
        </h2>
        <div className="min-w-0 md:col-span-9">
          <p className="max-w-3xl text-[17px] font-light leading-relaxed text-foreground/90 md:text-[18px]">
            {copy.title}
          </p>
          <p className="mt-4 max-w-3xl text-[14.5px] leading-relaxed text-muted-foreground">
            {copy.intro}
          </p>

          {/* Stage rail */}
          <div
            role="tablist"
            aria-label="Training runs"
            aria-orientation="horizontal"
            onKeyDown={onRailKeyDown}
            className="mt-8 flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border/60 scrollbar-track-transparent"
          >
            {runs.map((run, i) => (
              <RunTab
                key={run.id}
                run={run}
                selected={i === index}
                onSelect={() => select(i)}
                buttonRef={(el) => {
                  tabRefs.current[i] = el;
                }}
              />
            ))}
          </div>

          {/* Chart + specs */}
          <div className="mt-6 border border-border/40 bg-muted/15 p-5 sm:p-7">
            <LossChart
              runs={runs}
              active={active}
              baselineLabel={copy.chartBaseline}
              chartLabel={copy.chartLabel}
              reduced={!!reduced}
            />

            <dl className="mt-6 grid gap-x-6 gap-y-3 border-t border-border/40 pt-5 sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Architecture
                </dt>
                <dd className="mt-1 text-[13px] font-light leading-relaxed text-foreground/85">
                  {active.model}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Vocabulary
                </dt>
                <dd
                  className={cn(
                    "mt-1 text-[13px] font-light leading-relaxed",
                    active.tokenizerKind === "bpe"
                      ? "text-saffron"
                      : "text-foreground/85",
                  )}
                >
                  {active.tokenizer}
                </dd>
              </div>
              <div className="min-w-0 sm:col-span-2">
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Run config
                </dt>
                <dd className="mt-1 font-mono text-[12px] leading-relaxed text-foreground/80">
                  {active.config}
                </dd>
              </div>
            </dl>
          </div>

          {/* What changed + generated text */}
          <motion.div
            key={active.id}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="mt-10 grid gap-6 md:grid-cols-12 md:gap-10"
          >
            <div className="md:col-span-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Stage {String(active.n).padStart(2, "0")} · {active.title}
              </p>
              <p className="mt-3 max-w-prose text-[14.5px] leading-relaxed text-foreground/85">
                {active.note}
              </p>
            </div>
            <div className="min-w-0 md:col-span-7">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {copy.sampleLabel}
              </p>
              <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap break-words border border-border/40 bg-black/85 p-4 font-mono text-[12.5px] leading-[1.7] text-foreground/90 sm:p-5 sm:text-[13px]">
                {active.sample}
              </pre>
            </div>
          </motion.div>

          <p className="mt-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
            <span
              aria-hidden="true"
              className="h-px w-8 bg-border"
            />
            {copy.hint}
          </p>

          <p className="mt-8 max-w-3xl border-l-2 border-saffron/50 pl-4 text-[13.5px] leading-relaxed text-muted-foreground">
            {copy.caveat}
          </p>
        </div>
      </div>

      {/* Full-size view of the selected terminal */}
      <Dialog open={zoom} onOpenChange={(o) => !o && setZoom(false)}>
        <DialogContent
          showCloseButton
          className="max-h-[92dvh] max-w-5xl gap-3 overflow-y-auto border-border/40 bg-background p-4 sm:p-6"
        >
          <DialogTitle className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {copy.label} · {active.title}
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
            {active.config} · loss {active.lossStart.toFixed(2)} →{" "}
            {active.lossEnd.toFixed(4)}
          </DialogDescription>
          <div className="relative w-full overflow-hidden bg-black/85">
            <Image
              src={active.shot}
              alt={`Terminal output of the ${active.title} run`}
              width={2048}
              height={1400}
              className="h-auto w-full object-contain"
              priority
            />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}