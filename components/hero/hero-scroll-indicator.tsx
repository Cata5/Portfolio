import { ArrowDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Minimal scroll cue — mono label, thin rule, one gentle nudge on load.
 * The hero's scroll timeline fades it out as soon as the user scrolls.
 */
export function HeroScrollIndicator({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "hero-scroll-hint inline-flex items-center gap-3",
        className,
      )}
    >
      <span className="h-px w-10 bg-border/70" aria-hidden="true" />
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        scroll
      </span>
      <ArrowDown
        className="size-3 animate-scroll-nudge text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  );
}
