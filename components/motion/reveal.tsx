"use client";

import { useRef, type ReactNode } from "react";

import { gsap } from "@/components/motion/gsap";
import { EASE, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

/**
 * A single, restrained scroll reveal. Used once per section block — never on
 * every element (staggered timelines belong in <Stagger>). Renders statically
 * when the user prefers reduced motion.
 *
 * Mirrors the previous framer-motion Reveal API (children/delay/className) so
 * every existing call site upgrades without edits.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  y = 28,
  scale,
  duration = 0.9,
  start = "top 88%",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Distance the block travels up as it appears. */
  y?: number;
  /** Optional subtle scale-in (project visuals, phones). */
  scale?: number;
  duration?: number;
  start?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.set(el, {
        opacity: 0,
        y,
        ...(scale !== undefined ? { scale } : {}),
      });
      gsap.to(el, {
        opacity: 1,
        y: 0,
        ...(scale !== undefined ? { scale: 1 } : {}),
        duration,
        delay,
        ease: EASE.out,
        clearProps: "transform",
        scrollTrigger: { trigger: el, start, once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [delay, y, scale, duration, start]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
