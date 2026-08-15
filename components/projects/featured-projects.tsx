"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

import { Container } from "@/components/container";
import { GlassCard } from "@/components/glass-card";
import { ProjectLink } from "@/components/motion/project-link";
import { Reveal } from "@/components/motion/reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { SectionHeader } from "@/components/section";
import { projects } from "@/data/projects";
import type { Project } from "@/data/projects";
import { cn } from "@/lib/utils";

/**
 * The flagship work section. The featured project — Vortex — is presented as
 * a three-runtime showcase (Android, TV, PC) inside matching device frames.
 * Everything else lives in the explorer below.
 */

const vortex = projects.find((p) => p.id === "vortex") ?? null;

type Runtime = NonNullable<Project["runtimes"]>[number];

/** Screenshot inside a device frame, with an honest placeholder fallback. */
function FrameScreen({
  src,
  alt,
  sizes,
}: {
  src: string | null;
  alt: string;
  sizes: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-contain"
      />
    );
  }
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, transparent 0 14px, color-mix(in srgb, var(--border) 30%, transparent) 14px 15px)",
      }}
    >
      <p className="px-8 text-center font-mono text-[9px] uppercase leading-relaxed tracking-[0.18em] text-muted-foreground">
        screenshot pending
      </p>
    </div>
  );
}

/** Android handset: squarer corners, punch-hole camera, gesture bar. */
function PhoneFrame({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "w-[220px] transition-transform duration-300 ease-out hover:-translate-y-2 sm:w-[248px]",
        className,
      )}
    >
      <div className="relative aspect-[9/19] rounded-[1.7rem] border border-border/80 bg-neutral-900/90 p-1.5 shadow-xl shadow-black/40 ring-1 ring-white/10 backdrop-blur-md">
        <div className="relative h-full w-full overflow-hidden rounded-[1.35rem] bg-black">
          <FrameScreen src={src} alt={alt} sizes="260px" />
          <div
            className="absolute left-1/2 top-[0.55rem] z-10 size-1.5 -translate-x-1/2 rounded-full bg-foreground/60 ring-1 ring-inset ring-foreground/20"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-1.5 left-1/2 h-[3px] w-10 -translate-x-1/2 rounded-full bg-foreground/25"
            aria-hidden="true"
          />
        </div>
      </div>
    </figure>
  );
}

/** TV: Ultra-slim bezel cinematic OLED TV with sleek pedestal stand and status indicator. */
function TVFrame({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "flex w-[440px] flex-col items-center transition-transform duration-300 ease-out hover:-translate-y-2 sm:w-[580px] lg:w-[620px]",
        className,
      )}
    >
      {/* OLED TV Panel */}
      <div className="relative w-full rounded-xl border border-border/80 bg-neutral-900/90 p-1.5 shadow-2xl shadow-black/40 ring-1 ring-white/10 backdrop-blur-md">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-black">
          <FrameScreen src={src} alt={alt} sizes="640px" />
          {/* Subtle screen glass glare sheen */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent" />
          {/* Power / Smart status LED */}
          <div
            className="absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-signal/80 shadow-[0_0_6px_var(--signal)]"
            aria-hidden="true"
          />
        </div>
      </div>
      {/* Sleek metallic neck & trapezoidal pedestal stand */}
      <div className="h-3 w-8 bg-gradient-to-b from-foreground/20 to-foreground/10" aria-hidden="true" />
      <div className="h-1.5 w-40 rounded-full bg-gradient-to-r from-foreground/5 via-foreground/25 to-foreground/5 shadow-sm" aria-hidden="true" />
    </figure>
  );
}

/** Desktop PC: Ultra-wide curved studio monitor, tempered-glass RGB tower, mechanical keyboard & mouse. */
function DesktopFrame({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "flex w-[440px] flex-col items-center transition-transform duration-300 ease-out hover:-translate-y-2 sm:w-[580px] lg:w-[620px]",
        className,
      )}
    >
      {/* Monitor + Tower Setup */}
      <div className="flex w-full items-end gap-3.5 sm:gap-4">
        {/* Pro Studio Monitor */}
        <div className="flex flex-1 flex-col items-center">
          <div className="relative w-full rounded-lg border border-border/80 bg-neutral-900/90 p-1.5 shadow-xl shadow-black/30 ring-1 ring-white/10 backdrop-blur-md">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[0.35rem] bg-black">
              <FrameScreen src={src} alt={alt} sizes="540px" />
              {/* Screen gloss sheen */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent" />
            </div>
          </div>
          {/* Ergonomic metallic monitor neck & stand base */}
          <div className="h-3.5 w-5 bg-gradient-to-b from-foreground/25 to-foreground/15" aria-hidden="true" />
          <div className="h-1.5 w-28 rounded-full bg-gradient-to-r from-foreground/5 via-foreground/25 to-foreground/5" aria-hidden="true" />
        </div>

        {/* Tempered Glass PC Tower */}
        <div className="flex w-[22%] flex-col items-center">
          <div
            className="relative w-full rounded-lg border border-border/70 bg-neutral-950/90 p-2 shadow-xl shadow-black/40 ring-1 ring-white/10"
            style={{ aspectRatio: "3 / 7" }}
          >
            {/* Illuminated Power Button */}
            <div
              className="absolute right-2 top-2 size-1.5 rounded-full bg-signal shadow-[0_0_6px_var(--signal)]"
              aria-hidden="true"
            />
            {/* Front I/O Ports */}
            <div className="absolute right-2 top-5 flex flex-col gap-1">
              <div className="h-[2px] w-2 rounded-full bg-foreground/30" />
              <div className="h-[2px] w-1.5 rounded-full bg-foreground/30" />
            </div>
            {/* Dual RGB Liquid Cooling Fan Rings */}
            <div className="absolute left-1/2 top-[24%] size-7 -translate-x-1/2 rounded-full border border-signal/40 bg-signal/5 shadow-[0_0_8px_rgba(var(--signal),0.2)]">
              <div className="absolute inset-1.5 rounded-full border border-signal/60" />
            </div>
            <div className="absolute left-1/2 top-[52%] size-7 -translate-x-1/2 rounded-full border border-purple-400/40 bg-purple-500/5 shadow-[0_0_8px_rgba(168,85,247,0.2)]">
              <div className="absolute inset-1.5 rounded-full border border-purple-400/60" />
            </div>
            {/* Bottom PSU Shroud & Air Intake Grille */}
            <div className="absolute inset-x-2 bottom-2 space-y-1">
              <div className="h-[2px] w-full rounded-full bg-foreground/20" />
              <div className="h-[2px] w-full rounded-full bg-foreground/20" />
              <div className="h-[2px] w-3/4 rounded-full bg-foreground/15" />
            </div>
          </div>
          {/* Tower Rubber Dampening Feet */}
          <div className="mt-0.5 flex w-full justify-between px-1">
            <div className="h-1 w-2 rounded-sm bg-foreground/30" />
            <div className="h-1 w-2 rounded-sm bg-foreground/30" />
          </div>
        </div>
      </div>

      {/* Desk Setup: Mechanical Keyboard & Precision Mouse */}
      <div className="mt-3.5 flex w-[90%] items-center justify-center gap-3">
        {/* Backlit Mechanical Keyboard */}
        <div className="flex h-3 w-[58%] items-center justify-center rounded-[0.25rem] border border-border/50 bg-foreground/10 px-1 shadow-sm">
          <div className="h-1.5 w-full rounded-sm bg-foreground/20" />
        </div>
        {/* Ergonomic Wireless Mouse */}
        <div className="h-3 w-2.5 rounded-full border border-border/50 bg-foreground/20 shadow-sm" />
      </div>
      {/* Desk Edge Accent Line */}
      <div className="mt-2 h-[2px] w-[95%] rounded-full bg-gradient-to-r from-transparent via-foreground/15 to-transparent" aria-hidden="true" />
    </figure>
  );
}

function RuntimeFrame({
  runtime,
  title,
}: {
  runtime: Runtime;
  title: string;
}) {
  const alt = `${title} — ${runtime.label} screenshot`;
  if (runtime.device === "phone") {
    return <PhoneFrame src={runtime.shot} alt={alt} />;
  }
  if (runtime.device === "tv") {
    return <TVFrame src={runtime.shot} alt={alt} />;
  }
  return <DesktopFrame src={runtime.shot} alt={alt} />;
}

/** Gentle auto-advance: ~6s, paused on hover / off-screen / reduced motion. */
function useAutoAdvance(
  count: number,
  index: number,
  go: (next: number) => void,
) {
  const reduce = !!useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.35 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (reduce || !visible || count < 2) return;
    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      go((index + 1) % count);
    }, 6000);
    return () => window.clearInterval(id);
  }, [reduce, visible, count, index, go]);

  return {
    rootRef,
    onMouseEnter: () => {
      pausedRef.current = true;
    },
    onMouseLeave: () => {
      pausedRef.current = false;
    },
    onFocusCapture: () => {
      pausedRef.current = true;
    },
    onBlurCapture: () => {
      pausedRef.current = false;
    },
  };
}

/**
 * The flagship showcase: the featured project's runtimes (Android · TV · PC)
 * in matching device frames, with the rest of the mobile work beneath it.
 */
export function FeaturedProjects() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const reduce = !!useReducedMotion();

  const runtimes = vortex?.runtimes ?? [];

  const go = useCallback(
    (next: number) => {
      const count = runtimes.length;
      if (count === 0) return;
      setDirection((next - index + count) % count === 1 ? 1 : -1);
      setIndex(((next % count) + count) % count);
    },
    [index, runtimes.length],
  );

  const { rootRef, ...auto } = useAutoAdvance(runtimes.length, index, go);

  if (!vortex || runtimes.length === 0) return null;

  const active = runtimes[index];

  const slideVariants = reduce
    ? {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    }
    : {
      initial: { opacity: 0, x: direction > 0 ? 48 : -48 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: direction > 0 ? -48 : 48 },
    };

  return (
    <section id="work" className="relative scroll-mt-16">
      <Container className="pt-24 md:pt-36">
        {/* Eyebrow sits outside the GlassCard */}
        <SectionHeader eyebrow="My best project" />

        {/* Compact GlassCard wrapping ONLY the title and description under the eyebrow */}
        <GlassCard className="mt-4 w-fit max-w-lg p-5 sm:p-6 md:bg-card/70">
          <TextReveal
            as="h2"
            className="text-2xl font-normal tracking-[-0.02em] md:text-3xl"
          >
            {vortex.title}
          </TextReveal>
          <Reveal delay={0.1}>
            <p className="mt-3 text-sm font-extralight leading-relaxed text-muted-foreground sm:text-base">
              One library across three runtimes — Android, TV and PC.
              Self-hosted media streaming from your own Google Drive, SMB,
              SFTP, FTP and WebDAV sources.
            </p>
          </Reveal>
        </GlassCard>
      </Container>

      {/* Runtime showcase — unified single GlassCard containing controls and device frame */}
      <Container className="mt-8 md:mt-12">
        <div
          ref={rootRef}
          onMouseEnter={auto.onMouseEnter}
          onMouseLeave={auto.onMouseLeave}
          onFocusCapture={auto.onFocusCapture}
          onBlurCapture={auto.onBlurCapture}
        >
          <GlassCard className="p-6 sm:p-8 md:bg-card/70">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              {/* Left column — runtime selector + details + CTA. */}
              <div className="flex flex-col lg:col-span-4">
                <div
                  role="tablist"
                  aria-label="Vortex runtimes"
                  className="flex flex-col gap-2"
                >
                  {runtimes.map((r, i) => {
                    const selected = i === index;
                    return (
                      <button
                        key={r.id}
                        role="tab"
                        aria-selected={selected}
                        onClick={() => go(i)}
                        className={cn(
                          "group rounded-xl border px-4 py-3 text-left transition-all duration-300",
                          selected
                            ? "border-signal/40 bg-signal/10"
                            : "border-border/50 bg-muted/10 hover:border-border hover:bg-muted/20",
                        )}
                      >
                        <p
                          className={cn(
                            "font-mono text-[11px] uppercase tracking-[0.14em]",
                            selected ? "text-signal" : "text-muted-foreground",
                          )}
                        >
                          {r.label}
                          {vortex.year ? ` — ${vortex.year}` : ""}
                        </p>
                        <h3
                          className={cn(
                            "mt-1 text-base font-normal tracking-[-0.02em] transition-colors duration-300",
                            selected
                              ? "text-foreground"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        >
                          {vortex.title} · {r.label}
                        </h3>
                      </button>
                    );
                  })}
                </div>

                {/* Active runtime details — crossfade with the frame. */}
                <div className="mt-5 min-h-[6rem] flex-1">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={active.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      {active.description && (
                        <p className="max-w-sm text-base font-extralight leading-relaxed text-muted-foreground">
                          {active.description}
                        </p>
                      )}
                      <p className="mt-3 font-mono text-[12px] text-muted-foreground">
                        {vortex.technologies.join(" · ")}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <ProjectLink
                  href={`/projects/${vortex.id}`}
                  src={vortex.image ?? undefined}
                  className="group mt-5 inline-flex w-fit items-center gap-2 text-sm font-medium transition-colors hover:text-signal"
                >
                  View the full project
                  <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </ProjectLink>
              </div>

              {/* Right column — Frame stage */}
              <div className="relative flex min-h-[32rem] items-center justify-center overflow-hidden sm:min-h-[36rem] lg:min-h-[38rem] lg:col-span-8">
                <div className="flex w-full items-center justify-center overflow-hidden">
                  <AnimatePresence
                    mode="popLayout"
                    initial={false}
                    custom={direction}
                  >
                    <motion.div
                      key={active.id}
                      custom={direction}
                      variants={slideVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{
                        duration: 0.4,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="flex justify-center"
                    >
                      <RuntimeFrame runtime={active} title={vortex.title} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Navigation Controls: Previous, Dots, Next */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Previous runtime"
              onClick={() => go(index - 1)}
              className="grid size-10 place-items-center rounded-full border border-border/60 bg-card/70 text-muted-foreground backdrop-blur-sm transition-all duration-300 hover:border-signal/50 hover:text-signal active:scale-95"
            >
              <ChevronLeft className="size-5" />
            </button>

            <div className="flex items-center gap-2.5">
              {runtimes.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  aria-label={`Go to ${r.label}`}
                  aria-current={i === index}
                  onClick={() => go(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === index
                      ? "w-8 bg-signal"
                      : "w-2.5 bg-foreground/25 hover:bg-foreground/50",
                  )}
                />
              ))}
            </div>

            <button
              type="button"
              aria-label="Next runtime"
              onClick={() => go(index + 1)}
              className="grid size-10 place-items-center rounded-full border border-border/60 bg-card/70 text-muted-foreground backdrop-blur-sm transition-all duration-300 hover:border-signal/50 hover:text-signal active:scale-95"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
