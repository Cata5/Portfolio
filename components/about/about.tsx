"use client";

import { useRef } from "react";

import { GlassCard } from "@/components/glass-card";
import { gsap } from "@/components/motion/gsap";
import { Section } from "@/components/section";
import { focusAreas } from "@/data/skills";
import { site } from "@/data/site";
import { EASE, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

/**
 * About's entrance is scrubbed over its own scroll window (top bottom →
 * top top). Because the hero above it is a pinned cinematic section, this
 * window opens while the hero's final explosion is still holding — About is
 * pulled up by a negative margin so its heading already sits behind the
 * dissolving field when the pin releases. The heading rises through its
 * mask as the hero's triangles drift down and the persistent TriangleWorld
 * layer gathers behind the skills column: one composition, not a cut.
 */
export function About() {
  const rootRef = useRef<HTMLDivElement>(null);

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
    // -mt pulls About under the hero's pinned section so the heading is
    // already partially visible when the explosion dissolves into the handoff.
    <Section
      id="about"
      eyebrow="About"
      className="relative -mt-[10svh] overflow-hidden"
    >
      {/* The whole About block floats on the same frosted glass as the hero
          and Stack — the dissolving hero field reads through the blur. */}
      <GlassCard className="p-6 sm:p-10 lg:p-14">
        <div ref={rootRef} className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="about-heading-mask block overflow-hidden">
              <span className="about-heading block max-w-xl text-3xl font-normal leading-[1.1] tracking-[-0.02em] md:text-4xl">
                I build software for whatever problem I find interesting.
              </span>
            </h2>
            <div className="mt-10 max-w-xl space-y-6">
              <p className="about-para text-lg font-extralight leading-relaxed text-muted-foreground">
                I&apos;m {site.name}, a Computer and Information Technology
                (CTI) student at ETTI Bucharest (POLITEHNICA University). I build
                web applications, experiment with machine learning, and create
                multi-platform software for whatever challenge I find
                interesting — from media streaming apps on Android to
                intelligent systems on the web.
              </p>
              <p className="about-para text-lg font-extralight leading-relaxed text-muted-foreground">
                I&apos;m actively looking for software engineering roles and
                internships where I can bring hands-on project experience, fast
                learning, and strong engineering fundamentals to real-world
                products.
              </p>
            </div>
          </div>
          <div className="lg:col-span-5">
            <p className="about-label mb-5 text-[13px] font-semibold uppercase tracking-[0.03em] text-saffron">
              I work with
            </p>
            <ul>
              {focusAreas.map((area) => (
                <li
                  key={area.label}
                  className="about-area group flex items-baseline justify-between gap-4 py-3.5"
                >
                  <span className="flex items-center gap-3 text-[15px] font-medium">
                    <span
                      className="size-1 bg-signal transition-transform duration-200 group-hover:scale-150"
                      aria-hidden="true"
                    />
                    <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                      {area.label}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground transition-colors group-hover:text-signal">
                    {area.note}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </GlassCard>

    </Section>
  );
}
