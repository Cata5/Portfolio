"use client";

import { useRef } from "react";

import { ArrowDown, ArrowUpRight } from "lucide-react";

import { Container } from "@/components/container";
import { CurrentYear } from "@/components/current-year";
import { GlassCard } from "@/components/glass-card";
import { HeroScrollIndicator } from "@/components/hero/hero-scroll-indicator";
import { HeroTypography } from "@/components/hero/hero-typography";
import { WorkspacePanel } from "@/components/hero/workspace-panel";
import { gsap } from "@/components/motion/gsap";
import { Magnetic } from "@/components/motion/magnetic";
import { Button } from "@/components/ui/button";
import { site } from "@/data/site";
import { EASE, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

/**
 * The hero — a short pinned poster that frames the Earth, not a self-contained
 * animation. The globe itself lives on the page-wide TriangleWorld canvas
 * (fixed behind everything), so this section only owns the typography:
 *
 *   entrance    grid → eyebrow → headline lines rise through their masks →
 *               tagline/CTAs → card → labels → scroll cue
 *   scroll      the hero pins for two viewport-heights (1.5 on mobile) so the
 *               globe's load-time assembly and slow rotation get breathing
 *               room, then the typography drifts away and the section
 *               releases. The same pieces keep migrating into the orbital
 *               form as About arrives — one continuous world, never a cut.
 */
export function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      // ---- Entrance -------------------------------------------------
      const tl = gsap.timeline({ defaults: { ease: EASE.out } });

      tl.fromTo(
        ".hero-grid",
        { opacity: 0 },
        { opacity: 1, duration: 1.4, ease: "power2.out" },
        0,
      )
        .fromTo(
          ".hero-eyebrow-inner",
          { yPercent: 130 },
          { yPercent: 0, duration: 0.9, ease: EASE.outStrong },
          0.3,
        )
        .fromTo(
          ".hero-line",
          { yPercent: 115 },
          { yPercent: 0, duration: 1.15, ease: EASE.outStrong, stagger: 0.12 },
          0.42,
        )
        .fromTo(
          ".hero-tagline",
          { y: 22, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8 },
          0.8,
        )
        .fromTo(
          ".hero-ctas",
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8 },
          0.95,
        )
        .fromTo(
          ".hero-glass",
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9 },
          0.25,
        )
        .fromTo(
          ".hero-workspace",
          { y: 26, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9 },
          1.1,
        )
        .fromTo(
          ".hero-label, .hero-side-label",
          { opacity: 0 },
          { opacity: 1, duration: 0.8, stagger: 0.08 },
          1.25,
        )
        .fromTo(
          ".hero-scroll-hint",
          { opacity: 0 },
          { opacity: 1, duration: 0.8 },
          1.4,
        );

      // ---- Pinned scroll ----------------------------------------------
      // The Earth lives on the page-wide TriangleWorld canvas behind
      // everything, so the hero only needs to hold its typography for the
      // globe's assembly and slow rotation to breathe (2 screens on desktop,
      // 1.5 on mobile), then release — the pieces keep migrating into the
      // orbital form as About arrives. Every tween is scrubbed.
      const st = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () =>
            "+=" +
            Math.round(
              window.innerHeight * (window.innerWidth < 640 ? 1.5 : 2),
            ),
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          scrub: true,
        },
        defaults: { ease: EASE.none },
      });

      // Typography recedes cleanly — the labels first, the headline last —
      // so the material owns the remaining pin.
      st.to(".hero-scroll-hint", { opacity: 0, duration: 0.05 }, 0.05)
        .to(".hero-grid", { opacity: 0, yPercent: 6, duration: 0.08 }, 0.06)
        .to(".hero-label, .hero-side-label", { opacity: 0, duration: 0.06 }, 0.12)
        .to(".hero-workspace", { yPercent: -22, opacity: 0, duration: 0.12 }, 0.2)
        .to(".hero-tagline, .hero-ctas", { y: -22, opacity: 0, duration: 0.14 }, 0.32)
        .to(".hero-eyebrow", { y: -12, opacity: 0, duration: 0.1 }, 0.42)
        .to(".hero-title", { yPercent: -8, duration: 0.1 }, 0.46)
        // The glass fades out with the headline, not before it — the panel
        // must not strip the headline of its "leaves last" moment.
        .to(".hero-glass", { yPercent: -6, opacity: 0, duration: 0.14 }, 0.5)
        .to(".hero-title", { yPercent: -30, opacity: 0, duration: 0.14 }, 0.5);
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="top"
      ref={rootRef}
      className="relative min-h-[100svh] overflow-hidden"
    >
      {/* Background — faint technical grid, masked to fade at the edges */}
      <div
        className="hero-grid pointer-events-none absolute inset-0"
        aria-hidden="true"
      />

      {/* Text + content — centered in the free space; the scroll cue sits
          at the very bottom of the viewport-height column. The Earth on the
          page-wide TriangleWorld canvas shows through behind it. */}
      <Container className="hero-content relative z-10 flex min-h-[100svh] flex-col py-24 md:py-28">
        <div className="flex flex-1 flex-col justify-center">
          {/* The headline block sits in the same frosted-glass recipe as the
              workspace card — the fixed triangle canvas blurs behind it. */}
          <GlassCard className="hero-glass w-fit max-w-full p-6 sm:p-8 lg:p-10">
            <HeroTypography />
            <p className="hero-tagline mt-10 max-w-md text-lg font-extralight leading-relaxed text-muted-foreground md:text-xl">
              {site.tagline}
            </p>
            <div className="hero-ctas mt-12 flex flex-wrap items-center gap-8">
              <Magnetic>
                <Button nativeButton={false} render={<a href="#work" />}>
                  View work
                  <ArrowDown className="size-4 transition-transform duration-200 group-hover/button:translate-y-0.5" />
                </Button>
              </Magnetic>
              <Magnetic strength={0.2}>
                <a
                  href={site.github}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.03em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  GitHub
                  <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </Magnetic>
            </div>
          </GlassCard>
        </div>

        {/* Scroll cue hugs the bottom of the viewport-height column */}
        <HeroScrollIndicator className="pt-20 md:pt-24" />
      </Container>

      {/* Foreground — floating card (in flow on mobile, overlapping on desktop) */}
      <div className="relative z-20 mt-4 px-5 pb-12 sm:px-8 lg:absolute lg:bottom-28 lg:right-[3vw] lg:mt-0 lg:px-0 lg:pb-0">
        <Magnetic strength={0.08}>
          <WorkspacePanel />
        </Magnetic>
      </div>

      {/* Edge labels */}
      <div className="hero-label absolute right-5 top-20 z-30 hidden font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground md:block">
        portfolio — v2 / <CurrentYear />
      </div>
      <a
        href={site.github}
        target="_blank"
        rel="noreferrer"
        className="hero-side-label absolute left-5 top-1/2 z-30 hidden -translate-y-1/2 items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground lg:flex"
        style={{ writingMode: "vertical-rl" }}
      >
        github — cata5
      </a>
    </section>
  );
}
