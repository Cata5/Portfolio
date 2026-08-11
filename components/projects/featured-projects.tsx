"use client";

import { useRef, useState } from "react";

import Image from "next/image";

import { Container } from "@/components/container";
import { gsap } from "@/components/motion/gsap";
import { Parallax } from "@/components/motion/parallax";
import { ProjectLink } from "@/components/motion/project-link";
import { Reveal } from "@/components/motion/reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { SectionHeader } from "@/components/section";
import { featuredProjects } from "@/data/projects";
import type { Project } from "@/data/projects";
import { cn } from "@/lib/utils";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";
import { GlassCard } from "@/components/glass-card";

function cardImageSrc(project: Project) {
  // The card frame is a wide rectangle, so the project's `image` (chosen to
  // fit that crop — e.g. Vortex's TV shot) wins; projects without one fall
  // back to their first screenshot.
  return project.image ?? project.screenshots?.[0] ?? null;
}

function PlaceholderBox({ project }: { project: Project }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center border border-dashed border-border/70 bg-muted/20"
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, transparent 0 16px, color-mix(in srgb, var(--border) 30%, transparent) 16px 17px)",
      }}
    >
      <p className="max-w-[14rem] px-6 text-center font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-muted-foreground">
        {project.placeholder
          ? "placeholder — add to data/projects.ts"
          : "screenshot pending"}
      </p>
    </div>
  );
}

/**
 * One project as an interactive case-study teaser. The whole card is a link
 * that plays the shared expand transition into the detail page; the
 * screenshot sits in a parallax frame that drifts while scrolling and nudges
 * on hover.
 *
 * `stage` cards live in the pinned horizontal track (a full-viewport box), so
 * the screenshot takes the leftover height and can never push the footer — the
 * technologies — off-screen. `stack` cards (mobile / reduced motion) keep the
 * natural 16/10 frame in normal document flow.
 */
function ProjectCard({
  project,
  index,
  variant = "stack",
  className,
}: {
  project: Project;
  index: number;
  variant?: "stage" | "stack";
  className?: string;
}) {
  const src = cardImageSrc(project);

  return (
    <ProjectLink
      href={`/projects/${project.id}`}
      src={src ?? undefined}
      className={cn("group block", className)}
    >
      <GlassCard
        className={cn(
          "flex flex-col overflow-hidden",
          variant === "stage" && "h-[calc(100svh-6rem)]",
        )}
      >
        <div
          data-project-visual
          className={cn(
            "relative shrink-0 overflow-hidden bg-muted/20",
            variant === "stage"
              ? "min-h-[10rem] flex-1"
              : "aspect-[16/10]",
          )}
        >
          {src && !project.placeholder ? (
            <Parallax speed={0.07} className="relative h-full w-full">
              <Image
                src={src}
                alt={`${project.title} — screenshot`}
                fill
                sizes="(min-width: 1024px) 42vw, 92vw"
                className="scale-[1.14] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.18]"
              />
            </Parallax>
          ) : (
            <PlaceholderBox project={project} />
          )}
        </div>

        <div className="flex flex-col gap-4 p-6 md:p-7">
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-mono text-[13px] text-signal">
              0{index + 1}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {project.category}
              {project.year ? ` — ${project.year}` : ""}
            </span>
          </div>

          <h3 className="text-3xl font-normal leading-[1.02] tracking-[-0.03em] transition-colors duration-300 group-hover:text-signal md:text-4xl">
            {project.title}
          </h3>

          <p className="line-clamp-2 max-w-md text-lg font-extralight leading-relaxed text-muted-foreground">
            {project.summary}
          </p>

          {project.technologies.length > 0 && (
            <p className="mt-auto truncate border-t border-border/50 pt-4 font-mono text-[12px] text-muted-foreground">
              {project.technologies.slice(0, 4).join(" · ")}
            </p>
          )}
        </div>
      </GlassCard>
    </ProjectLink>
  );
}

/**
 * The flagship work section: vertical scroll drives a pinned horizontal
 * showcase (progress indicator bottom-right), falling back to a calm stacked
 * list on mobile and for reduced-motion users.
 */
export function FeaturedProjects() {
  const count = featuredProjects.length;

  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const [reducedLayout, setReducedLayout] = useState(false);

  // Desktop + reduced motion: swap to the stacked layout (no pinned stage).
  useIsomorphicLayoutEffect(() => {
    if (!prefersReducedMotion()) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setReducedLayout(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const pin = pinRef.current;
    const track = trackRef.current;
    if (!pin || !track) return;

    const mm = gsap.matchMedia();

    mm.add(
      "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
      () => {
        const getDistance = () =>
          Math.max(0, track.scrollWidth - window.innerWidth);

        const tween = gsap.to(track, {
          x: () => -getDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: pin,
            start: "top top",
            end: () => `+=${getDistance()}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const step = Math.min(
                count - 1,
                Math.max(0, Math.round(self.progress * (count - 1))),
              );
              if (numRef.current) {
                numRef.current.textContent = String(step + 1).padStart(2, "0");
              }
              if (barRef.current) {
                barRef.current.style.transform = `scaleX(${self.progress})`;
              }
            },
          },
        });

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      },
    );

    return () => mm.revert();
  }, [count]);

  if (count === 0) return null;

  return (
    <section id="work" className="relative scroll-mt-16 overflow-hidden">
      <Container className="pt-24 md:pt-36">
        <SectionHeader eyebrow="Work" />
        <TextReveal
          as="h2"
          className="max-w-2xl text-3xl font-normal tracking-[-0.02em] md:text-4xl"
        >
          Selected projects
        </TextReveal>
        <Reveal delay={0.1}>
          <p className="mt-5 max-w-md text-lg font-extralight text-muted-foreground">
            The work I&apos;m most invested in right now — a larger
            presentation of each lives on its own page.
          </p>
        </Reveal>
      </Container>

      {/* Desktop: pinned horizontal stage — overflow-hidden keeps the
          overshooting track from ever bleeding into a page-level scrollbar. */}
      <div
        ref={pinRef}
        className={cn(
          "relative mt-16 overflow-hidden md:mt-24",
          reducedLayout ? "hidden" : "hidden lg:block",
        )}
      >
        <div
          ref={trackRef}
          className="flex h-screen items-center gap-[7vw] pl-[6vw]"
        >
          {featuredProjects.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={i}
              variant="stage"
              className="w-[78vw] shrink-0 sm:w-[58vw] xl:w-[42vw]"
            />
          ))}
          <span className="shrink-0 pr-[6vw] font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground/50">
            {String(count).padStart(2, "0")} projects
          </span>
        </div>

        <div className="pointer-events-none absolute bottom-10 right-[6vw] z-10 flex items-center gap-3">
          <span ref={numRef} className="font-mono text-[13px] text-foreground">
            01
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            / {String(count).padStart(2, "0")}
          </span>
          <span className="h-px w-24 overflow-hidden bg-border/60">
            <span
              ref={barRef}
              className="block h-full w-full origin-left scale-x-0 bg-signal"
            />
          </span>
        </div>
      </div>

      {/* Mobile / reduced motion: stacked list */}
      <div className={cn(reducedLayout ? "block" : "lg:hidden")}>
        <Container className="py-20 md:py-28">
          <div className="space-y-24">
            {featuredProjects.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
        </Container>
      </div>
    </section>
  );
}
