"use client";

import { useEffect, useRef } from "react";

import { gsap } from "@/components/motion/gsap";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

/**
 * A restrained custom cursor — a small dot with a lagging ring, not a
 * replacement pointer. States:
 *
 * - default: 6px dot + 28px ring
 * - hovering interactive elements: ring expands
 * - `[data-cursor="view"]` targets (project cards): a "VIEW" pill replaces
 *   the ring, hinting at the page transition
 *
 * Desktop only: fine pointer AND a desktop-width viewport. Touch devices,
 * reduced-motion users, and narrow windows never activate it, and the markup
 * stays invisible at the top-left corner. The native cursor is hidden purely
 * via the `.has-custom-cursor` class (no-JS keeps it). All elements are
 * pointer-events: none. The cursor tracks the viewport width reactively, so
 * resizing across the breakpoint turns it on/off cleanly.
 */
export function Cursor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const view = viewRef.current;
    if (!container || !dot || !ring || !view) return;

    let xTo: ReturnType<typeof gsap.quickTo>;
    let yTo: ReturnType<typeof gsap.quickTo>;
    let rxTo: ReturnType<typeof gsap.quickTo>;
    let ryTo: ReturnType<typeof gsap.quickTo>;
    let vxTo: ReturnType<typeof gsap.quickTo>;
    let vyTo: ReturnType<typeof gsap.quickTo>;

    let viewOn = false;
    let hoverOn = false;

    const onMove = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      rxTo(e.clientX);
      ryTo(e.clientY);
      vxTo(e.clientX);
      vyTo(e.clientY);
    };

    const setHover = (on: boolean) => {
      hoverOn = on;
      gsap.to(ring, {
        scale: hoverOn ? 1.7 : 1,
        opacity: hoverOn ? 0.9 : 1,
        duration: 0.3,
        ease: "power3.out",
      });
      gsap.to(dot, { scale: hoverOn ? 0.4 : 1, duration: 0.3 });
    };

    const setView = (on: boolean) => {
      viewOn = on;
      gsap.to(view, {
        scale: on ? 1 : 0,
        opacity: on ? 1 : 0,
        duration: 0.35,
        ease: "back.out(2)",
      });
      gsap.to(ring, {
        scale: on ? 2.4 : 1,
        opacity: on ? 0 : 1,
        duration: 0.35,
      });
    };

    const interactive =
      "a, button, [role='button'], input, textarea, select, [data-cursor='hover']";

    // mouseover/mouseout fire between *children* of the same card — only
    // react when the pointer actually crosses into a different element.
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const from = (e.relatedTarget as HTMLElement | null)?.closest(
        '[data-cursor="view"], ' + interactive,
      );
      const to = t.closest('[data-cursor="view"], ' + interactive);
      if (from === to) return;
      if (t.closest('[data-cursor="view"]')) setView(true);
      else if (to) {
        if (viewOn) setView(false);
        setHover(true);
      }
    };
    const onOut = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const to = (e.relatedTarget as HTMLElement | null)?.closest(
        '[data-cursor="view"], ' + interactive,
      );
      const from = t.closest('[data-cursor="view"], ' + interactive);
      if (from === to) return;
      if (t.closest('[data-cursor="view"]')) setView(false);
      else if (from) setHover(false);
    };

    const onDown = () => gsap.to(ring, { scale: 0.8, duration: 0.2 });
    const onUp = () =>
      gsap.to(ring, { scale: hoverOn ? 1.7 : 1, duration: 0.3 });
    const onLeaveWin = () => gsap.to(container, { opacity: 0, duration: 0.3 });
    const onEnterWin = () => gsap.to(container, { opacity: 1, duration: 0.3 });

    const activate = () => {
      document.documentElement.classList.add("has-custom-cursor");
      gsap.set(container, { opacity: 1 });
      xTo = gsap.quickTo(dot, "x", { duration: 0.16, ease: "power3.out" });
      yTo = gsap.quickTo(dot, "y", { duration: 0.16, ease: "power3.out" });
      rxTo = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3.out" });
      ryTo = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3.out" });
      vxTo = gsap.quickTo(view, "x", { duration: 0.5, ease: "power3.out" });
      vyTo = gsap.quickTo(view, "y", { duration: 0.5, ease: "power3.out" });
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("mouseover", onOver);
      document.addEventListener("mouseout", onOut);
      window.addEventListener("pointerdown", onDown);
      window.addEventListener("pointerup", onUp);
      document.documentElement.addEventListener("mouseleave", onLeaveWin);
      document.documentElement.addEventListener("mouseenter", onEnterWin);
    };

    const deactivate = () => {
      document.documentElement.classList.remove("has-custom-cursor");
      gsap.set(container, { opacity: 0 });
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeaveWin);
      document.documentElement.removeEventListener("mouseenter", onEnterWin);
      gsap.killTweensOf([dot, ring, view, container]);
    };

    const sync = () => {
      const on =
        !prefersReducedMotion() &&
        hasFinePointer() &&
        window.matchMedia("(min-width: 768px)").matches;
      if (on) {
        if (!document.documentElement.classList.contains("has-custom-cursor")) {
          activate();
        }
      } else {
        deactivate();
      }
    };

    const mq = window.matchMedia("(min-width: 768px)");
    mq.addEventListener("change", sync);
    sync();

    return () => {
      mq.removeEventListener("change", sync);
      deactivate();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[200] opacity-0"
    >
      <div
        ref={ringRef}
        className="fixed left-0 top-0 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-current opacity-80 mix-blend-difference"
      />
      <div
        ref={dotRef}
        className="fixed left-0 top-0 size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-current mix-blend-difference"
      />
      <div
        ref={viewRef}
        className="fixed left-0 top-0 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-signal px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white opacity-0"
      >
        view
      </div>
    </div>
  );
}
