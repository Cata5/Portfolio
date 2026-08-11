"use client";

import { useRef } from "react";

import { GlassCard } from "@/components/glass-card";
import { gsap } from "@/components/motion/gsap";
import { Stagger } from "@/components/motion/stagger";
import { Section } from "@/components/section";
import { TextReveal } from "@/components/motion/text-reveal";
import { journey } from "@/data/journey";
import type { JourneyCategory } from "@/data/journey";
import { cn } from "@/lib/utils";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

// Category chips and line dots use theme tokens (signal violet, saffron
// amber, foreground grays) so they stay readable on both the dark and the
// pale theme — same recipe as the Activities and Certifications sections.
const categoryChip: Record<JourneyCategory, string> = {
  main: "text-signal border-signal/30",
  education: "text-saffron border-saffron/30",
  competitions: "text-foreground/70 border-border/60",
  // A quieter violet than main so all four categories scan at a glance.
  side: "text-signal/60 border-signal/25",
};
const categoryDot: Record<JourneyCategory, string> = {
  main: "bg-signal",
  education: "bg-saffron",
  competitions: "bg-foreground/70",
  side: "bg-signal/60",
};

/**
 * The timeline line draws itself in as you scroll down it (SVG dash-offset
 * scrub), while each entry rises in sequence — the section's motion identity
 * is the drawn line, not a fade on the dots.
 */
export function Journey() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGLineElement>(null);

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
          Where I&apos;ve been
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
            {journey.map((entry) => (
              <li key={entry.title} className="relative pb-14 last:pb-0">
                <span
                  className={cn(
                    "absolute -left-[5px] top-1.5 size-2 rounded-full transition-transform duration-300 hover:scale-125",
                    categoryDot[entry.category],
                  )}
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex w-fit items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
                      categoryChip[entry.category],
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
              </li>
            ))}
          </Stagger>
        </div>
      </GlassCard>
    </Section>
  );
}
