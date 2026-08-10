"use client";

import { useRef, type ReactNode } from "react";

import { gsap } from "@/components/motion/gsap";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * <Parallax speed={0.2}> — drifts its content at a different rate to the page.
 *
 * Positive speed moves with the scroll direction, negative against it.
 * The element is also scaled slightly so it never reveals its edges inside an
 * overflow-hidden frame. Movement is deliberately subtle.
 */
export function Parallax({
  children,
  speed = 0.12,
  className,
  trigger,
}: {
  children: ReactNode;
  /** Signed drift strength, e.g. 0.12 or -0.06. */
  speed?: number;
  className?: string;
  /** Optional trigger element; defaults to the parent (the containing frame). */
  trigger?: HTMLElement;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { yPercent: -speed * 100 },
        {
          yPercent: speed * 100,
          ease: "none",
          scrollTrigger: {
            trigger: trigger ?? (el.parentElement as HTMLElement),
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [speed, trigger]);

  return (
    <div ref={ref} className={cn(className, "will-change-transform")}>
      {children}
    </div>
  );
}
