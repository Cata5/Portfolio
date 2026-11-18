"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Layers,
  Zap,
  Activity,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import { Container } from "@/components/container";
import { GlassCard } from "@/components/glass-card";
import { ProjectLink } from "@/components/motion/project-link";
import { Reveal } from "@/components/motion/reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { Editable } from "@/components/editor/editable";
import { useEditor } from "@/components/editor/editor-context";
import type { Project } from "@/data/projects";
import { cn } from "@/lib/utils";
import { DesktopFrame } from "./device-frames";

interface StudioModule {
  id: string;
  tag: string;
  title: string;
  badge: string;
  shot: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  highlights: string[];
}

const STUDIO_MODULES: StudioModule[] = [
  {
    id: "studio",
    tag: "01",
    title: "Visual Network Studio",
    badge: "Drag-and-Drop Node Canvas",
    shot: "/projects/cataai-ultra/visual-studio.png",
    icon: Layers,
    description:
      "Visual neural architecture designer built with Next.js 16 and @xyflow/react. Visually compose, wire, and validate custom transformer architectures (MHA, GQA, MQA, RoPE, RMSNorm, SwiGLU) with real-time tensor dimension checking.",
    highlights: [
      "Interactive node graph with auto-layout, zoom & pan",
      "Strict tensor dimension contracts between connected layers",
      "Instant analytical VRAM & parameter calculation",
    ],
  },
  {
    id: "training",
    tag: "02",
    title: "Training Console",
    badge: "Experiment Controller & Schedule",
    shot: "/projects/cataai-ultra/training-console.png",
    icon: Zap,
    description:
      "High-throughput multi-phase training cockpit. Configures Warmup-Stable-Decay (WSD) schedules with live visual preview, automated batch geometry solver, precision selection (BF16 mixed), and multi-step budget management.",
    highlights: [
      "Warmup-Stable-Decay (WSD) visual schedule preview",
      "Batch geometry solver (micro-batch & grad accum)",
      "Scales from lightweight edge models up to multi-GPU clusters",
    ],
  },
  {
    id: "overview",
    tag: "03",
    title: "Command Center & NVML",
    badge: "Live Telemetry & Loss Curves",
    shot: "/projects/cataai-ultra/overview.png",
    icon: Activity,
    description:
      "Mission control hub with real-time hardware status, 8 KPI telemetry cards (loss, steps, tokens, tok/s, LR, grad norm), interactive Chart.js dynamics curves, and dynamic LR scaling slider without worker interruption.",
    highlights: [
      "Decoupled training worker (multiprocessing spawn context)",
      "Real-time NVIDIA NVML clocks, temperature & power draw",
      "Dynamic LR multiplier adjustment on the fly",
    ],
  },
];

export function UltraShowcase({ project }: { project: Project }) {
  const { content } = useEditor();
  const [activeIdx, setActiveIdx] = useState(0);

  const ultraIndex = content.projects.findIndex((p) => p.id === "cataai-ultra");
  const targetProjectPath = ultraIndex !== -1 ? `projects.${ultraIndex}` : "projects.0";

  const activeModule = STUDIO_MODULES[activeIdx] ?? STUDIO_MODULES[0];

  const go = useCallback((next: number) => {
    const count = STUDIO_MODULES.length;
    setActiveIdx(((next % count) + count) % count);
  }, []);

  return (
    <>
      {/* Flagship Header Card: Promoted as Visual LLM Builder */}
      <Container>
        <GlassCard className="mt-4 w-fit max-w-2xl p-5 sm:p-6 md:bg-card/70">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/40 bg-signal/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-signal">
              <Sparkles className="size-3" />
              Visual LLM Builder
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Trains Any Parameter Model
            </span>
          </div>

          <Editable path={`${targetProjectPath}.title`} label="CataAI Ultra Title">
            <TextReveal
              as="h2"
              className="text-2xl font-normal tracking-[-0.02em] md:text-3xl"
            >
              {project.title}
            </TextReveal>
          </Editable>

          <Reveal delay={0.1}>
            <Editable
              path={`${targetProjectPath}.summary`}
              label="CataAI Ultra Summary"
              type="textarea"
            >
              <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground sm:text-base">
                {project.summary ||
                  "An end-to-end Visual LLM Builder & Neural Architecture Studio capable of designing and training any parameter Large Language Model with the proper hardware (from lightweight edge SLMs up to multi-billion parameter models) - drag-and-drop React Flow canvas, analytical VRAM estimator, WDDM zero-paging engine, hybrid Muon + AdamW optimizer, and multi-phase pretraining/SFT pipeline."}
              </p>
            </Editable>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-signal">
                <Cpu className="size-3" />
                Visual Node Canvas (@xyflow/react)
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                Next.js 16 · PyTorch 2.11 · Muon + AdamW · Scales to Any Hardware
              </span>
            </div>
          </Reveal>
        </GlassCard>
      </Container>

      {/* Main Studio Workstation Stage */}
      <Container className="mt-6 md:mt-8">
        <GlassCard className="p-5 sm:p-6 lg:p-7 md:bg-card/70">
          {/* Horizontal Capabilities Tab Bar - Minimal vertical space */}
          <div className="mb-6 border-b border-border/40 pb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-saffron">
                Visual Studio Interface
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                View {activeIdx + 1} of {STUDIO_MODULES.length}
              </span>
            </div>

            <div
              role="tablist"
              aria-label="CataAI Ultra studio capabilities"
              className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
            >
              {STUDIO_MODULES.map((m, i) => {
                const selected = i === activeIdx;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveIdx(i)}
                    className={cn(
                      "group flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-left transition-all duration-200 cursor-pointer",
                      selected
                        ? "border-signal/70 bg-signal/15 shadow-sm text-foreground"
                        : "border-border/50 bg-muted/10 text-muted-foreground hover:border-border hover:bg-muted/20 hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 transition-colors",
                        selected ? "text-signal" : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    <span className="font-mono text-[10px] font-bold tracking-wider text-muted-foreground">
                      {m.tag}
                    </span>
                    <span className="text-[13px] font-medium tracking-tight whitespace-nowrap">
                      {m.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active View Content: 2-Column Balanced Stage */}
          <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Active Module Details, Highlights & CTAs */}
            <div className="flex flex-col lg:col-span-5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-signal">
                  VIEW {activeModule.tag}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-signal/40 bg-signal/10 text-signal font-semibold">
                  {activeModule.badge}
                </span>
              </div>

              <h3 className="mt-2 text-lg font-medium tracking-tight text-foreground sm:text-xl">
                {activeModule.title}
              </h3>

              <p className="mt-2 text-[13px] font-light leading-relaxed text-muted-foreground">
                {activeModule.description}
              </p>

              <ul className="mt-4 space-y-1.5 rounded-xl border border-border/40 bg-neutral-950/40 p-3">
                {activeModule.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-center gap-2 text-[12px] text-foreground/85 font-mono"
                  >
                    <CheckCircle2 className="size-3.5 text-signal shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              {/* Hardware Scalability Strip */}
              <div className="mt-4 rounded-xl border border-border/40 bg-neutral-950/30 px-3.5 py-2.5">
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-muted-foreground uppercase tracking-wider">
                    Hardware Scalability
                  </span>
                  <span className="text-signal font-semibold">
                    Any Parameter Scale
                  </span>
                </div>
                <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                  Consumer 6GB GPUs &middot; Mid/High 8–24GB &middot; Datacenter Clusters
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <ProjectLink
                  href={`/projects/${project.id}`}
                  src={project.image ?? undefined}
                  className="group inline-flex items-center gap-2 text-sm font-medium text-signal underline decoration-signal/40 underline-offset-4 transition-colors hover:text-foreground hover:decoration-signal"
                >
                  View full CataAI Ultra case study
                  <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </ProjectLink>
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    GitHub Repository →
                  </a>
                )}
              </div>
            </div>

            {/* Right Column: Studio Desktop Frame with Active Screenshot */}
            <div className="relative flex min-h-[19rem] sm:min-h-[23rem] lg:min-h-[27rem] lg:col-span-7 items-center justify-center overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={activeModule.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex flex-col justify-center items-center w-full px-2"
                >
                  <DesktopFrame
                    src={activeModule.shot}
                    alt={`CataAI Ultra - ${activeModule.title}`}
                  />
                  <div className="mt-2.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-signal shadow-[0_0_6px_var(--signal)]" />
                    <span>Visual LLM Studio · {activeModule.title}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </GlassCard>

        {/* Previous / Next Controls */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Previous studio module"
            onClick={() => go(activeIdx - 1)}
            className="grid size-8 place-items-center rounded-full border border-border/60 bg-card/90 text-muted-foreground transition-all duration-200 hover:border-signal/50 hover:text-signal active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {STUDIO_MODULES.map((m, i) => (
              <button
                key={m.id}
                type="button"
                aria-label={`Go to ${m.title}`}
                aria-current={i === activeIdx}
                onClick={() => setActiveIdx(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                  i === activeIdx
                    ? "w-6 bg-signal"
                    : "w-2 bg-foreground/25 hover:bg-foreground/50",
                )}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="Next studio module"
            onClick={() => go(activeIdx + 1)}
            className="grid size-8 place-items-center rounded-full border border-border/60 bg-card/90 text-muted-foreground transition-all duration-200 hover:border-signal/50 hover:text-signal active:scale-95 cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </Container>
    </>
  );
}
