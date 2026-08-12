"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { GlassCard } from "@/components/glass-card";
import { Section } from "@/components/section";
import { TextReveal } from "@/components/motion/text-reveal";
import { projects } from "@/data/projects";
import type { Project } from "@/data/projects";
import { cn } from "@/lib/utils";

const mobileApps = projects.filter(
  (p) =>
    p.category === "Android" ||
    p.category === "iOS" ||
    p.deviceFrame !== undefined,
);

/** Label shown under the device frame and in the selector list. */
function deviceLabel(project: Project) {
  if (project.deviceFrame === "tablet") return "Android Tablet";
  if (project.deviceFrame === "phone") return "Phone";
  return project.category;
}

function DeviceScreen({
  project,
  sizes,
}: {
  project: Project;
  sizes: string;
}) {
  // The device frame must use a shot that matches its orientation.
  // `deviceShot` is set explicitly for that; otherwise fall back to the
  // first screenshot and finally to `image` (chosen for wide crops, e.g.
  // Vortex's TV shot) only when nothing better exists.
  const src = project.deviceShot ?? project.screenshots?.[0] ?? project.image ?? null;
  if (!project.placeholder && src) {
    return (
      <Image
        src={src}
        alt={`${project.title} — screenshot`}
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
        {project.placeholder ? "placeholder app" : "screenshot pending"}
      </p>
    </div>
  );
}

function PhoneFrame({ project }: { project: Project }) {
  return (
    <figure className="w-[220px] transition-transform duration-300 ease-out hover:-translate-y-2 sm:w-[248px]">
      {/* Android handset: squarer corners, a tiny punch-hole camera in the
          screen (not an Apple notch), and the bottom gesture bar. */}
      <div className="relative aspect-[9/19] rounded-[1.7rem] bg-foreground/10 p-1.5 shadow-[0_0_0_1px_var(--border)]">
        <div className="relative h-full w-full overflow-hidden rounded-[1.35rem] bg-foreground/5">
          <DeviceScreen project={project} sizes="260px" />
          {/* Punch-hole camera — a small lens cutout at the top centre. */}
          <div
            className="absolute left-1/2 top-[0.55rem] z-10 size-1.5 -translate-x-1/2 rounded-full bg-foreground/60 ring-1 ring-inset ring-foreground/20"
            aria-hidden="true"
          />
          {/* Gesture bar — Android 10+ navigation pill. */}
          <div
            className="absolute bottom-1.5 left-1/2 h-[3px] w-10 -translate-x-1/2 rounded-full bg-foreground/25"
            aria-hidden="true"
          />
        </div>
      </div>
      <figcaption className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {project.appsTitle ?? project.title} — {deviceLabel(project)}
      </figcaption>
    </figure>
  );
}

function TabletFrame({ project }: { project: Project }) {
  return (
    <figure className="w-[300px] transition-transform duration-300 ease-out hover:-translate-y-2 sm:w-[340px]">
      {/* Android tablet: landscape slab with a centered camera dot on the
          top bezel and a subtle home pill at the bottom. */}
      <div className="relative aspect-[16/10] rounded-[1.5rem] bg-foreground/10 p-1.5 shadow-[0_0_0_1px_var(--border)]">
        <div className="relative h-full w-full overflow-hidden rounded-[1.15rem] bg-foreground/5">
          <DeviceScreen project={project} sizes="360px" />
          <div
            className="absolute left-1/2 top-[0.55rem] z-10 size-1.5 -translate-x-1/2 rounded-full bg-foreground/60 ring-1 ring-inset ring-foreground/20"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-1.5 left-1/2 h-[3px] w-12 -translate-x-1/2 rounded-full bg-foreground/25"
            aria-hidden="true"
          />
        </div>
      </div>
      <figcaption className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {project.appsTitle ?? project.title} — {deviceLabel(project)}
      </figcaption>
    </figure>
  );
}

function AppFrame({ project }: { project: Project }) {
  return project.deviceFrame === "tablet" ? (
    <TabletFrame project={project} />
  ) : (
    <PhoneFrame project={project} />
  );
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

export function Apps() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const reduce = !!useReducedMotion();

  const go = useCallback(
    (next: number) => {
      const count = mobileApps.length;
      if (count === 0) return;
      setDirection((next - index + count) % count === 1 ? 1 : -1);
      setIndex(((next % count) + count) % count);
    },
    [index],
  );

  const { rootRef, ...auto } = useAutoAdvance(
    mobileApps.length,
    index,
    go,
  );

  if (mobileApps.length === 0) return null;

  const active = mobileApps[index];

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
    <Section id="apps" eyebrow="Mobile Apps">
      {/* The whole Apps block floats on the same frosted glass as the other
          sections — the persistent triangle material blurs through behind
          the phone frames. */}
      <GlassCard className="p-6 sm:p-10 lg:p-12">
        <TextReveal
          as="h2"
          className="mb-12 text-3xl font-normal tracking-[-0.02em] md:text-4xl"
        >
          Mobile work
        </TextReveal>

        <div
          ref={rootRef}
          onMouseEnter={auto.onMouseEnter}
          onMouseLeave={auto.onMouseLeave}
          onFocusCapture={auto.onFocusCapture}
          onBlurCapture={auto.onBlurCapture}
          className="grid gap-12 lg:grid-cols-12"
        >
          {/* Selector list — click an app to bring its device into focus. */}
          <div className="flex flex-col justify-center gap-3 lg:col-span-5">
            <div role="tablist" aria-label="Mobile apps" className="flex flex-col gap-2">
              {mobileApps.map((app, i) => {
                const selected = i === index;
                return (
                  <button
                    key={app.id}
                    role="tab"
                    aria-selected={selected}
                    onClick={() => go(i)}
                    className={cn(
                      "group rounded-xl border px-5 py-4 text-left transition-all duration-300",
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
                      {deviceLabel(app)}
                      {app.year ? ` — ${app.year}` : ""}
                    </p>
                    <h3
                      className={cn(
                        "mt-1.5 text-xl font-normal tracking-[-0.02em] transition-colors duration-300",
                        selected
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    >
                      {app.appsTitle ?? app.title}
                    </h3>
                  </button>
                );
              })}
            </div>

            {/* Active app details — crossfade with the frame. */}
            <div className="mt-6 min-h-[7rem]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <p className="max-w-sm text-lg font-extralight leading-relaxed text-muted-foreground">
                    {active.summary}
                  </p>
                  {active.technologies.length > 0 && (
                    <p className="mt-4 font-mono text-[12px] text-muted-foreground">
                      {active.technologies.join(" · ")}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Carousel stage. */}
          <div className="relative flex items-center justify-center lg:col-span-7">
            <button
              type="button"
              aria-label="Previous app"
              onClick={() => go(index - 1)}
              className="absolute left-0 z-10 grid size-11 place-items-center rounded-full border border-border/60 bg-card/70 text-muted-foreground backdrop-blur-sm transition-all duration-300 hover:border-signal/50 hover:text-signal"
            >
              <ChevronLeft className="size-5" />
            </button>

            <div className="flex min-h-[34rem] w-full items-center justify-center overflow-hidden sm:min-h-[36rem]">
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
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
                  <AppFrame project={active} />
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              type="button"
              aria-label="Next app"
              onClick={() => go(index + 1)}
              className="absolute right-0 z-10 grid size-11 place-items-center rounded-full border border-border/60 bg-card/70 text-muted-foreground backdrop-blur-sm transition-all duration-300 hover:border-signal/50 hover:text-signal"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        {/* Dots */}
        <div className="mt-8 flex items-center justify-center gap-2.5">
          {mobileApps.map((app, i) => (
            <button
              key={app.id}
              type="button"
              aria-label={`Go to ${app.title}`}
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
      </GlassCard>
    </Section>
  );
}
