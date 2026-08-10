"use client";

import type React from "react";
import { useRef, type ElementType, type ReactNode } from "react";

import { gsap, SplitText } from "@/components/motion/gsap";
import { EASE, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Mode = "lines" | "words";
type Play = "scroll" | "load";

/**
 * Editorial text reveal — lines (or words) travel up from behind a hidden
 * mask, as if moving through a viewport. Large typography only; body copy
 * uses <Reveal>.
 *
 * - `play="scroll"` fires when the element enters the viewport (default).
 * - `play="load"` fires once on mount — used by the hero and detail pages,
 *   where the entrance belongs to a page timeline rather than scrolling.
 *
 * Splits with GSAP SplitText; every split piece gets an `aria-label` on the
 * root so screen readers announce the full text once, not word by word.
 */
export function TextReveal({
  children,
  className,
  as = "h2",
  mode = "lines",
  play = "scroll",
  delay = 0,
  stagger = 0.09,
  start = "top 88%",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  mode?: Mode;
  play?: Play;
  delay?: number;
  stagger?: number;
  start?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    if (!el.textContent?.trim()) return;

    const ctx = gsap.context(() => {
      const split = new SplitText(el, {
        type: mode === "lines" ? "lines" : "words",
        linesClass: "tr-line",
        wordsClass: "tr-word",
      });
      const pieces = mode === "lines" ? split.lines : split.words;

      // Full text announced once by assistive tech.
      el.setAttribute("aria-label", el.textContent ?? "");

      // Each piece rises from below a clipping mask.
      pieces.forEach((piece) => {
        const mask = document.createElement("span");
        mask.className = `tr-mask tr-mask--${mode}`;
        (piece as HTMLElement).parentNode?.insertBefore(mask, piece);
        mask.appendChild(piece);
      });

      gsap.set(pieces, { yPercent: 115 });
      gsap.to(pieces, {
        yPercent: 0,
        duration: 1.15,
        ease: EASE.outStrong,
        stagger,
        delay,
        clearProps: "transform",
        ...(play === "scroll"
          ? {
              scrollTrigger: { trigger: el, start, once: true },
            }
          : {}),
      });
    }, el);

    return () => ctx.revert();
  }, [mode, play, delay, stagger, start]);

  // Polymorphic tag: a narrow literal union so JSX resolves cleanly; the ref
  // is cast through `never` (safe — never is assignable to every Ref<T>).
  const Tag = as as "h1" | "h2" | "h3" | "p" | "span" | "div";

  return (
    <Tag ref={ref as React.Ref<never>} className={cn(className, "tr-root")}>
      {children}
    </Tag>
  );
}
