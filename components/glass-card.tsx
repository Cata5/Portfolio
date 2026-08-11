import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Frosted-glass panel — the same recipe as the hero's "currently building"
 * card (border-border/50, backdrop-blur). On desktop it sits at bg-card/85;
 * on mobile it drops to /35 with a barely-there 2px blur so the triangle
 * material clearly shows through the panel instead of hiding behind a
 * solid card (the user's "can't see the shapes through the glass on
 * phone" ask).
 */
export function GlassCard({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border border-border/50 bg-card/35 backdrop-blur-[2px] md:bg-card/85 md:backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}
