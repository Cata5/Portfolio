"use client";

import Image from "next/image";

import { ChevronLeft, ChevronRight, X } from "lucide-react";

import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Project } from "@/data/projects";

/**
 * The lightbox popup, shared by the detail-page screenshot gallery and the
 * home-page featured visual. Rendered inside an open <Dialog> — the caller
 * owns the trigger and the index state.
 */
export function ScreenshotLightbox({
  project,
  current,
  count,
  step,
  onClose,
}: {
  project: Project;
  current: number;
  count: number;
  step: (dir: 1 | -1) => void;
  onClose: () => void;
}) {
  const shots = project.screenshots ?? [];
  const src = shots[current];
  if (!src) return null;

  return (
    <DialogContent
      showCloseButton={false}
      className="max-w-5xl gap-3 border-border/40 bg-background p-4 sm:p-6"
      onKeyDown={(e) => {
        if (count < 2) return;
        if (e.key === "ArrowLeft") step(-1);
        if (e.key === "ArrowRight") step(1);
      }}
    >
      <DialogTitle className="sr-only">
        {project.title} — screenshot {current + 1} of {count}
      </DialogTitle>
      <DialogDescription className="sr-only">
        Full-size screenshot of {project.title}
      </DialogDescription>

      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {project.title}
        </p>
        <p className="font-mono text-[11px] text-muted-foreground">
          {current + 1} / {count}
        </p>
      </div>
      <div className="relative h-[62vh] w-full overflow-hidden bg-black/40">
        <Image
          key={src}
          src={src}
          alt={`${project.title} — screenshot ${current + 1}`}
          fill
          sizes="90vw"
          className="object-contain"
          priority
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={count < 2}
          aria-label="Previous screenshot"
          className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
          prev
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close lightbox"
          className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
          close
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={count < 2}
          aria-label="Next screenshot"
          className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          next
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <p
        className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60"
        aria-hidden="true"
      >
        {count > 1 ? "← → navigate · " : ""}esc close
      </p>
    </DialogContent>
  );
}
