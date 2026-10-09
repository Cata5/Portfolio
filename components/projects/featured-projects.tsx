"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  Monitor,
  Smartphone,
  Tv,
} from "lucide-react";

import { Container } from "@/components/container";
import { GlassCard } from "@/components/glass-card";
import { ProjectLink } from "@/components/motion/project-link";
import { Reveal } from "@/components/motion/reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { SectionHeader } from "@/components/section";
import { useEditor } from "@/components/editor/editor-context";
import { scrollToId } from "@/components/motion/lenis";
import { projects } from "@/data/projects";
import { cn } from "@/lib/utils";
import { RuntimeFrame } from "./device-frames";

const vortex = projects.find((p) => p.id === "vortex") ?? null;

/**
 * Flagship Work Section:
 * Single-device focus stage + Engineering Architecture Spec & Platform Comparison Matrix.
 */
export function FeaturedProjects() {
  const { isEditing, selectedField, setSelectedField } = useEditor();
  const [index, setIndex] = useState(1); // Default to TV (index 1)

  const isSectionSelected =
    isEditing &&
    selectedField?.type === "section" &&
    (selectedField?.meta as { sectionId?: string })?.sectionId === "work";

  const handleSectionClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!isEditing) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, [data-editable-field='true']")) {
      return;
    }
    setSelectedField({
      path: "section.work",
      label: "Section: Featured Work (Vortex)",
      type: "section",
      meta: { sectionId: "work" },
    });
    scrollToId("work");
  };

  const runtimes = vortex?.runtimes ?? [];

  const go = useCallback(
    (next: number) => {
      const count = runtimes.length;
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [runtimes.length],
  );

  // No auto-advance: motion that swaps content while the visitor is reading
  // it fights comprehension. The runtime stage changes only on user intent.

  if (!vortex || runtimes.length === 0) return null;
  const active = runtimes[index];

  // Manual stage: a quiet crossfade is all the motion the swap needs.
  const slideVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <section
      id="work"
      onClick={handleSectionClick}
      className={cn(
        "relative scroll-mt-16 transition-all duration-200",
        isEditing && "cursor-pointer group/section",
        isEditing && !isSectionSelected && "hover:ring-1 hover:ring-signal/40 hover:ring-offset-4 hover:ring-offset-background rounded-3xl",
        isSectionSelected && "ring-2 ring-signal ring-offset-6 ring-offset-background rounded-3xl bg-signal/[0.015]",
      )}
    >
      {/* Floating Section Status Badge when Selected in Edit Mode */}
      {isEditing && isSectionSelected && (
        <div className="pointer-events-none absolute right-6 top-6 z-40 inline-flex items-center gap-1.5 rounded-full bg-signal px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-signal-ink shadow-xl shadow-signal/30 animate-in fade-in zoom-in-95 duration-150">
          <Layers className="size-3" />
          <span>Section: Featured System (Editing All Text)</span>
        </div>
      )}

      <Container className="pt-24 md:pt-36">
        <SectionHeader eyebrow="Featured System" />

        <GlassCard className="mt-4 w-fit max-w-lg p-5 sm:p-6 md:bg-card/70">
          <TextReveal
            as="h2"
            className="text-2xl font-normal tracking-[-0.02em] md:text-3xl"
          >
            {vortex.title}
          </TextReveal>
          <Reveal delay={0.1}>
            <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground sm:text-base">
              One Kotlin UI framework across two apps: Android phones and tablets, Android TV, plus a Compose Multiplatform desktop client on a shared module.
              Self-hosted direct media streaming from five storage protocols: Google Drive, SMB, SFTP, FTP/FTPS and WebDAV.
            </p>
          </Reveal>
        </GlassCard>
      </Container>

      {/* Part 1: Clean Device Showcase Stage */}
      <Container className="mt-8 md:mt-12">
        <div>
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
                          "group relative rounded-xl border p-3.5 text-left transition-all duration-300",                            selected
                              ? "border-signal/70 bg-signal/15"
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
                                  : "border-border/60 bg-muted/60 dark:bg-neutral-900/60 text-muted-foreground group-hover:text-foreground",
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
                              {r.label}
                            </span>
                          </div>

                          {selected && (
                            <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-signal font-semibold">
                              <span className="size-1.5 rounded-full bg-signal" />
                              active
                            </span>
                          )}
                        </div>

                        {selected && r.description && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.2 }}
                            className="mt-2.5 text-[13px] font-light leading-relaxed text-muted-foreground border-t border-signal/20 pt-2"
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

              {/* Right column — Single Focused Device Frame Stage */}
              <div className="relative flex min-h-[22rem] sm:min-h-[28rem] lg:min-h-[32rem] lg:col-span-8 items-center justify-center overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={active.id}
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{
                      duration: 0.3,
                      ease: "easeOut",
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
              className="grid size-9 place-items-center rounded-full border border-border/60 bg-card/70 text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-signal/50 hover:text-signal active:scale-95 cursor-pointer"
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
                    "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
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
              className="grid size-9 place-items-center rounded-full border border-border/60 bg-card/70 text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-signal/50 hover:text-signal active:scale-95 cursor-pointer"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </Container>

      {/* The full engineering breakdown (platform matrix, architecture layers,
          module map, capabilities) lives on the project page - the homepage
          keeps the flagship story short and routes readers there. */}
      <Container className="mt-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Platform matrix · architecture · module map · capabilities - all on{" "}
          <ProjectLink
            href={`/projects/${vortex.id}`}
            className="text-signal transition-colors hover:text-foreground"
          >
            the Vortex page →
          </ProjectLink>
        </p>
      </Container>
    </section>
  );
}
