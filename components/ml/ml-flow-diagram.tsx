"use client";

import { useRef } from "react";

import { gsap } from "@/components/motion/gsap";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

/**
 * A compact SVG of the training pipeline — dataset → train → model → output —
 * whose connectors draw themselves in as the section scrolls, with a single
 * glowing "signal" node travelling along them. Decorative: reinforces the
 * content, invents no metrics. The model card is the visual anchor (signal
 * stroke), the outer stages sit quieter.
 */

const CARD_W = 70;
const CARD_H = 32;
const Y = 52;
const MID = Y + CARD_H / 2;

const STAGES = [
  { x: 0, label: "dataset", caption: "images · labels", step: "01", accent: false },
  { x: 92, label: "train", caption: "ultralytics", step: "02", accent: false },
  { x: 184, label: "model", caption: "yolo weights", step: "03", accent: true },
  { x: 276, label: "output", caption: "inference", step: "04", accent: false },
] as const;

const FLOW_PATH = [
  `M${CARD_W} ${MID} L${92} ${MID}`,
  `M${92 + CARD_W} ${MID} L${184} ${MID}`,
  `M${184 + CARD_W} ${MID} L${276} ${MID}`,
].join(" ");

const CENTER = (x: number) => x + CARD_W / 2;

export function MLFlowDiagram({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dotGlowRef = useRef<SVGCircleElement>(null);
  const dotCoreRef = useRef<SVGCircleElement>(null);

  useIsomorphicLayoutEffect(() => {
    const wrap = wrapRef.current;
    const path = pathRef.current;
    const dotGlow = dotGlowRef.current;
    const dotCore = dotCoreRef.current;
    if (!wrap || !path || !dotGlow || !dotCore) return;

    // Reduced motion: a static diagram — full connectors drawn, and the
    // signal dots parked at the end of the flow.
    if (prefersReducedMotion()) {
      gsap.set([dotGlow, dotCore], {
        opacity: 1,
        attr: { cx: 276, cy: MID },
      });
      return;
    }

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
        [dotGlow, dotCore],
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
            dotGlow.setAttribute("cx", String(p.x));
            dotGlow.setAttribute("cy", String(p.y));
            dotCore.setAttribute("cx", String(p.x));
            dotCore.setAttribute("cy", String(p.y));
          },
        },
      );
    }, wrap);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapRef} className={className}>
      <svg
        viewBox="0 0 352 150"
        className="w-full max-w-[352px]"
        aria-hidden="true"
      >
        {/* Connectors — a faint dashed track with a solid signal line that
            draws itself in by scroll, plus a travelling glow node. */}
        <path
          d={FLOW_PATH}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1}
          strokeLinecap="round"
          strokeDasharray="2 5"
        />
        <path
          ref={pathRef}
          d={FLOW_PATH}
          fill="none"
          stroke="var(--signal)"
          strokeWidth={1}
          strokeLinecap="round"
        />
        <circle
          ref={dotGlowRef}
          r={5}
          fill="var(--signal)"
          opacity={0}
          style={{ filter: "blur(1.5px)" }}
        />
        <circle ref={dotCoreRef} r={2} fill="var(--signal)" opacity={0} />

        {STAGES.map((stage) => {
          const isModel = stage.accent;
          return (
            <g key={stage.step}>
              {/* Step badge above the card. */}
              <text
                x={CENTER(stage.x)}
                y={Y - 12}
                textAnchor="middle"
                fill="var(--muted-foreground)"
                opacity={0.75}
                fontFamily="'JetBrains Mono', monospace"
                fontSize={8}
              >
                {stage.step}
              </text>
              {/* Card. */}
              <rect
                x={stage.x}
                y={Y}
                width={CARD_W}
                height={CARD_H}
                rx={7}
                fill={
                  isModel
                    ? "color-mix(in srgb, var(--signal) 12%, transparent)"
                    : "color-mix(in srgb, var(--foreground) 5%, transparent)"
                }
                stroke={isModel ? "var(--signal)" : "var(--border)"}
                strokeWidth={isModel ? 1.2 : 1}
              />
              {/* Card label. */}
              <text
                x={CENTER(stage.x)}
                y={Y + 19}
                textAnchor="middle"
                fill={isModel ? "var(--signal)" : "var(--foreground)"}
                fontFamily="'JetBrains Mono', monospace"
                fontSize={10}
                fontWeight={isModel ? 600 : 500}
              >
                {stage.label}
              </text>
              {/* Caption under the card. */}
              <text
                x={CENTER(stage.x)}
                y={Y + CARD_H + 16}
                textAnchor="middle"
                fill="var(--muted-foreground)"
                fontFamily="'JetBrains Mono', monospace"
                fontSize={8}
              >
                {stage.caption}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
