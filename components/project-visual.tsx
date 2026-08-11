import Image from "next/image";

import type { Project } from "@/data/projects";
import { cn } from "@/lib/utils";

/**
 * Renders a project's screenshot when one exists; otherwise an honest,
 * clearly-temporary placeholder. Drop a real file in /public/projects and
 * point `project.image` at it to replace the placeholder.
 */
export function ProjectVisual({
  project,
  src,
  className,
}: {
  project: Project;
  /** Override the source — used by the detail page's screenshots gallery. */
  src?: string;
  className?: string;
}) {
  // Fall back to the first screenshot when `image` isn't set yet — several
  // featured projects only have screenshots, and they should show the real
  // shot rather than the temporary placeholder.
  const imageSrc = src ?? project.image ?? project.screenshots?.[1];
  if (!project.placeholder && imageSrc) {
    return (
      <div
        className={cn(
          "group relative aspect-[16/10] overflow-hidden",
          className,
        )}
      >
        <Image
          src={imageSrc}
          alt={`${project.title} — screenshot`}
          fill
          sizes="(min-width: 1024px) 56vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015]"
        />
      </div>
    );
  }

  const label = project.placeholder
    ? "placeholder — add to data/projects.ts"
    : "screenshot pending";

  return (
    <div
      className={cn(
        "relative flex aspect-[16/10] items-center justify-center overflow-hidden border border-dashed border-border/70 bg-muted/20",
        className,
      )}
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, transparent 0 16px, color-mix(in srgb, var(--border) 30%, transparent) 16px 17px)",
      }}
    >
      <span
        className="absolute left-3 top-3 size-2 bg-signal"
        aria-hidden="true"
      />
      <span
        className="absolute bottom-3 right-3 font-mono text-[10px] text-muted-foreground"
        aria-hidden="true"
      >
        public/projects/{project.id}.webp
      </span>
      <p className="max-w-[16rem] px-6 text-center font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
