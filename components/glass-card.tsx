import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Frosted-glass panel — the same recipe as the hero's "currently building"
 * card (border-border/50, bg-card/85, backdrop-blur-sm). Used to float
 * section content over the fixed triangle canvas so the material reads
 * through a soft blur instead of behind a hard backdrop.
 */
export function GlassCard({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border border-border/50 bg-card/85 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}
