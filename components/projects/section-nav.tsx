"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type SectionAnchor = { id: string; label: string };

/**
 * Sticky mono section rail for case-study pages. Highlights the section
 * currently in view via IntersectionObserver; clicking scrolls smoothly
 * (honors reduced motion). Sits under the site header on desktop, and
 * becomes a horizontally scrollable strip on small screens.
 */
export function SectionNav({ sections }: { sections: SectionAnchor[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (sections.length === 0) return;
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const ratios = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.intersectionRatio);
        }
        let bestId: string | null = null;
        let best = 0;
        for (const [id, r] of ratios) {
          if (r > best) {
            best = r;
            bestId = id;
          }
        }
        // Near the top of the page, force the first section.
        if (window.scrollY < 120 && sections[0]) {
          bestId = sections[0].id;
        }
        if (bestId) setActive(bestId);
      },
      {
        root: null,
        // Bias toward the upper half of the viewport — matches where the
        // reader's eye is while the sticky rail is visible.
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, [sections]);

  if (sections.length === 0) return null;

  return (
    <nav
      aria-label="On this page"
      className="sticky top-[4.25rem] z-30 -mx-5 mb-2 border-y border-border/40 bg-background/80 px-5 backdrop-blur-md sm:-mx-8 sm:px-8 md:top-[4.75rem]"
    >
      <ul className="flex gap-1 overflow-x-auto py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <li
          aria-hidden="true"
          className="shrink-0 pr-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50 leading-7"
        >
          on this page
        </li>
        {sections.map((s) => {
          const isActive = active === s.id;
          return (
            <li key={s.id} className="shrink-0">
              <a
                href={`#${s.id}`}
                className={cn(
                  "inline-block rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
                  isActive
                    ? "bg-signal/15 text-signal"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
