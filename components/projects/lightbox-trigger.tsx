"use client";

import { useCallback, useState } from "react";
import Image from "next/image";

import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ScreenshotLightbox } from "@/components/projects/screenshot-lightbox";
import type { Project } from "@/data/projects";

/**
 * Home-page featured visual: the first screenshot opens the same lightbox as
 * the detail page. Static (no dialog) when the project has no screenshots —
 * the caller renders <ProjectVisual> in that case.
 */
export function LightboxTrigger({ project }: { project: Project }) {
  const shots = project.screenshots ?? [];
  const [index, setIndex] = useState<number | null>(null);

  const open = index !== null;
  const count = shots.length;
  const current = index ?? 0;

  const step = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => (i === null ? i : (i + dir + count) % count));
    },
    [count],
  );

  if (count === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && setIndex(null)}>
      <DialogTrigger
        render={
          <button
            type="button"
            onClick={() => setIndex(0)}
            aria-label={`Open screenshot 1 of ${count}`}
            className="group relative block aspect-[16/10] w-full cursor-zoom-in overflow-hidden bg-muted/20 text-left outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          />
        }
      >
        <Image
          src={shots[0]}
          alt={`${project.title} - screenshot`}
          fill
          sizes="(min-width: 1024px) 56vw, 100vw"
          className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.015]"
        />
        <span
          className="absolute bottom-2 right-2 bg-background/85 px-1.5 py-0.5 font-mono text-[10px] text-foreground/80 backdrop-blur-sm"
          aria-hidden="true"
        >
          {count > 1 ? `${count} shots` : "zoom"}
        </span>
      </DialogTrigger>

      <ScreenshotLightbox
        project={project}
        current={current}
        count={count}
        step={step}
        onClose={() => setIndex(null)}
      />
    </Dialog>
  );
}
