"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";

import { gsap } from "@/components/motion/gsap";
import { hasFinePointer, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

/**
 * <Magnetic><Button>View project</Button></Magnetic>
 *
 * The element leans a few pixels toward the pointer (gsap.quickTo — one tween
 * per axis, retargeted, never spammed) and settles back with the same gentle
 * ease when it leaves. Movement is capped (~8–14px), disabled on touch
 * devices and for reduced-motion users.
 */
export function Magnetic({
  children,
  className,
  strength = 0.28,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const xTo = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const yTo = useRef<ReturnType<typeof gsap.quickTo> | null>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || !hasFinePointer() || prefersReducedMotion()) return;

    xTo.current = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" });
    yTo.current = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" });

    return () => {
      gsap.killTweensOf(el);
      xTo.current = null;
      yTo.current = null;
    };
  }, []);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !xTo.current || !yTo.current) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    xTo.current(x * strength);
    yTo.current(y * strength);
  };

  const onLeave = () => {
    xTo.current?.(0);
    yTo.current?.(0);
  };

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}
