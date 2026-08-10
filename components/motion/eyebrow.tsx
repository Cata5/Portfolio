"use client";

import { useRef, type ReactNode } from "react";

import { gsap } from "@/components/motion/gsap";
import { EASE, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

/**
 * The saffron section eyebrow with a small rule that draws itself in —
 * a quiet editorial marker used by every section header.
 */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const label = el.querySelector<HTMLElement>("[data-eyebrow-label]");
    const rule = el.querySelector<HTMLElement>("[data-eyebrow-rule]");
    if (!label || !rule) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        label,
        { yPercent: 120, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.7,
          ease: EASE.out,
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
        },
      );
      gsap.fromTo(
        rule,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1,
          delay: 0.08,
          ease: EASE.outExpo,
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <span
      ref={ref}
      className={`inline-flex items-center gap-3 overflow-hidden ${className ?? ""}`}
    >
      <span
        data-eyebrow-label
        className="text-[13px] font-semibold uppercase tracking-[0.03em] text-saffron"
      >
        {children}
      </span>
      <span
        data-eyebrow-rule
        aria-hidden="true"
        className="h-px w-10 origin-left bg-saffron/60"
      />
    </span>
  );
}
