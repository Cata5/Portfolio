"use client";

import { useRef } from "react";

import { Editable } from "@/components/editor/editable";
import { useEditor } from "@/components/editor/editor-context";
import { GlassCard } from "@/components/glass-card";
import { gsap } from "@/components/motion/gsap";
import { Stagger } from "@/components/motion/stagger";
import { Section } from "@/components/section";
import { TextReveal } from "@/components/motion/text-reveal";
import type { JourneyCategory } from "@/data/journey";
import { cn } from "@/lib/utils";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

const categoryChip: Record<JourneyCategory, string> = {
  main: "text-signal border-signal/30",
  education: "text-saffron border-saffron/30",
  competitions: "text-foreground/70 border-border/60",
  side: "text-signal/60 border-signal/25",
};

const categoryDot: Record<JourneyCategory, string> = {
  main: "bg-signal",
  education: "bg-saffron",
  competitions: "bg-foreground/70",
  side: "bg-signal/60",
};

export function Journey() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const { content } = useEditor();
  const journey = content.journey;

  useIsomorphicLayoutEffect(() => {
    const line = lineRef.current;
    const wrap = wrapRef.current;
    if (!line || !wrap || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        line,
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: wrap,
            start: "top 78%",
            end: "bottom 62%",
            scrub: true,
          },
        },
      );
    }, wrap);

    return () => ctx.revert();
  }, []);

  return (
    <Section id="journey" eyebrow="Journey">
      <GlassCard className="p-6 sm:p-10 lg:p-14">
        <TextReveal
          as="h2"
          className="mb-16 text-3xl font-normal tracking-[-0.02em] md:text-4xl"
        >
          Milestones &amp; Experience
        </TextReveal>

        <div ref={wrapRef} className="relative max-w-2xl">
          <svg
            aria-hidden="true"
            className="absolute left-0 top-0 h-full w-px"
            viewBox="0 0 1 100"
            preserveAspectRatio="none"
          >
            <line
              ref={lineRef}
              x1="0.5"
              y1="0"
              x2="0.5"
              y2="100"
              pathLength={1}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray="1"
              strokeDashoffset="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <Stagger as="ol" className="pl-8" y={20}>
            {journey.map((entry, idx) => (
              <li key={entry.title + idx} className="relative pb-14 last:pb-0">
                <span
                  className={cn(
                    "absolute -left-[5px] top-1.5 size-2 rounded-full transition-transform duration-300 hover:scale-125",
                    categoryDot[entry.category] ?? categoryDot.main,
                  )}
                  aria-hidden="true"
                />
                <Editable
                  path={`journey.${idx}`}
                  label={`Milestone: ${entry.title}`}
                  type="journeyItem"
                  value={entry}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex w-fit items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
                          categoryChip[entry.category] ?? categoryChip.main,
                        )}
                      >
                        {entry.category}
                      </span>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {entry.date}
                      </p>
                    </div>
                    <h3 className="mt-2.5 text-2xl font-normal tracking-[-0.01em]">
                      {entry.title}
                    </h3>
                    <p className="mt-2 max-w-md text-lg font-extralight leading-relaxed text-muted-foreground">
                      {entry.note}
                    </p>
                    <ul className="mt-3 flex max-w-md flex-wrap gap-1.5">
                      {entry.tags.map((tag) => (
                        <li
                          key={tag}
                          className="rounded-full border border-border/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/80"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Editable>
              </li>
            ))}
          </Stagger>
        </div>
      </GlassCard>
    </Section>
  );
}
