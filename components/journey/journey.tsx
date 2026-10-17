"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Editable } from "@/components/editor/editable";
import { useEditor } from "@/components/editor/editor-context";
import { GlassCard } from "@/components/glass-card";
import { gsap } from "@/components/motion/gsap";
import { Section } from "@/components/section";
import { TextReveal } from "@/components/motion/text-reveal";
import type { JourneyCategory } from "@/data/journey";
import { cn } from "@/lib/utils";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

interface CategoryMeta {
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
  dotClass: string;
  glowClass: string;
  borderHoverClass: string;
  bgGlowClass: string;
  accentHex: string;
}

const CATEGORY_META: Record<JourneyCategory, CategoryMeta> = {
  main: {
    label: "Core & AI Systems",
    shortLabel: "Projects",
    description: "Autonomous agents, neural pipelines & platform architecture",
    badgeClass: "text-signal bg-signal/10 border-signal/30",
    dotClass: "bg-signal",
    glowClass: "shadow-[0_0_16px_var(--color-signal)]",
    borderHoverClass: "group-hover:border-signal/60 group-hover:shadow-[0_0_25px_rgba(128,82,255,0.2)]",
    bgGlowClass: "group-hover:bg-signal/[0.04]",
    accentHex: "var(--color-signal)",
  },
  competitions: {
    label: "Hackathons & Competitions",
    shortLabel: "Hackathons & Contests",
    description: "UniHack 1st place, InfoEducație silver medals & FIRST Tech Challenge",
    badgeClass: "text-saffron bg-saffron/10 border-saffron/30",
    dotClass: "bg-saffron",
    glowClass: "shadow-[0_0_16px_var(--color-saffron)]",
    borderHoverClass: "group-hover:border-saffron/60 group-hover:shadow-[0_0_25px_rgba(255,184,41,0.2)]",
    bgGlowClass: "group-hover:bg-saffron/[0.04]",
    accentHex: "var(--color-saffron)",
  },
  community: {
    label: "Community & Mentorship",
    shortLabel: "Community",
    description: "FTC robotics team mentoring & open-source knowledge sharing",
    badgeClass: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    dotClass: "bg-rose-400",
    glowClass: "shadow-[0_0_16px_rgba(251,113,133,0.7)]",
    borderHoverClass: "group-hover:border-rose-500/60 group-hover:shadow-[0_0_25px_rgba(251,113,133,0.2)]",
    bgGlowClass: "group-hover:bg-rose-500/[0.04]",
    accentHex: "#fb7185",
  },
  side: {
    label: "Developer Tools & GitHub",
    shortLabel: "Developer Tools",
    description: "Desktop utilities, developer tools & ecosystem contributions",
    badgeClass: "text-signal bg-signal/10 border-signal/30",
    dotClass: "bg-signal",
    glowClass: "shadow-[0_0_16px_var(--color-signal)]",
    borderHoverClass: "group-hover:border-signal/60 group-hover:shadow-[0_0_25px_rgba(128,82,255,0.2)]",
    bgGlowClass: "group-hover:bg-signal/[0.04]",
    accentHex: "#38bdf8",
  },
};

const YEAR_INFO: Record<string, { title: string; subtitle: string }> = {
  "2026": {
    title: "Autonomous AI & Flagships",
    subtitle: "Local LLM Tooling, Cloud Streaming & Cyberdeck Systems",
  },
  "2025": {
    title: "Mentorship & Web Architecture",
    subtitle: "FTC Robotics Mentorship & Full-Stack Contest Platforms",
  },
  "2024": {
    title: "Hackathon Victory & Robotics Nationals",
    subtitle: "UniHack 1st Place Win, FIRST Tech Challenge & Neural Spree",
  },
  "2023": {
    title: "Genesis & First Projects",
    subtitle: "Hackathon Debut, InfoEducație & Desktop Utility Ecosystem",
  },
};

export function Journey() {
  const [activeCategory, setActiveCategory] = useState<"all" | JourneyCategory>("all");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const { content } = useEditor();
  const rawJourney = content.journey || [];
  const journeyCopy = content.copy?.journey as Record<string, string> | undefined;

  const eyebrow = journeyCopy?.eyebrow || "Engineering Trajectory";
  const title = journeyCopy?.title || "Circuit Timeline & Milestones";
  const description =
    journeyCopy?.description ||
    "A dual-sided neural circuit charting core software platforms, hackathon victories, FIRST Tech Challenge robotics, and open-source infrastructure from 2023 to 2026.";
  const statusText = journeyCopy?.status || "Active Branch Trajectory";
  const streamLabel = journeyCopy?.streamLabel || "Stream:";
  const allBranchesLabel = journeyCopy?.allBranchesLabel || "All Branches";

  const statSpanLabel = journeyCopy?.statSpanLabel || "Span";
  const statSpanValue = journeyCopy?.statSpanValue || "2023 – 2026";
  const statSpanSub = journeyCopy?.statSpanSub || "4 Years";

  const statMilestonesLabel = journeyCopy?.statMilestonesLabel || "Milestones";
  const statMilestonesSub = journeyCopy?.statMilestonesSub || "Records";

  const statHackathonsLabel = journeyCopy?.statHackathonsLabel || "Hackathons";
  const statHackathonsValue = journeyCopy?.statHackathonsValue || "1st Place";
  const statHackathonsSub = journeyCopy?.statHackathonsSub || "UniHack Winner";

  const statRoboticsLabel = journeyCopy?.statRoboticsLabel || "Robotics";
  const statRoboticsValue = journeyCopy?.statRoboticsValue || "FTC";
  const statRoboticsSub = journeyCopy?.statRoboticsSub || "Nationals & Mentor";

  const statOpenSourceLabel = journeyCopy?.statOpenSourceLabel || "Open Source";
  const statOpenSourceValue = journeyCopy?.statOpenSourceValue || "6";
  const statOpenSourceSub = journeyCopy?.statOpenSourceSub || "Repositories";

  // Retain original index bindings for CMS Visual Editor
  const indexedJourney = useMemo(() => {
    return rawJourney.map((entry, originalIndex) => ({
      entry,
      originalIndex,
    }));
  }, [rawJourney]);

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return indexedJourney;
    return indexedJourney.filter((item) => item.entry.category === activeCategory);
  }, [indexedJourney, activeCategory]);

  // Group Chronological Stream by Year
  const yearGroups = useMemo(() => {
    const groups: {
      year: string;
      title: string;
      subtitle: string;
      items: typeof indexedJourney;
    }[] = [];
    const yearMap = new Map<string, typeof indexedJourney>();

    filteredItems.forEach((item) => {
      const match = item.entry.date.match(/\b(20\d{2})\b/);
      const year = match ? match[1] : "Earlier";
      if (!yearMap.has(year)) {
        yearMap.set(year, []);
      }
      yearMap.get(year)!.push(item);
    });

    const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b.localeCompare(a));

    sortedYears.forEach((year) => {
      groups.push({
        year,
        title: YEAR_INFO[year]?.title || `Year ${year}`,
        subtitle: YEAR_INFO[year]?.subtitle || "Milestones & Projects",
        items: yearMap.get(year)!,
      });
    });

    return groups;
  }, [filteredItems]);

  // GSAP scroll trigger for the continuous solid purple timeline line
  useIsomorphicLayoutEffect(() => {
    const line = lineRef.current;
    const wrap = wrapRef.current;
    if (!line || !wrap || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        line,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: wrap,
            start: "top 80%",
            end: "bottom 60%",
            scrub: true,
          },
        },
      );
    }, wrap);

    return () => ctx.revert();
  }, [activeCategory]);

  return (
    <Section id="journey" eyebrow={eyebrow}>
      <div className="space-y-10">
        {/* Section Header Card */}
        <GlassCard className="p-6 sm:p-10 lg:p-12 relative overflow-hidden">
          {/* Ambient Lighting */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-signal/5 blur-[90px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 -bottom-20 size-72 rounded-full bg-saffron/5 blur-[80px]"
          />

          <div className="relative z-10 space-y-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between pb-8 border-b border-border/50">
              <div className="max-w-2xl space-y-3">
                <Editable path="copy.journey.title" label="Timeline Title">
                  <TextReveal
                    as="h2"
                    className="text-3xl font-normal tracking-[-0.02em] md:text-4xl text-foreground"
                  >
                    {title}
                  </TextReveal>
                </Editable>
                <Editable path="copy.journey.description" label="Timeline Description" type="textarea">
                  <p className="text-base font-light text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </Editable>
              </div>

              {/* Status Indicator */}
              <Editable path="copy.journey.status" label="Timeline Status Badge">
                <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-signal/10 border border-signal/30 font-mono text-xs text-signal shrink-0">
                  <span>{statusText}</span>
                </div>
              </Editable>
            </div>

            {/* Quick Career Telemetry Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Editable path="copy.journey.statSpanValue" label="Span Metric">
                <div className="rounded-2xl border border-border/60 bg-accent/20 p-3.5 flex flex-col justify-between h-full">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {statSpanLabel}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="font-mono text-xl font-bold text-foreground">{statSpanValue}</span>
                    <span className="text-xs text-muted-foreground">{statSpanSub}</span>
                  </div>
                </div>
              </Editable>

              <div className="rounded-2xl border border-border/60 bg-accent/20 p-3.5 flex flex-col justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {statMilestonesLabel}
                </span>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="font-mono text-xl font-bold text-signal">
                    {rawJourney.length}
                  </span>
                  <span className="text-xs text-muted-foreground">{statMilestonesSub}</span>
                </div>
              </div>

              <Editable path="copy.journey.statHackathonsValue" label="Hackathons Metric">
                <div className="rounded-2xl border border-border/60 bg-accent/20 p-3.5 flex flex-col justify-between h-full">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {statHackathonsLabel}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="font-mono text-xl font-bold text-saffron">{statHackathonsValue}</span>
                    <span className="text-xs text-muted-foreground">{statHackathonsSub}</span>
                  </div>
                </div>
              </Editable>

              <Editable path="copy.journey.statRoboticsValue" label="Robotics Metric">
                <div className="rounded-2xl border border-border/60 bg-accent/20 p-3.5 flex flex-col justify-between h-full">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {statRoboticsLabel}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="font-mono text-xl font-bold text-foreground">{statRoboticsValue}</span>
                    <span className="text-xs text-muted-foreground">{statRoboticsSub}</span>
                  </div>
                </div>
              </Editable>

              <Editable path="copy.journey.statOpenSourceValue" label="Open Source Metric">
                <div className="col-span-2 sm:col-span-1 rounded-2xl border border-border/60 bg-accent/20 p-3.5 flex flex-col justify-between h-full">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {statOpenSourceLabel}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="font-mono text-xl font-bold text-signal">{statOpenSourceValue}</span>
                    <span className="text-xs text-muted-foreground">{statOpenSourceSub}</span>
                  </div>
                </div>
              </Editable>
            </div>

            {/* Stream Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground mr-1 hidden sm:inline-block">
                {streamLabel}
              </span>
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-mono transition-all duration-200 cursor-pointer border",
                  activeCategory === "all"
                    ? "bg-foreground text-background font-semibold border-foreground shadow-sm"
                    : "bg-accent/40 text-muted-foreground hover:text-foreground hover:bg-accent border-border/60",
                )}
              >
                <span>{allBranchesLabel}</span>
                <span className="text-[11px] opacity-75">({rawJourney.length})</span>
              </button>

              {(Object.keys(CATEGORY_META) as JourneyCategory[]).map((cat) => {
                const meta = CATEGORY_META[cat];
                const count = indexedJourney.filter((i) => i.entry.category === cat).length;
                if (count === 0) return null;
                const isSelected = activeCategory === cat;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(isSelected ? "all" : cat)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-mono transition-all duration-200 cursor-pointer border",
                      isSelected
                        ? cn(meta.badgeClass, "font-semibold ring-1 ring-offset-2 ring-offset-background shadow-sm")
                        : "bg-accent/40 text-muted-foreground hover:text-foreground hover:bg-accent border-border/60",
                    )}
                  >
                    <span>{meta.shortLabel}</span>
                    <span className="text-[11px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </GlassCard>

        {/* =========================================================================
            CYBER CIRCUIT TREE: DUAL-SIDED STAGGERED STEM
           ========================================================================= */}
        <div ref={wrapRef} className="relative py-4">
          {/* Central Stem Line Background (Desktop: center, Mobile: left) */}
          <div
            aria-hidden="true"
            className="absolute left-6 md:left-1/2 top-4 bottom-8 w-[2px] -translate-x-1/2 bg-border/60 pointer-events-none"
          />

          {/* Animated Scrubbed GSAP Solid Line - 100% gap-free */}
          <div
            ref={lineRef}
            aria-hidden="true"
            className="absolute left-6 md:left-1/2 top-4 bottom-8 w-[2.5px] -translate-x-1/2 origin-top scale-y-0 bg-signal shadow-[0_0_14px_var(--color-signal)] pointer-events-none rounded-full"
          />

          <div className="space-y-20">
            {yearGroups.map((group) => (
              <div key={group.year} className="relative">
                {/* Year Relay Hub Marker (Centered on Desktop) */}
                <div className="sticky top-20 z-20 flex items-center justify-start md:justify-center mb-12 pl-1.5 md:pl-0">
                  <div className="flex items-center gap-3 rounded-2xl border border-signal/40 bg-background/95 backdrop-blur-xl px-5 py-2 shadow-[0_0_30px_rgba(128,82,255,0.18)]">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-lg font-bold text-foreground">
                        {group.year}
                      </span>
                      <span className="hidden sm:inline-block font-mono text-xs text-muted-foreground border-l border-border/60 pl-2">
                        {group.title}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-signal bg-signal/15 px-2 py-0.5 rounded-md border border-signal/30">
                      {group.items.length} {group.items.length === 1 ? "Node" : "Nodes"}
                    </span>
                  </div>
                </div>

                {/* Staggered Dual-Sided Cards Container */}
                <div className="space-y-10 md:space-y-12">
                  {group.items.map(({ entry, originalIndex }, idx) => {
                    const meta = CATEGORY_META[entry.category] || CATEGORY_META.main;
                    // Alternates left and right on desktop
                    const isEven = idx % 2 === 0;
                    const isHovered = hoveredIdx === originalIndex;

                    return (
                      <div
                        key={entry.title + originalIndex}
                        onMouseEnter={() => setHoveredIdx(originalIndex)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        className={cn(
                          "relative flex flex-col md:flex-row items-center group",
                          isEven ? "md:flex-row" : "md:flex-row-reverse",
                        )}
                      >
                        {/* ================= CENTRAL POWER RELAY PIN ================= */}
                        <div className="absolute left-6 md:left-1/2 -translate-x-1/2 top-8 z-10 flex items-center justify-center">
                          <span
                            className={cn(
                              "size-4 rounded-full border-2 border-background transition-all duration-300",
                              meta.dotClass,
                              meta.glowClass,
                              isHovered ? "scale-150 ring-4 ring-signal/30" : "scale-100",
                            )}
                            aria-hidden="true"
                          />
                        </div>

                        {/* ================= HORIZONTAL CIRCUIT WIRE (Desktop) ================= */}
                        <div
                          aria-hidden="true"
                          className={cn(
                            "hidden md:block absolute top-[39px] h-px transition-all duration-300 pointer-events-none",
                            isEven
                              ? "left-[calc(50%-10px)] right-1/2 w-[calc(50%-2rem)] -translate-x-full"
                              : "left-1/2 w-[calc(50%-2rem)]",
                            isHovered
                              ? "bg-signal shadow-[0_0_10px_var(--color-signal)] h-[2px]"
                              : "bg-border/70",
                          )}
                        />

                        {/* ================= HORIZONTAL CIRCUIT WIRE (Mobile) ================= */}
                        <div
                          aria-hidden="true"
                          className={cn(
                            "md:hidden absolute left-6 top-[39px] w-6 h-px transition-all duration-300 pointer-events-none",
                            isHovered
                              ? "bg-signal shadow-[0_0_10px_var(--color-signal)] h-[2px]"
                              : "bg-border/70",
                          )}
                        />

                        {/* ================= CARD WRAPPER (Half width on desktop) ================= */}
                        <div
                          className={cn(
                            "w-full pl-12 md:pl-0 md:w-[calc(50%-2.5rem)]",
                            isEven ? "md:mr-auto" : "md:ml-auto",
                          )}
                        >
                          <Editable
                            path={`journey.${originalIndex}`}
                            label={`Milestone: ${entry.title}`}
                            type="journeyItem"
                            value={entry}
                          >
                            <div
                              className={cn(
                                "overflow-hidden rounded-3xl border border-border/50 bg-card/40 backdrop-blur-md transition-all duration-300",
                                "hover:bg-card/80 hover:shadow-2xl hover:-translate-y-1",
                                meta.borderHoverClass,
                                meta.bgGlowClass,
                              )}
                            >
                              {/* Milestone Image Banner (for hackathons/contests/mentor) */}
                              {entry.image && (
                                <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-neutral-950/60">
                                  <Image
                                    src={entry.image}
                                    alt={`${entry.title} - visual`}
                                    fill
                                    sizes="(min-width: 768px) 45vw, 100vw"
                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                                  <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                                    <span
                                      className={cn(
                                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 font-mono text-xs uppercase tracking-wider font-semibold backdrop-blur-md bg-background/85",
                                        meta.badgeClass,
                                      )}
                                    >
                                      {meta.shortLabel}
                                    </span>
                                    {entry.location && (
                                      <span className="inline-flex items-center gap-1 font-mono text-xs text-white/95 bg-black/65 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/15">
                                        {entry.location}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Card Content Body */}
                              <div className="p-6 sm:p-7">
                                {/* Header badge row if no image */}
                                {!entry.image && (
                                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
                                    <div className="flex items-center gap-2.5">
                                      <span
                                        className={cn(
                                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 font-mono text-xs uppercase tracking-wider font-semibold",
                                          meta.badgeClass,
                                        )}
                                      >
                                        {meta.shortLabel}
                                      </span>
                                      <span className="font-mono text-xs font-medium text-muted-foreground">
                                        {entry.date}
                                      </span>
                                    </div>
                                    {entry.location && (
                                      <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                                        {entry.location}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {entry.image && (
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                                      {entry.date}
                                    </span>
                                  </div>
                                )}

                                <div className="flex items-start justify-between gap-3">
                                  <h3 className="text-xl sm:text-2xl font-medium tracking-tight text-foreground group-hover:text-signal transition-colors">
                                    {entry.title}
                                  </h3>

                                  {entry.link && (
                                    entry.link.startsWith("http") ? (
                                      <a
                                        href={entry.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`Link for ${entry.title}`}
                                        className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-signal transition-colors shrink-0 pt-1"
                                      >
                                        <span>Link</span>
                                        <ArrowUpRight className="size-3.5" />
                                      </a>
                                    ) : (
                                      <Link
                                        href={entry.link}
                                        aria-label={`Project link for ${entry.title}`}
                                        className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-signal transition-colors shrink-0 pt-1"
                                      >
                                        <span>Project</span>
                                        <ArrowUpRight className="size-3.5" />
                                      </Link>
                                    )
                                  )}
                                </div>

                                <p className="mt-2.5 text-sm sm:text-base font-light leading-relaxed text-muted-foreground">
                                  {entry.note}
                                </p>

                                {entry.tags && entry.tags.length > 0 && (
                                  <ul className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-border/30">
                                    {entry.tags.map((tag) => (
                                      <li
                                        key={tag}
                                        className="rounded-lg border border-border/50 bg-background/50 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground/90"
                                      >
                                        {tag}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </Editable>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
