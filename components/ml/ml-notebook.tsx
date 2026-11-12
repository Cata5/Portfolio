"use client";

import { useState } from "react";
import { Eye, Cpu } from "lucide-react";

import { Editable } from "@/components/editor/editable";
import { useEditor } from "@/components/editor/editor-context";
import { GlassCard } from "@/components/glass-card";
import { MLFlowDiagram } from "@/components/ml/ml-flow-diagram";
import { Reveal } from "@/components/motion/reveal";
import { Stagger } from "@/components/motion/stagger";
import { Section } from "@/components/section";
import { TextReveal } from "@/components/motion/text-reveal";
import { cn } from "@/lib/utils";

type MLTab = "vision" | "llm";

export function MLNotebook() {
  const { content } = useEditor();
  const ml = content.ml;
  const mlStack = content.skills.skillGroups.find((g) => g.label === "AI / ML")?.items ?? [];
  const [activeTab, setActiveTab] = useState<MLTab>("vision");

  const tabRuns = (ml.runs || []).filter((r: any) => {
    if (activeTab === "llm") {
      return (
        r.category === "llm" ||
        r.model?.toLowerCase().includes("cataai") ||
        r.model?.toLowerCase().includes("llm") ||
        r.model?.toLowerCase().includes("llama")
      );
    }
    return (
      r.category === "vision" ||
      !r.category ||
      r.model?.toLowerCase().includes("yolo") ||
      r.model?.toLowerCase().includes("ocr")
    );
  });

  const [selectedRunIdx, setSelectedRunIdx] = useState(0);
  const currentRunIdx = Math.min(selectedRunIdx, Math.max(0, tabRuns.length - 1));
  const run = tabRuns[currentRunIdx] ?? null;

  return (
    <Section id="ml" eyebrow="ML / Notebook">
      <GlassCard className="p-6 sm:p-10 lg:p-14">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <TextReveal
              as="h2"
              className="mb-8 text-3xl font-normal tracking-[-0.02em] md:text-4xl"
            >
              Machine learning
            </TextReveal>

            {/* Category tabs: Vision models vs LLMs */}
            <div
              role="tablist"
              aria-label="Machine learning categories"
              className="mb-8 flex flex-wrap gap-2"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "vision"}
                onClick={() => {
                  setActiveTab("vision");
                  setSelectedRunIdx(0);
                }}
                className={cn(
                  "inline-flex items-center gap-2 border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                  activeTab === "vision"
                    ? "border-signal/70 bg-signal/[0.08] text-foreground"
                    : "border-border/60 bg-background/40 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                <Eye className={cn("size-3.5", activeTab === "vision" ? "text-signal" : "text-muted-foreground")} />
                <span>Vision models</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "llm"}
                onClick={() => {
                  setActiveTab("llm");
                  setSelectedRunIdx(0);
                }}
                className={cn(
                  "inline-flex items-center gap-2 border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                  activeTab === "llm"
                    ? "border-saffron/70 bg-saffron/[0.08] text-foreground"
                    : "border-border/60 bg-background/40 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                <Cpu className={cn("size-3.5", activeTab === "llm" ? "text-saffron" : "text-muted-foreground")} />
                <span>LLM&apos;s</span>
              </button>
            </div>

            {/* Sub-selector for runs within active tab */}
            {tabRuns.length > 1 && (
              <div className="mb-6 flex flex-wrap gap-1.5">
                {tabRuns.map((r: any, idx: number) => {
                  const isSelected = idx === currentRunIdx;
                  const shortName = r.model.split(" - ")[0].split(" (")[0];
                  return (
                    <button
                      key={r.model || idx}
                      type="button"
                      onClick={() => setSelectedRunIdx(idx)}
                      className={cn(
                        "rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors",
                        isSelected
                          ? "bg-foreground/15 text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                      )}
                    >
                      {shortName}
                    </button>
                  );
                })}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between pb-3">
                <span className="text-[13px] font-semibold uppercase tracking-[0.03em] text-saffron">
                  {activeTab === "vision" ? "Computer Vision Experiment" : "Generative LLM Experiment"}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  run {currentRunIdx + 1} of {tabRuns.length}
                </span>
              </div>
              <Stagger as="dl" className="font-mono text-[12.5px]">
                {ml.fields.map((field: string) => (
                  <div
                    key={field}
                    className="flex gap-6 border-t border-border/40 py-3.5"
                  >
                    <dt className="w-28 shrink-0 uppercase tracking-[0.12em] text-muted-foreground">
                      {field}
                    </dt>
                    <dd
                      className={cn(
                        "text-foreground/85",
                        !run && "text-muted-foreground/50",
                      )}
                    >
                      {field === "dataset" && run?.datasetUrl ? (
                        <a
                          href={run.datasetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="group/ds inline-flex items-center gap-1.5 transition-colors hover:text-signal"
                        >
                          <span className="underline decoration-signal/40 underline-offset-4 transition-colors group-hover/ds:decoration-signal">
                            {run.dataset}
                          </span>
                        </a>
                      ) : run ? (
                        run[field as keyof typeof run]
                      ) : (
                        "-"
                      )}
                    </dd>
                  </div>
                ))}
              </Stagger>
              <Reveal y={16}>
                <div className="border-t border-border/40 pt-4">
                  <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
                    {run
                      ? run.notes
                      : "Training configurations, loss curves, and validation checkpoints are logged directly to this ledger."}
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
          <div className="lg:col-span-5">
            <Reveal delay={0.08}>
              <div className="lg:pt-28">
                <p className="mb-5 text-[13px] font-semibold uppercase tracking-[0.03em] text-saffron">
                  Training stack
                </p>
                <p className="font-mono text-[13px] leading-loose text-foreground/85">
                  {mlStack.join(" · ")}
                </p>
                <p className="mb-5 mt-8 text-[13px] font-semibold uppercase tracking-[0.03em] text-saffron">
                  Hardware setups
                </p>
                <Editable path="ml.hardware" label="ML Hardware Specs">
                  <div className="space-y-2 font-mono text-[12.5px] leading-relaxed text-foreground/85">
                    <div className="flex items-start gap-2 border-l border-signal/50 pl-3">
                      <span className="shrink-0 text-signal font-semibold">Laptop:</span>
                      <span>Ryzen 9 5900HS · 40GB RAM · RTX 3060 Laptop (6GB VRAM)</span>
                    </div>
                    <div className="flex items-start gap-2 border-l border-saffron/50 pl-3">
                      <span className="shrink-0 text-saffron font-semibold">Desktop:</span>
                      <span>Ryzen 5 5600X · 32GB RAM · RTX 3060 Ti (8GB VRAM)</span>
                    </div>
                  </div>
                </Editable>
                <MLFlowDiagram className="mt-10" />
                <p className="mt-10 max-w-sm text-lg font-light leading-relaxed text-muted-foreground">
                  Model training pipelines, hyperparameter logs, and benchmark metrics for computer vision and generative architectures.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </GlassCard>
    </Section>
  );
}
