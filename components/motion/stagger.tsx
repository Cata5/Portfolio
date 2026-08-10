"use client";

import type React from "react";
import { useRef, type ElementType, type ReactNode } from "react";

import { gsap } from "@/components/motion/gsap";
import { EASE, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

/**
 * <Stagger> animates its *direct children* up in a quick cascade when the
 * block scrolls into view — the section-timeline pattern:
 * heading (own reveal) → content pieces 0.00/0.06/0.12…
 */
export function Stagger({
  children,
  className,
  as = "div",
  y = 22,
  stagger = 0.06,
  start = "top 84%",
  once = true,
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  y?: number;
  stagger?: number;
  start?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const kids = Array.from(el.children);
    if (kids.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        kids,
        { y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: EASE.out,
          stagger,
          clearProps: "transform",
          scrollTrigger: { trigger: el, start, once },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [y, stagger, start, once]);

  // Polymorphic tag: a narrow literal union so JSX resolves cleanly; the ref
  // is cast through `never` (safe — never is assignable to every Ref<T>).
  const Tag = as as "div" | "ul" | "ol" | "dl";

  return (
    <Tag ref={ref as React.Ref<never>} className={className}>
      {children}
    </Tag>
  );
}
