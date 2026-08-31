"use client";

import Image from "next/image";
import type { Project } from "@/data/projects";
import { cn } from "@/lib/utils";

export type Runtime = NonNullable<Project["runtimes"]>[number];

/** Screenshot inside a device frame, with an honest placeholder fallback. */
export function FrameScreen({
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
export function PhoneFrame({
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
export function TVFrame({
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
export function DesktopFrame({
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

export function RuntimeFrame({
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
