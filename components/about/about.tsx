"use client";

import { useRef } from "react";

import { Editable } from "@/components/editor/editable";
import { useEditor } from "@/components/editor/editor-context";
import { GlassCard } from "@/components/glass-card";
import { gsap } from "@/components/motion/gsap";
import { Section } from "@/components/section";
import { EASE, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

export function About() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { content } = useEditor();
  const { copy, skills } = content;
  const focusAreas = skills.focusAreas;

  useIsomorphicLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "top top",
            scrub: 0.6,
          },
        })
        .fromTo(
          ".about-heading",
          { yPercent: 120 },
          { yPercent: 0, duration: 1, ease: EASE.outStrong },
          0,
        )
        .fromTo(
          ".about-para",
          { y: 26, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: EASE.out },
          0.22,
        )
        .fromTo(
          ".about-label",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, ease: EASE.out },
          0.38,
        )
        .fromTo(
          ".about-area",
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: EASE.out },
          0.48,
        );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <Section
      id="about"
      eyebrow="About"
      className="relative -mt-[10svh] overflow-hidden"
    >
      <GlassCard className="p-6 sm:p-10 lg:p-14">
        <div ref={rootRef} className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="about-heading-mask block overflow-hidden">
              <Editable path="copy.about.heading" label="About Heading" type="textarea">
                <span className="about-heading block max-w-xl text-3xl font-normal leading-[1.1] tracking-[-0.02em] md:text-4xl">
                  {copy.about?.heading ?? "I build software for whatever problem I find interesting."}
                </span>
              </Editable>
            </h2>
            <div className="mt-10 max-w-xl space-y-6">
              <Editable path="copy.about.paragraph1" label="Bio Paragraph 1" type="textarea">
                <p className="about-para text-lg font-light leading-relaxed text-muted-foreground">
                  {copy.about?.paragraph1}
                </p>
              </Editable>
              <Editable path="copy.about.paragraph2" label="Bio Paragraph 2" type="textarea">
                <p className="about-para text-lg font-light leading-relaxed text-muted-foreground">
                  {copy.about?.paragraph2}
                </p>
              </Editable>
            </div>
          </div>
          <div className="lg:col-span-5">
            <p className="about-label mb-5 text-[13px] font-semibold uppercase tracking-[0.03em] text-saffron">
              I work with
            </p>
            <ul>
              {focusAreas.map((area, idx) => (
                <li
                  key={area.label || idx}
                  className="about-area group flex items-baseline justify-between gap-4 py-3.5"
                >
                  <span className="flex items-center gap-3 text-[15px] font-medium">
                    <span
                      className="size-1 bg-signal transition-transform duration-200 group-hover:scale-150"
                      aria-hidden="true"
                    />
                    <Editable path={`skills.focusAreas.${idx}.label`} label="Focus Area Name" inline>
                      <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                        {area.label}
                      </span>
                    </Editable>
                  </span>
                  <Editable path={`skills.focusAreas.${idx}.note`} label="Focus Note" inline>
                    <span className="font-mono text-[11px] text-muted-foreground transition-colors group-hover:text-signal">
                      {area.note}
                    </span>
                  </Editable>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </GlassCard>
    </Section>
  );
}

