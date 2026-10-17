"use client";

import type { ReactNode } from "react";

import { GlassCard } from "@/components/glass-card";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for the admin console. One place for the surface, control and
 * label recipes so every panel reads as the same instrument.
 *
 * Surfaces reuse the site's frosted glass (GlassCard) — the same
 * border-border/40 + bg-card + backdrop-blur material as the hero, the section
 * cards and the RAG views — so the console belongs to the same family as the
 * public site. Mono for anything that is data, Inter for anything that is prose.
 */

/**
 * Frosted fill for compact controls (chips, pills, small buttons) that must
 * stay a <button>/<span> rather than become a GlassCard.
 */
export const frostControl =
  "border border-border/40 bg-card/40 backdrop-blur-md";

export const controlClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-signal/70 focus:outline-none focus:ring-1 focus:ring-signal/30";

export const labelClass =
  "font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground";

export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-signal px-3 py-1.5 font-mono text-[11px] font-semibold text-signal-ink shadow-sm shadow-signal/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

export const btnGhost = cn(
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-signal/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
  frostControl,
);

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const hasHeader = Boolean(title || description || actions);
  return (
    <GlassCard className={cn("overflow-hidden rounded-2xl", className)}>
      {hasHeader && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/40 px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </GlassCard>
  );
}

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="flex items-baseline justify-between gap-2">
        <span className={labelClass}>{label}</span>
        {hint && (
          <span className="font-mono text-[10px] text-muted-foreground/60">
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

export function StatusDot({
  tone = "neutral",
  className,
}: {
  tone?: "positive" | "negative" | "signal" | "neutral";
  className?: string;
}) {
  const toneClass =
    tone === "positive"
      ? "bg-emerald-400"
      : tone === "negative"
        ? "bg-destructive"
        : tone === "signal"
          ? "bg-signal"
          : "bg-muted-foreground";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-1.5 shrink-0 rounded-full",
        toneClass,
        className,
      )}
    />
  );
}

export function StatTile({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "signal" | "saffron" | "muted";
}) {
  const valueTone =
    tone === "signal"
      ? "text-signal"
      : tone === "saffron"
        ? "text-saffron"
        : tone === "muted"
          ? "text-muted-foreground"
          : "text-foreground";
  return (
    <GlassCard className="rounded-xl p-4">
      <span className={labelClass}>{label}</span>
      <p
        className={cn(
          "mt-2 font-mono text-2xl font-semibold tabular-nums leading-none",
          valueTone,
        )}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-1.5 font-mono text-[10.5px] text-muted-foreground">
          {sub}
        </p>
      )}
    </GlassCard>
  );
}

/** A labelled key/value line used inside the machine rail and readouts. */
export function ReadoutRow({
  label,
  value,
  tone = "default",
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: "default" | "signal" | "positive" | "muted";
}) {
  const valueTone =
    tone === "signal"
      ? "text-signal"
      : tone === "positive"
        ? "text-emerald-400"
        : tone === "muted"
          ? "text-muted-foreground"
          : "text-foreground";
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "truncate font-mono text-[11px] font-medium tabular-nums",
          valueTone,
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Renders a dash instead of fabricating a value when data is missing. */
export function fmt(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}
