"use client";

import { useRef, type ReactNode } from "react";

import { gsap } from "@/components/motion/gsap";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A screenshot/visual subtly scales down as it leaves the viewport and back
 * to 1 as it enters — scrubbed, so it is directly tied to scroll position.
 */
export function ScrollScale({
  children,
  className,
  from = 0.93,
  start = "top bottom",
  end = "bottom bottom",
}: {
  children: ReactNode;
  className?: string;
  /** Scale at the moment the element leaves the viewport. */
  from?: number;
  start?: string;
  end?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { scale: from },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: el, start, end, scrub: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [from, start, end]);

  return (
    <div ref={ref} className={cn(className, "will-change-transform")}>
      {children}
    </div>
  );
}
