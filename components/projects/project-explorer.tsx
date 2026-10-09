"use client";

import { useMemo, useRef, useState } from "react";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Editable } from "@/components/editor/editable";
import { useEditor } from "@/components/editor/editor-context";
import { GlassCard } from "@/components/glass-card";
import { Counter } from "@/components/motion/counter";
import { gsap } from "@/components/motion/gsap";
import { Section } from "@/components/section";
import type { Project, ProjectCategory } from "@/data/projects";
import { cn } from "@/lib/utils";
import { EASE, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

type Filter = "All" | ProjectCategory;

export function ProjectExplorer() {
  const { content, isEditing } = useEditor();
  const projects = content.projects;

  const projectCategories = useMemo(
    () => Array.from(new Set(projects.map((p) => p.category))),
    [projects],
  );

  const filters: Filter[] = useMemo(() => ["All", ...projectCategories], [projectCategories]);

  const [filter, setFilter] = useState<Filter>("All");
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(
    () =>
      filter === "All"
        ? projects
        : projects.filter((p) => p.category === filter),
    [filter, projects],
  );

  const changeFilter = (f: Filter) => {
    if (f === filter) return;
    const ul = listRef.current;
    if (ul && !prefersReducedMotion()) {
      gsap.to(ul, {
        opacity: 0,
        y: -6,
        duration: 0.14,
        ease: "power2.in",
        overwrite: "auto",
        onComplete: () => setFilter(f),
      });
    } else {
      setFilter(f);
    }
  };

  // Rows cascade in whenever the filtered list changes (and on mount).
  useIsomorphicLayoutEffect(() => {
    const ul = listRef.current;
    if (!ul || prefersReducedMotion()) return;
    gsap.set(ul, { opacity: 1 });
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ul.children,
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.45,
          ease: EASE.out,
          stagger: 0.04,
          delay: 0.05,
          clearProps: "transform",
        },
      );
    }, ul);
    return () => ctx.revert();
  }, [filter]);

  return (
    <Section id="projects" eyebrow="All Projects">
      <h2 className="sr-only">All Projects</h2>
      <GlassCard className="p-6 sm:p-10 lg:p-12">
        <div className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-2">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => changeFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                "relative px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.04em] transition-colors",
                "after:absolute after:-bottom-0.5 after:left-2 after:right-2 after:h-px after:origin-left after:bg-signal after:transition-transform after:duration-300",
                filter === f
                  ? "text-signal after:scale-x-100"
                  : "text-muted-foreground after:scale-x-0 hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <p className="mb-6 font-mono text-[11px] text-muted-foreground">
          showing <Counter value={filtered.length} /> of {projects.length}{" "}
          projects
        </p>

        <ul ref={listRef} className="border-t border-border/40">
          {filtered.map((project, i) => {
            const originalIndex = projects.findIndex((p) => p.id === project.id);
            return (
              <ExplorerRow
                key={project.id}
                project={project}
                index={i}
                originalIndex={originalIndex}
                isEditing={isEditing}
              />
            );
          })}
          {filtered.length === 0 && (
            <li className="border-b border-border/40 py-12 text-center font-mono text-[12px] text-muted-foreground">
              No projects in this category yet - real work lands here.
            </li>
          )}
        </ul>
      </GlassCard>
    </Section>
  );
}

function ExplorerRow({
  project,
  index,
  originalIndex,
  isEditing,
}: {
  project: Project;
  index: number;
  originalIndex: number;
  isEditing: boolean;
}) {
  const row = (
    <div className="group grid items-center gap-x-6 gap-y-1 border-b border-border/40 px-1 py-5 transition-colors hover:bg-muted/30 sm:grid-cols-[3rem_minmax(0,1fr)_auto] md:grid-cols-[3rem_minmax(0,1fr)_minmax(0,16rem)_auto]">
      <span className="font-mono text-[12px] text-muted-foreground transition-colors group-hover:text-signal">
        {(index + 1).toString().padStart(2, "0")}
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-[16px] font-medium transition-[color,transform] duration-200 group-hover:translate-x-1 group-hover:text-signal">
          {project.title}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {project.category}
          {project.year ? ` - ${project.year}` : ""}
          {project.placeholder ? " - placeholder" : ""}
          {project.featured ? " · featured" : ""}
        </span>
      </span>
      <span className="hidden truncate font-mono text-[12px] text-muted-foreground md:block">
        {project.technologies.join(" · ") || "-"}
      </span>
      <span className="justify-self-end text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-signal">
        <ArrowUpRight className="size-4" aria-hidden="true" />
      </span>
    </div>
  );

  if (isEditing) {
    return (
      <li>
        <Editable
          path={`projects.${originalIndex}`}
          label={`Project: ${project.title}`}
          type="project"
          value={project}
        >
          {row}
        </Editable>
      </li>
    );
  }

  if (project.placeholder) {
    return <li>{row}</li>;
  }

  return (
    <li>
      <Link href={`/projects/${project.id}`} className="block">
        {row}
      </Link>
    </li>
  );
}

