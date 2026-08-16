"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  DownloadCloud,
  FileCode2,
  HardDrive,
  Key,
  Layers,
  Lock,
  Monitor,
  Play,
  Radio,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Table,
  Tv,
  Workflow,
  Zap,
} from "lucide-react";

import { Container } from "@/components/container";
import { GlassCard } from "@/components/glass-card";
import { ProjectLink } from "@/components/motion/project-link";
import { Reveal } from "@/components/motion/reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { SectionHeader } from "@/components/section";
import { projects } from "@/data/projects";
import type { Project } from "@/data/projects";
import { cn } from "@/lib/utils";

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

/** Android handset frame — responsive from 190px on mobile to 240px on desktop */
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
        "w-[190px] sm:w-[220px] md:w-[240px] transition-transform duration-300 ease-out hover:-translate-y-1.5",
        className,
      )}
    >
      <div className="relative aspect-[9/19] rounded-[1.6rem] border border-border/80 bg-neutral-900/95 p-1.5 shadow-xl shadow-black/50 ring-1 ring-white/10 backdrop-blur-md">
        <div className="relative h-full w-full overflow-hidden rounded-[1.3rem] bg-black">
          <FrameScreen src={src} alt={alt} sizes="260px" />
          {/* Punch-hole camera */}
          <div
            className="absolute left-1/2 top-[0.55rem] z-10 size-1.5 -translate-x-1/2 rounded-full bg-foreground/60 ring-1 ring-inset ring-foreground/20"
            aria-hidden="true"
          />
          {/* Gesture bar */}
          <div
            className="absolute bottom-1.5 left-1/2 h-[3px] w-10 -translate-x-1/2 rounded-full bg-foreground/25"
            aria-hidden="true"
          />
        </div>
      </div>
    </figure>
  );
}

/** TV OLED Frame — responsive width, fits mobile cleanly */
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
        "flex w-full max-w-[320px] sm:max-w-[480px] md:max-w-[560px] lg:max-w-[600px] flex-col items-center transition-transform duration-300 ease-out hover:-translate-y-1.5",
        className,
      )}
    >
      {/* OLED TV Panel */}
      <div className="relative w-full rounded-xl border border-border/80 bg-neutral-900/95 p-1.5 shadow-2xl shadow-black/50 ring-1 ring-white/10 backdrop-blur-md">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-black">
          <FrameScreen src={src} alt={alt} sizes="640px" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent" />
          {/* Power status LED */}
          <div
            className="absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-signal/80 shadow-[0_0_6px_var(--signal)]"
            aria-hidden="true"
          />
        </div>
      </div>
      {/* Sleek metallic neck & pedestal stand */}
      <div className="h-2.5 w-8 bg-gradient-to-b from-foreground/20 to-foreground/10" aria-hidden="true" />
      <div className="h-1.5 w-32 sm:w-40 rounded-full bg-gradient-to-r from-foreground/5 via-foreground/25 to-foreground/5 shadow-sm" aria-hidden="true" />
    </figure>
  );
}

/** Desktop PC Frame — responsive width, fits mobile cleanly */
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
        "flex w-full max-w-[320px] sm:max-w-[480px] md:max-w-[560px] lg:max-w-[600px] flex-col items-center transition-transform duration-300 ease-out hover:-translate-y-1.5",
        className,
      )}
    >
      <div className="flex w-full items-end gap-2.5 sm:gap-3.5">
        {/* Pro Studio Monitor */}
        <div className="flex flex-1 flex-col items-center">
          <div className="relative w-full rounded-lg border border-border/80 bg-neutral-900/95 p-1.5 shadow-xl shadow-black/40 ring-1 ring-white/10 backdrop-blur-md">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[0.35rem] bg-black">
              <FrameScreen src={src} alt={alt} sizes="540px" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent" />
            </div>
          </div>
          <div className="h-3 w-4 bg-gradient-to-b from-foreground/25 to-foreground/15" aria-hidden="true" />
          <div className="h-1.5 w-24 rounded-full bg-gradient-to-r from-foreground/5 via-foreground/25 to-foreground/5" aria-hidden="true" />
        </div>

        {/* Tempered Glass PC Tower */}
        <div className="flex w-[21%] flex-col items-center">
          <div
            className="relative w-full rounded-lg border border-border/70 bg-neutral-950/90 p-1.5 shadow-xl shadow-black/40 ring-1 ring-white/10"
            style={{ aspectRatio: "3 / 7" }}
          >
            <div className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-signal shadow-[0_0_6px_var(--signal)]" />
            <div className="absolute left-1/2 top-[24%] size-5 -translate-x-1/2 rounded-full border border-signal/40 bg-signal/5" />
            <div className="absolute left-1/2 top-[52%] size-5 -translate-x-1/2 rounded-full border border-purple-400/40 bg-purple-500/5" />
          </div>
          <div className="mt-0.5 flex w-full justify-between px-1">
            <div className="h-1 w-1.5 rounded-sm bg-foreground/30" />
            <div className="h-1 w-1.5 rounded-sm bg-foreground/30" />
          </div>
        </div>
      </div>

      {/* Keyboard & Mouse */}
      <div className="mt-2.5 flex w-[85%] items-center justify-center gap-2.5">
        <div className="flex h-2.5 w-[55%] items-center justify-center rounded border border-border/50 bg-foreground/10 px-1">
          <div className="h-1 w-full rounded-sm bg-foreground/20" />
        </div>
        <div className="h-2.5 w-2 rounded-full border border-border/50 bg-foreground/20" />
      </div>
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

/** Real Platform Comparison Matrix Data from project evidence */
const PLATFORM_MATRIX = [
  {
    dimension: "UI Architecture",
    android: "Jetpack Compose Adaptive UI",
    tv: "Android TV Leanback + Compose",
    pc: "Desktop Compose Windowing",
  },
  {
    dimension: "Primary Input",
    android: "Touch Gestures & Haptics",
    tv: "5-Way D-Pad & HDMI-CEC",
    pc: "Keyboard Hotkeys & Mouse",
  },
  {
    dimension: "OAuth 2.0 Auth",
    android: "In-App WebView Flow",
    tv: "Device Flow (QR / Code Pairing)",
    pc: "System Browser Callback",
  },
  {
    dimension: "Playback Pipeline",
    android: "ExoPlayer / Media3 Battery-Aware",
    tv: "ExoPlayer + Audio Passthrough",
    pc: "ExoPlayer Direct Stream Decode",
  },
  {
    dimension: "Offline & Caching",
    android: "Background Download Queue + Room",
    tv: "Local TMDB Metadata Cache",
    pc: "Direct Multi-Source Streaming",
  },
  {
    dimension: "Target Hardware",
    android: "ARM64 Android 8.0+ Phones/Tablets",
    tv: "Google TV / 1.5GB RAM TV Sticks",
    pc: "Windows / Linux Multi-Threaded",
  },
];

/** Architecture Pipeline Layers */
const ARCH_LAYERS = [
  {
    layer: "01 · Presentation Layer",
    tech: "Jetpack Compose · Leanback TV · Desktop Windowing",
    desc: "Single adaptive design system rendered natively across mobile touch, TV 10-foot D-Pad, and desktop hotkeys.",
    icon: LayoutGridIcon,
  },
  {
    layer: "02 · State & Repository",
    tech: "Room DB · SQLite · TMDB Metadata API",
    desc: "Local-first reactive repository caches movie/TV posters, cast, episode tracking, and per-title resume timestamps.",
    icon: Database,
  },
  {
    layer: "03 · Remote Storage Providers",
    tech: "Google Drive API · SMB · SFTP · FTP · WebDAV",
    desc: "Pluggable client-side storage provider abstraction. Streams directly from personal cloud & LAN shares with zero central server.",
    icon: HardDrive,
  },
  {
    layer: "04 · Playback & Security",
    tech: "ExoPlayer / Media3 · Android Keystore",
    desc: "Hardware-accelerated media streaming with multi-track audio, subtitle rendering, and Keystore-encrypted credentials.",
    icon: Lock,
  },
];

function LayoutGridIcon(props: { className?: string }) {
  return <Layers {...props} />;
}

/**
 * Flagship Work Section:
 * Single-device focus stage + Engineering Architecture HUD & Platform Comparison Matrix.
 */
export function FeaturedProjects() {
  const [index, setIndex] = useState(1); // Default to TV (index 1)
  const [hudTab, setHudTab] = useState<"matrix" | "diagram" | "features">("matrix");
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

  // Auto advance every 8s, paused on hover
  const pausedRef = useRef(false);
  useEffect(() => {
    if (reduce) return;
    const interval = setInterval(() => {
      if (!pausedRef.current) {
        setIndex((prev) => (prev + 1) % runtimes.length);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [reduce, runtimes.length]);

  if (!vortex || runtimes.length === 0) return null;
  const active = runtimes[index];

  const slideVariants = reduce
    ? {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    }
    : {
      initial: { opacity: 0, x: direction > 0 ? 32 : -32 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: direction > 0 ? -32 : 32 },
    };

  return (
    <section id="work" className="relative scroll-mt-16">
      <Container className="pt-24 md:pt-36">
        <SectionHeader eyebrow="My best project" />

        <GlassCard className="mt-4 w-fit max-w-lg p-5 sm:p-6 md:bg-card/70">
          <TextReveal
            as="h2"
            className="text-2xl font-normal tracking-[-0.02em] md:text-3xl"
          >
            {vortex.title}
          </TextReveal>
          <Reveal delay={0.1}>
            <p className="mt-3 text-sm font-extralight leading-relaxed text-muted-foreground sm:text-base">
              One unified architecture across three runtimes — Android, Android TV and PC.
              Self-hosted direct media streaming from Google Drive, SMB, SFTP, FTP and WebDAV sources.
            </p>
          </Reveal>
        </GlassCard>
      </Container>

      {/* Part 1: Clean Device Showcase Stage */}
      <Container className="mt-8 md:mt-12">
        <div
          onMouseEnter={() => {
            pausedRef.current = true;
          }}
          onMouseLeave={() => {
            pausedRef.current = false;
          }}
        >
          <GlassCard className="p-5 sm:p-7 lg:p-8 md:bg-card/70">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              {/* Left column — runtime selector + details + CTA */}
              <div className="flex flex-col lg:col-span-4">
                <span className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-saffron">
                  Runtime Targets
                </span>

                <div
                  role="tablist"
                  aria-label="Vortex runtimes"
                  className="flex flex-col gap-2.5"
                >
                  {runtimes.map((r, i) => {
                    const selected = i === index;
                    const Icon = r.id === "android" ? Smartphone : r.id === "tv" ? Tv : Monitor;
                    return (
                      <button
                        key={r.id}
                        role="tab"
                        aria-selected={selected}
                        onClick={() => go(i)}
                        className={cn(
                          "group relative rounded-xl border p-3.5 text-left transition-all duration-300",
                          selected
                            ? "border-signal/70 bg-signal/15 shadow-[0_0_18px_rgba(56,189,248,0.18)]"
                            : "border-border/50 bg-muted/10 hover:border-border hover:bg-muted/20",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                "flex size-7 items-center justify-center rounded-lg border transition-colors",
                                selected
                                  ? "border-signal bg-signal/20 text-signal"
                                  : "border-border/60 bg-neutral-900/60 text-muted-foreground group-hover:text-foreground",
                              )}
                            >
                              <Icon className="size-3.5" />
                            </div>
                            <span
                              className={cn(
                                "text-sm font-medium tracking-tight transition-colors",
                                selected ? "text-foreground font-semibold" : "text-muted-foreground group-hover:text-foreground",
                              )}
                            >
                              {vortex.title} · {r.label}
                            </span>
                          </div>

                          {selected && (
                            <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-signal font-semibold">
                              <span className="size-1.5 rounded-full bg-signal animate-ping" />
                              active
                            </span>
                          )}
                        </div>

                        {selected && r.description && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.2 }}
                            className="mt-2.5 text-[13px] font-extralight leading-relaxed text-muted-foreground border-t border-signal/20 pt-2"
                          >
                            {r.description}
                          </motion.p>
                        )}
                      </button>
                    );
                  })}
                </div>

                <ProjectLink
                  href={`/projects/${vortex.id}`}
                  src={vortex.image ?? undefined}
                  className="group mt-5 inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-signal"
                >
                  View full project page &amp; GitHub
                  <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </ProjectLink>
              </div>

              {/* Right column — Single Focused Device Frame Stage (100% responsive on all screens) */}
              <div className="relative flex min-h-[22rem] sm:min-h-[28rem] lg:min-h-[32rem] lg:col-span-8 items-center justify-center overflow-hidden">
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
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="flex justify-center items-center w-full px-2"
                  >
                    <RuntimeFrame runtime={active} title={vortex.title} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </GlassCard>

          {/* Previous / Next Controls */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Previous runtime"
              onClick={() => go(index - 1)}
              className="grid size-9 place-items-center rounded-full border border-border/60 bg-card/70 text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-signal/50 hover:text-signal active:scale-95"
            >
              <ChevronLeft className="size-4" />
            </button>

            <div className="flex items-center gap-2">
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
                      ? "w-7 bg-signal"
                      : "w-2 bg-foreground/25 hover:bg-foreground/50",
                  )}
                />
              ))}
            </div>

            <button
              type="button"
              aria-label="Next runtime"
              onClick={() => go(index + 1)}
              className="grid size-9 place-items-center rounded-full border border-border/60 bg-card/70 text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-signal/50 hover:text-signal active:scale-95"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </Container>

      {/* Part 2: Engineering Architecture HUD & Platform Comparison Matrix */}
      <Container className="mt-12 md:mt-16">
        <GlassCard className="p-5 sm:p-8 md:bg-card/70">
          {/* HUD Navigation Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Cpu className="size-4 text-signal" />
                <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
                  Engineering Architecture HUD
                </h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Technical breakdown of 1 shared Kotlin core driving 3 distinct client runtimes
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-neutral-950/70 p-1">
              <button
                type="button"
                onClick={() => setHudTab("matrix")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-medium transition-all",
                  hudTab === "matrix"
                    ? "bg-signal/20 text-signal border border-signal/40 shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Table className="size-3.5" />
                <span>Runtime Matrix</span>
              </button>

              <button
                type="button"
                onClick={() => setHudTab("diagram")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-medium transition-all",
                  hudTab === "diagram"
                    ? "bg-signal/20 text-signal border border-signal/40 shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Workflow className="size-3.5" />
                <span>Architecture</span>
              </button>

              <button
                type="button"
                onClick={() => setHudTab("features")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-medium transition-all",
                  hudTab === "features"
                    ? "bg-signal/20 text-signal border border-signal/40 shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Sparkles className="size-3.5" />
                <span>Core Capabilities</span>
              </button>
            </div>
          </div>

          {/* TAB 1: Platform Comparison Matrix */}
          {hudTab === "matrix" && (
            <div className="mt-6 animate-in fade-in duration-200">
              {/* Desktop / Tablet Matrix Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground">
                      <th className="pb-3 font-semibold uppercase tracking-wider text-saffron w-[22%]">
                        Dimension
                      </th>
                      <th className="pb-3 font-semibold uppercase tracking-wider text-foreground w-[26%]">
                        📱 Android Handset
                      </th>
                      <th className="pb-3 font-semibold uppercase tracking-wider text-signal w-[26%]">
                        📺 Android TV
                      </th>
                      <th className="pb-3 font-semibold uppercase tracking-wider text-purple-400 w-[26%]">
                        🖥️ PC Desktop
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {PLATFORM_MATRIX.map((row) => (
                      <tr key={row.dimension} className="group hover:bg-neutral-900/40 transition-colors">
                        <td className="py-3.5 font-semibold text-foreground/90">
                          {row.dimension}
                        </td>
                        <td className="py-3.5 text-muted-foreground group-hover:text-foreground/90">
                          {row.android}
                        </td>
                        <td className="py-3.5 text-signal/90 font-medium">
                          {row.tv}
                        </td>
                        <td className="py-3.5 text-muted-foreground group-hover:text-foreground/90">
                          {row.pc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Matrix Cards (100% responsive, no horizontal scroll needed) */}
              <div className="md:hidden space-y-4">
                {PLATFORM_MATRIX.map((row) => (
                  <div
                    key={row.dimension}
                    className="rounded-xl border border-border/60 bg-neutral-950/60 p-3.5 space-y-2.5 font-mono text-[11px]"
                  >
                    <div className="font-semibold text-saffron uppercase tracking-wider text-[10px] pb-1 border-b border-white/5">
                      {row.dimension}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-muted-foreground shrink-0">📱 Android:</span>
                        <span className="text-foreground text-right">{row.android}</span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-signal shrink-0">📺 TV:</span>
                        <span className="text-signal font-medium text-right">{row.tv}</span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-purple-400 shrink-0">🖥️ PC:</span>
                        <span className="text-foreground text-right">{row.pc}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Layered Architecture Diagram */}
          {hudTab === "diagram" && (
            <div className="mt-6 space-y-4 animate-in fade-in duration-200">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {ARCH_LAYERS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.layer}
                      className="relative flex flex-col justify-between rounded-xl border border-border/60 bg-neutral-950/70 p-4"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <span className="font-mono text-[10px] font-semibold text-saffron uppercase">
                            {item.layer}
                          </span>
                          <Icon className="size-3.5 text-signal" />
                        </div>
                        <p className="mt-2.5 font-mono text-[11px] font-semibold text-foreground">
                          {item.tech}
                        </p>
                        <p className="mt-2 text-xs font-extralight leading-relaxed text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-1.5 font-mono text-[9px] text-emerald-400">
                        <Check className="size-3" />
                        <span>Verified in source</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Architecture Prose */}
              <div className="rounded-xl border border-border/50 bg-neutral-950/50 p-4 font-mono text-[11px] text-muted-foreground">
                <span className="text-foreground font-semibold uppercase tracking-wider block mb-1">
                  // Zero-Backend Streaming Pipeline
                </span>
                <p className="leading-relaxed text-xs">
                  {vortex.architecture}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Core Capabilities & Implemented Features */}
          {hudTab === "features" && (
            <div className="mt-6 animate-in fade-in duration-200">
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {vortex.features?.map((feat) => (
                  <div
                    key={feat}
                    className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-neutral-950/60 p-3"
                  >
                    <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-signal/15 text-signal">
                      <Check className="size-2.5" />
                    </div>
                    <span className="text-xs text-foreground/90 leading-snug">
                      {feat}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </Container>
    </section>
  );
}
