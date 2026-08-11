import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Frosted-glass panel — the same recipe as the hero's "currently building"
 * card (border-border/50, backdrop-blur). On desktop it sits at bg-card/85;
 * on mobile it drops to /60 so the triangle material stays visible behind
 * the panel instead of reading as a solid card (the user's "can't see the
 * shapes" ask).
 */
export function GlassCard({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border border-border/50 bg-card/60 backdrop-blur-sm md:bg-card/85",
        className,
      )}
      {...props}
    />
  );
}
