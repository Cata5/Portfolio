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
import { Editable } from "@/components/editor/editable";
import { useEditor } from "@/components/editor/editor-context";
import { EASE, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const { content } = useEditor();
  const site = content.site;

  useIsomorphicLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      // ---- Pinned scroll ----------------------------------------------
      // The scrollTrigger is created empty (pin included) so the pin spacer
      // exists from first paint and no layout jump happens later. The fade
      // tweens are added in the entrance's onComplete below: GSAP records a
      // fromTo tween's start values from the element's LIVE state on first
      // render, and if that render happens while the entrance's hidden
      // from-state is still applied (e.g. a reload while scrolled, where
      // scroll restoration makes the scrub render mid-hero), scrolling back
      // up would render those captured hidden values and the hero content
      // would never return. Adding the tweens after the entrance completes
      // guarantees they record the visible state on every load path.
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
          scrub: true,
        },
        // Explicit from-values keep the start state deterministic, and
        // immediateRender stays off so the scrub never clobbers the entrance
        // animation.
        defaults: { ease: EASE.none, immediateRender: false },
      });

      // ---- Entrance -------------------------------------------------
      const tl = gsap.timeline({
        defaults: { ease: EASE.out },
        onComplete: buildScrubTweens,
      });

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

      // Typography recedes cleanly — the labels first, the headline last —
      // so the material owns the remaining pin. Added only after the
      // entrance completes (see above) so the tweens record visible start
      // values on every load path.
      function buildScrubTweens() {
      st.fromTo(
          ".hero-scroll-hint",
          { opacity: 1 },
          { opacity: 0, duration: 0.05 },
          0.05,
        )
        .fromTo(
          ".hero-grid",
          { opacity: 1, yPercent: 0 },
          { opacity: 0, yPercent: 6, duration: 0.08 },
          0.06,
        )
        .fromTo(
          ".hero-label, .hero-side-label",
          { opacity: 1 },
          { opacity: 0, duration: 0.06 },
          0.12,
        )
        .fromTo(
          ".hero-workspace",
          { yPercent: 0, opacity: 1 },
          { yPercent: -22, opacity: 0, duration: 0.12 },
          0.2,
        )
        .fromTo(
          ".hero-tagline, .hero-ctas",
          { y: 0, opacity: 1 },
          { y: -22, opacity: 0, duration: 0.14 },
          0.32,
        )
        .fromTo(
          ".hero-eyebrow",
          { y: 0, opacity: 1 },
          { y: -12, opacity: 0, duration: 0.1 },
          0.42,
        )
        .fromTo(
          ".hero-title",
          { yPercent: 0 },
          { yPercent: -8, duration: 0.1 },
          0.46,
        )
        // The glass fades out with the headline, not before it — the panel
        // must not strip the headline of its "leaves last" moment.
        .fromTo(
          ".hero-glass",
          { yPercent: 0, opacity: 1 },
          { yPercent: -6, opacity: 0, duration: 0.14 },
          0.5,
        )
        .fromTo(
          ".hero-title",
          { yPercent: -8, opacity: 1 },
          { yPercent: -30, opacity: 0, duration: 0.14 },
          0.5,
        );
      }
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
      <Container className="hero-content relative z-10 flex min-h-[100svh] flex-col py-16 sm:py-20 md:py-20 lg:py-28">
        <div className="flex flex-1 flex-col justify-center">
          {/* The headline block sits in the same frosted-glass recipe as the
              workspace card — the fixed triangle canvas blurs behind it. */}
          <GlassCard className="hero-glass w-fit max-w-full md:max-w-[520px] lg:max-w-[640px] xl:max-w-[720px] p-5 sm:p-7 lg:p-9">
            <HeroTypography />
            <Editable path="site.tagline" label="Tagline" type="textarea">
              <p className="hero-tagline mt-6 sm:mt-8 lg:mt-10 max-w-md text-base sm:text-lg md:text-lg lg:text-xl font-extralight leading-relaxed text-muted-foreground">
                {site.tagline}
              </p>
            </Editable>
            <div className="hero-ctas mt-8 sm:mt-10 lg:mt-12 flex flex-wrap items-center gap-6 sm:gap-8">
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
        <HeroScrollIndicator className="pt-8 sm:pt-12 md:pt-14 lg:pt-20" />
      </Container>

      {/* Foreground — floating card (in flow on mobile, floating on tablet/desktop) */}
      <div className="relative z-20 mt-4 px-5 pb-12 sm:px-8 md:absolute md:bottom-16 md:right-6 md:mt-0 md:px-0 md:pb-0 lg:bottom-28 lg:right-[3vw]">
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
