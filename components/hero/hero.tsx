"use client";

import { useRef } from "react";

import { ArrowDown, ArrowUpRight, Layers } from "lucide-react";

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
import { scrollToId } from "@/components/motion/lenis";
import { EASE, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const { content, isEditing, selectedField, setSelectedField } = useEditor();
  const site = content.site;

  const isSectionSelected =
    isEditing &&
    selectedField?.type === "section" &&
    (selectedField?.meta as { sectionId?: string })?.sectionId === "top";

  const handleHeroClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!isEditing) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, [data-editable-field='true']")) {
      return;
    }
    setSelectedField({
      path: "section.top",
      label: "Section: Hero (Identity & Bio)",
      type: "section",
      meta: { sectionId: "top" },
    });
    scrollToId("top");
  };

  useIsomorphicLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      let scrubBuilt = false;
      function buildScrubTweens() {
        if (scrubBuilt) return;
        scrubBuilt = true;
        tl.progress(1);

        st.to(
          ".hero-scroll-hint",
          { autoAlpha: 0, duration: 0.08 },
          0,
        )
          .to(
            ".hero-grid",
            { autoAlpha: 0, yPercent: 4, duration: 0.1 },
            0,
          )
          .to(
            ".hero-label, .hero-side-label",
            { autoAlpha: 0, duration: 0.1 },
            0,
          )
          .to(
            ".hero-workspace",
            { yPercent: -15, autoAlpha: 0, duration: 0.2 },
            0,
          )
          .to(
            ".hero-glass",
            { yPercent: -12, autoAlpha: 0, duration: 0.24 },
            0,
          );

        st.scrollTrigger?.refresh();
      }

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

      // ---- Pinned scroll scrub ---------------------------------------
      // Pinned spacer is created immediately on mount.
      // Tweens are attached when entrance completes, or immediately on first scroll/scrolled reload.
      const st = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () =>
            "+=" +
            Math.round(
              window.innerHeight * (window.innerWidth < 640 ? 0.75 : 0.9),
            ),
          pin: true,
          anticipatePin: 1,
          scrub: 0.35,
          onUpdate: (self) => {
            if (self.progress > 0.005) {
              buildScrubTweens();
            }
          },
        },
        defaults: { ease: "power1.out" },
      });

      // If page was reloaded while already scrolled, prime scrub immediately:
      if (typeof window !== "undefined" && window.scrollY > 5) {
        buildScrubTweens();
      }
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="top"
      ref={rootRef}
      onClick={handleHeroClick}
      className={cn(
        "relative min-h-[100svh] overflow-hidden transition-all duration-200",
        isEditing && "cursor-pointer group/section",
        isEditing && !isSectionSelected && "hover:ring-1 hover:ring-signal/40 hover:ring-offset-4 hover:ring-offset-background",
        isSectionSelected && "ring-2 ring-signal ring-offset-6 ring-offset-background bg-signal/[0.015]",
      )}
    >
      {/* Floating Section Status Badge when Selected in Edit Mode */}
      {isEditing && isSectionSelected && (
        <div className="pointer-events-none absolute right-6 top-6 z-40 inline-flex items-center gap-1.5 rounded-full bg-signal px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-signal-ink shadow-xl shadow-signal/30 animate-in fade-in zoom-in-95 duration-150">
          <Layers className="size-3" />
          <span>Section: Hero (Editing All Text)</span>
        </div>
      )}

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
              <p className="hero-tagline mt-6 sm:mt-8 lg:mt-10 max-w-md text-base sm:text-lg md:text-lg lg:text-xl font-light leading-relaxed text-muted-foreground">
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
        Portfolio / <CurrentYear />
      </div>
      <a
        href={site.github}
        target="_blank"
        rel="noreferrer"
        className="hero-side-label absolute left-5 top-1/2 z-30 hidden -translate-y-1/2 items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground lg:flex"
        style={{ writingMode: "vertical-rl" }}
      >
        github - cata5
      </a>
    </section>
  );
}
