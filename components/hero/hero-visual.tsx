import type { RefObject } from "react";

import type { VisualProgress } from "@/components/hero/tri-earth";
import { TriEarth } from "@/components/hero/tri-earth";
import { cn } from "@/lib/utils";

/**
 * The hero's visual centerpiece: the generative triangular Earth, framed in a
 * right-of-center box so it reads as an object behind the typography rather
 * than a full-bleed background. The canvas carries its own generation,
 * rotation, atmosphere and cursor tilt; the hero feeds scroll progress in so
 * the globe enlarges and dissolves as the page hands off to the next section.
 */
export function HeroVisual({
  className,
  progressRef,
}: {
  className?: string;
  progressRef?: RefObject<VisualProgress>;
}) {
  return (
    <div className={cn("pointer-events-none", className)} aria-hidden="true">
      <TriEarth className="h-full w-full" progressRef={progressRef} />
    </div>
  );
}
