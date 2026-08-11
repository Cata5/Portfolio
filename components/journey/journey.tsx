"use client";

import { useRef } from "react";

import { GlassCard } from "@/components/glass-card";
import { gsap } from "@/components/motion/gsap";
import { Stagger } from "@/components/motion/stagger";
import { Section } from "@/components/section";
import { TextReveal } from "@/components/motion/text-reveal";
import { journey } from "@/data/journey";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

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
                  className="absolute -left-[5px] top-1.5 size-2 rounded-full bg-signal transition-transform duration-300 hover:scale-125"
                  aria-hidden="true"
                />
                <p className="font-mono text-[12px] text-muted-foreground">
                  {entry.year}
                </p>
                <h3 className="mt-2 text-2xl font-normal tracking-[-0.01em]">
                  {entry.title}
                </h3>
                <p className="mt-2 max-w-md text-lg font-extralight leading-relaxed text-muted-foreground">
                  {entry.note}
                </p>
              </li>
            ))}
          </Stagger>
        </div>
      </GlassCard>
    </Section>
  );
}
