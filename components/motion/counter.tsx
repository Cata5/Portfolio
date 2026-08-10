"use client";

import { useRef } from "react";

import { gsap } from "@/components/motion/gsap";
import { EASE, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

/**
 * Counts from its previous value to `value` when the prop changes — used for
 * the explorer's "showing X of Y" and the horizontal section's progress.
 */
export function Counter({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const from = prev.current;
    if (from === value) return;

    const state = { n: from };
    const tween = gsap.to(state, {
      n: value,
      duration: 0.5,
      ease: EASE.out,
      onUpdate: () => {
        el.textContent = String(Math.round(state.n));
      },
    });
    prev.current = value;
    return () => {
      tween.kill();
    };
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
