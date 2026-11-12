"use client";

import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Container } from "@/components/container";
import { GlassCard } from "@/components/glass-card";
import { ProjectLink } from "@/components/motion/project-link";
import { Reveal } from "@/components/motion/reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { Editable } from "@/components/editor/editable";
import { useEditor } from "@/components/editor/editor-context";
import type { Project } from "@/data/projects";
import {
  llmRoadmap,
  llmRuntime,
  roadmap,
  roadmapProgress,
  type RoadmapStage,
  type RoadmapStageStatus,
} from "@/data/roadmap";
import { cn } from "@/lib/utils";

/** Status chips read their labels from content/roadmap.json so admin owns the wording. */
const STATUS_META: Record<
  RoadmapStageStatus,
  { label: string; className: string }
> = {
  done: { label: roadmap.railLabel, className: "text-signal" },
  current: { label: roadmap.buildingLabel, className: "text-saffron" },
  planned: { label: roadmap.plannedLabel, className: "text-muted-foreground" },
};

/** One node on the seven-stage rail: filled + tick when shipped, pulsing when in flight. */
function StageNode({ stage }: { stage: RoadmapStage }) {
  const done = stage.status === "done";
  const current = stage.status === "current";

  return (
    <span
      className={cn(
        "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border font-mono text-[11px] font-semibold",
        done && "border-signal bg-signal/15 text-signal",
        current && "border-saffron bg-saffron/10 text-saffron",
        !done &&
          !current &&
          "border-border/70 bg-background/70 text-muted-foreground",
      )}
    >
      {done ? (
        <Check className="size-3.5" aria-hidden="true" />
      ) : (
        stage.n
      )}
    </span>
  );
}

function StageCard({ stage, stageIndex }: { stage: RoadmapStage; stageIndex: number }) {
  const done = stage.status === "done";
  const current = stage.status === "current";
  const meta = STATUS_META[stage.status];

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        done && "border-signal/35 bg-signal/[0.04]",
        current && "border-saffron/40 bg-saffron/[0.05]",
        !done && !current && "border-border/40 bg-muted/10",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Stage {stage.n}
          {stage.file ? ` · ${stage.file}` : ""}
        </span>
        <span
          className={cn(
            "inline-flex items-center font-mono text-[9px] uppercase tracking-wider",
            meta.className,
          )}
        >
          {meta.label}
        </span>
      </div>

      <Editable path={`roadmap.stages.${stageIndex}.title`} label={`Stage ${stage.n} Title`}>
        <h4 className="mt-2 text-[15px] font-medium tracking-tight text-foreground">
          {stage.title}
        </h4>
      </Editable>
      <Editable path={`roadmap.stages.${stageIndex}.summary`} label={`Stage ${stage.n} Summary`} type="textarea">
        <p className="mt-1.5 text-[13px] font-light leading-relaxed text-muted-foreground">
          {stage.summary}
        </p>
      </Editable>

      {stage.items.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-border/40 pt-3">
          {stage.items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-foreground/80"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "mt-[7px] size-1 shrink-0",
                  done ? "bg-signal" : "bg-saffron",
                )}
              />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Flagship 02 - the LLM from Scratch build board. Same card language as the
 * Vortex stage (GlassCard + mono labels + signal/saffron states), but the
 * payload is a roadmap instead of device frames: a seven-node rail with the
 * shipped stages lit, then a card per stage.
 */
export function LlmShowcase({ project }: { project: Project }) {
  const { content } = useEditor();
  const reduced = useReducedMotion();

  const currentRoadmap = content.roadmap || roadmap;
  const currentStages = currentRoadmap.stages || llmRoadmap;
  const currentRuntime = currentRoadmap.runtime || llmRuntime;
  const { done, total, percent, railPercent } = roadmapProgress(currentStages);
  const [selectedStage, setSelectedStage] = useState(() =>
    Math.max(0, currentStages.length - 1),
  );
  const activeIndex = Math.min(selectedStage, Math.max(0, currentStages.length - 1));
  const activeStage = currentStages[activeIndex];

  const llmIndex = content.projects.findIndex((p) => p.id === "llm-from-scratch");
  const targetProjectPath = llmIndex !== -1 ? `projects.${llmIndex}` : "projects.1";

  return (
    <>
      <Container>
        <GlassCard className="mt-4 w-fit max-w-lg p-5 sm:p-6 md:bg-card/70">
          <Editable path={`${targetProjectPath}.title`} label="LLM Flagship Title">
            <TextReveal
              as="h2"
              className="text-2xl font-normal tracking-[-0.02em] md:text-3xl"
            >
              {project.title}
            </TextReveal>
          </Editable>
          <Reveal delay={0.1}>
            <Editable path="roadmap.intro" label="Roadmap Intro" type="textarea">
              <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground sm:text-base">
                {currentRoadmap.intro}
              </p>
            </Editable>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Editable path="roadmap.statusLabel" label="Status Label" inline>
                <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.16em] text-saffron">
                  {currentRoadmap.statusLabel}
                </span>
              </Editable>
              <span className="font-mono text-[11px] text-muted-foreground">
                {(project.technologies || []).slice(0, 4).join(" · ")}
              </span>
            </div>
          </Reveal>
        </GlassCard>
      </Container>

      <Container className="mt-8 md:mt-12">
        <GlassCard className="p-5 sm:p-7 lg:p-8 md:bg-card/70">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            {/* Left column - progress readout, runtime facts, CTA */}
            <div className="flex flex-col lg:col-span-4">
              <span className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-saffron">
                {currentRoadmap.roadmapLabel}
              </span>

              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-3xl font-semibold leading-none text-signal">
                  {String(done).padStart(2, "0")}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {total} {currentRoadmap.shippedLabel}
                </span>
              </div>

              <div
                role="progressbar"
                aria-valuenow={Math.round(percent)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Roadmap completion"
                className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted"
              >
                <motion.div
                  initial={reduced ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  style={{ width: `${percent}%`, transformOrigin: "left" }}
                  className="h-full rounded-full bg-signal"
                />
              </div>

              <dl className="mt-6 space-y-2.5">
                {currentRuntime.map((r, rIdx) => (
                  <div
                    key={r.label || rIdx}
                    className="flex flex-col gap-0.5 border-t border-border/40 pt-2.5 first:border-t-0 first:pt-0 sm:flex-row sm:items-baseline sm:gap-3"
                  >
                    <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:w-24 sm:shrink-0">
                      {r.label}
                    </dt>
                    <dd className="text-[13px] font-light leading-relaxed text-foreground/85">
                      {r.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <ProjectLink
                href={`/projects/${project.id}`}
                src={project.image ?? undefined}
                className="group mt-5 inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-signal"
              >
                {currentRoadmap.ctaLabel}
                <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </ProjectLink>
            </div>

            {/* Right column - interactive seven-stage rail + active stage card */}
            <div className="lg:col-span-8">
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="absolute left-3.5 right-3.5 top-3.5 h-px bg-border"
                />
                <span
                  aria-hidden="true"
                  className="absolute left-3.5 top-3.5 h-px bg-signal transition-[width] duration-700 ease-out"
                  style={{
                    width: `calc((100% - 1.75rem) * ${railPercent / 100})`,
                  }}
                />
                <ol
                  role="tablist"
                  aria-label="Build stages"
                  className="relative flex items-start justify-between gap-1"
                >
                  {currentStages.map((stage, sIdx) => {
                    const meta = STATUS_META[stage.status];
                    const isSelected = sIdx === activeIndex;
                    return (
                      <li
                        key={stage.id}
                        className="flex min-w-0 flex-1 flex-col items-center"
                      >
                        <button
                          type="button"
                          role="tab"
                          aria-selected={isSelected}
                          onClick={() => setSelectedStage(sIdx)}
                          className={cn(
                            "group flex w-full flex-col items-center gap-2 rounded-lg py-0.5 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal",
                            !isSelected && "opacity-70 hover:opacity-100",
                          )}
                        >
                          <span
                            className={cn(
                              "rounded-full transition-transform",
                              isSelected && "ring-2 ring-signal/50 ring-offset-2 ring-offset-background",
                            )}
                          >
                            <StageNode stage={stage} />
                          </span>
                          <span
                            className={cn(
                              "hidden font-mono text-[9px] uppercase tracking-[0.12em] md:block",
                              isSelected ? "text-foreground" : meta.className,
                            )}
                          >
                            {stage.short}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {activeStage && (
                <div className="mt-6">
                  <StageCard
                    key={activeStage.id || activeIndex}
                    stage={activeStage}
                    stageIndex={activeIndex}
                  />
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </Container>

      {/* The engineering detail - tensor shapes, math reference, pitfalls -
          lives on the project page; the homepage keeps the board short. */}
      <Container className="mt-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {roadmap.noteLead}{" "}
          <ProjectLink
            href={`/projects/${project.id}`}
            className="text-signal transition-colors hover:text-foreground"
          >
            {roadmap.noteLink}
          </ProjectLink>
        </p>
      </Container>
    </>
  );
}
