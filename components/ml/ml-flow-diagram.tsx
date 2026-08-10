"use client";

import { useRef } from "react";

import { gsap } from "@/components/motion/gsap";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

const FLOW_PATH = "M72 32 H104 M136 32 H208";

/**
 * A compact SVG of the training pipeline — dataset → model → output — whose
 * connections draw themselves in as the section scrolls, with a single
 * "signal" node travelling along them. Decorative: reinforces the content,
 * invents no metrics.
 */
export function MLFlowDiagram({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  useIsomorphicLayoutEffect(() => {
    const wrap = wrapRef.current;
    const path = pathRef.current;
    const dot = dotRef.current;
    if (!wrap || !path || !dot || prefersReducedMotion()) return;

    const total = path.getTotalLength();
    const ctx = gsap.context(() => {
      const trigger = {
        trigger: wrap,
        start: "top 85%",
        end: "bottom 55%",
        scrub: true,
      };
      gsap.fromTo(
        path,
        { strokeDashoffset: total },
        { strokeDashoffset: 0, ease: "none", scrollTrigger: trigger },
      );
      gsap.fromTo(
        dot,
        { opacity: 0 },
        {
          opacity: 1,
          ease: "none",
          scrollTrigger: trigger,
          // GSAP binds `this` to the tween in callbacks; the dot follows the
          // path by the tween's current progress.
          onUpdate: function (this: gsap.core.Tween) {
            const p = path.getPointAtLength(
              Math.min(total, this.progress() * total),
            );
            dot.setAttribute("cx", String(p.x));
            dot.setAttribute("cy", String(p.y));
          },
        },
      );
    }, wrap);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapRef} className={className}>
      <svg
        viewBox="0 0 280 64"
        className="w-full max-w-[280px]"
        aria-hidden="true"
      >
        <g
          stroke="var(--border)"
          strokeWidth={1}
          fill="none"
          fontFamily="'JetBrains Mono', monospace"
          fontSize={10}
        >
          <rect x="8" y="20" width="64" height="24" />
          <rect x="104" y="20" width="32" height="24" />
          <rect x="208" y="20" width="64" height="24" />
        </g>
        <text
          x="40"
          y="35"
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontFamily="'JetBrains Mono', monospace"
          fontSize={10}
        >
          dataset
        </text>
        <text
          x="120"
          y="35"
          textAnchor="middle"
          fill="var(--foreground)"
          fontFamily="'JetBrains Mono', monospace"
          fontSize={10}
          fontWeight={600}
        >
          model
        </text>
        <text
          x="240"
          y="35"
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontFamily="'JetBrains Mono', monospace"
          fontSize={10}
        >
          output
        </text>

        <path
          ref={pathRef}
          d={FLOW_PATH}
          fill="none"
          stroke="var(--signal)"
          strokeWidth={1}
          strokeLinecap="round"
        />
        <circle ref={dotRef} r={3} fill="var(--signal)" opacity={0} />
      </svg>
    </div>
  );
}
