"use client";

import { Editable } from "@/components/editor/editable";
import { useEditor } from "@/components/editor/editor-context";
import { GlassCard } from "@/components/glass-card";
import { MLFlowDiagram } from "@/components/ml/ml-flow-diagram";
import { Reveal } from "@/components/motion/reveal";
import { Stagger } from "@/components/motion/stagger";
import { Section } from "@/components/section";
import { TextReveal } from "@/components/motion/text-reveal";
import { cn } from "@/lib/utils";

export function MLNotebook() {
  const { content } = useEditor();
  const ml = content.ml;
  const mlStack = content.skills.skillGroups.find((g) => g.label === "AI / ML")?.items ?? [];
  const latestIndex = ml.runs.length - 1;
  const run = ml.runs[latestIndex] ?? null;

  return (
    <Section id="ml" eyebrow="ML / Notebook">
      <GlassCard className="p-6 sm:p-10 lg:p-14">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <TextReveal
              as="h2"
              className="mb-10 text-3xl font-normal tracking-[-0.02em] md:text-4xl"
            >
              Machine learning
            </TextReveal>
            <Editable
              path={latestIndex >= 0 ? `ml.runs.${latestIndex}` : "ml.runs"}
              label="Latest ML Run Log"
              type="mlRun"
              value={run}
            >
              <div>
                <div className="flex items-center justify-between pb-3">
                  <span className="text-[13px] font-semibold uppercase tracking-[0.03em] text-saffron">
                    model experiment
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    log - {ml.runs.length} run{ml.runs.length === 1 ? "" : "s"}
                  </span>
                </div>
                <Stagger as="dl" className="font-mono text-[12.5px]">
                  {ml.fields.map((field) => (
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
            </Editable>
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
                  Hardware
                </p>
                <Editable path="ml.hardware" label="ML Hardware Specs" inline>
                  <p className="font-mono text-[13px] leading-loose text-foreground/85">
                    {ml.hardware}
                  </p>
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
