"use client";

import { useCallback, useState } from "react";
import Image from "next/image";

import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollScale } from "@/components/motion/scroll-scale";
import { ScreenshotLightbox } from "@/components/projects/screenshot-lightbox";
import type { Project } from "@/data/projects";

/**
 * Screenshot grid with a keyboard-accessible lightbox (detail pages).
 *
 * - Click a thumbnail to open the full image in a dialog.
 * - Arrow keys navigate, Escape closes, focus is trapped and restored by the
 *   dialog primitive.
 */
export function ScreenshotGallery({ project }: { project: Project }) {
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
      <ScrollScale from={0.95}>
        <div className="grid gap-4 sm:grid-cols-2">
        {shots.map((src, i) => (
          <DialogTrigger
            key={src}
            render={
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Open screenshot ${i + 1} of ${count}`}
                className="group relative aspect-[4/3] touch-manipulation cursor-zoom-in overflow-hidden bg-muted/15 text-left outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
              />
            }
          >
            <Image
              src={src}
              alt={`${project.title} - screenshot ${i + 1}`}
              fill
              sizes="(min-width: 640px) 40vw, 100vw"
              // The whole image fits inside the frame (no cropping) — tall
              // phone shots letterbox on the muted backdrop instead of
              // having their edges sliced off.
              className="object-contain transition-[filter] duration-500 ease-out group-hover:brightness-110"
            />
            <span
              className="absolute bottom-2 right-2 bg-background/85 px-1.5 py-0.5 font-mono text-[10px] text-foreground/80 backdrop-blur-sm"
              aria-hidden="true"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
          </DialogTrigger>
        ))}
        </div>
      </ScrollScale>

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
