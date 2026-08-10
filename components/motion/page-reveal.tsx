"use client";

import { useRef, type ReactNode } from "react";

import { gsap } from "@/components/motion/gsap";
import { finishProjectTransition } from "@/lib/page-transition";
import { EASE, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

/**
 * Detail-page entrance. If the visitor arrived through a project card, the
 * expanding overlay is still covering the viewport — fade it out here. Either
 * way, the page's top-level blocks settle in with a quiet cascade.
 */
export function PageReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    finishProjectTransition();

    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.children,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: EASE.out,
          stagger: 0.06,
          clearProps: "transform",
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
