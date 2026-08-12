import { ArrowUpRight } from "lucide-react";

import { GlassCard } from "@/components/glass-card";
import { MLFlowDiagram } from "@/components/ml/ml-flow-diagram";
import { Reveal } from "@/components/motion/reveal";
import { Stagger } from "@/components/motion/stagger";
import { Section } from "@/components/section";
import { TextReveal } from "@/components/motion/text-reveal";
import { ml } from "@/data/ml";
import { skillGroups } from "@/data/skills";
import { cn } from "@/lib/utils";

const mlStack = skillGroups.find((g) => g.label === "AI / ML")?.items ?? [];

export function MLNotebook() {
  const run = ml.runs[ml.runs.length - 1] ?? null;

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
            <div>
              <div className="flex items-center justify-between pb-3">
                <span className="text-[13px] font-semibold uppercase tracking-[0.03em] text-saffron">
                  model experiment
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  log — {ml.runs.length} run{ml.runs.length === 1 ? "" : "s"}
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
                          <ArrowUpRight
                            className="size-3 shrink-0 transition-transform duration-200 group-hover/ds:translate-x-0.5 group-hover/ds:-translate-y-0.5"
                            aria-hidden="true"
                          />
                        </a>
                      ) : run ? (
                        run[field]
                      ) : (
                        "—"
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
                      : "No runs logged yet — real training results get published here when a run finishes. Nothing on this page is fabricated."}
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
                <MLFlowDiagram className="mt-10" />
                <p className="mt-10 max-w-sm text-lg font-extralight leading-relaxed text-muted-foreground">
                  When an experiment completes, its configuration and loss
                  curve land in the notebook on the left. Until then, the
                  ledger stays honest — empty.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </GlassCard>
    </Section>
  );
}
