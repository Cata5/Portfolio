import type { ReactNode } from "react";

import { site } from "@/data/site";

function Cell({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {k}
      </dt>
      <dd className="truncate font-mono text-[12px] text-foreground/90">
        {children}
      </dd>
    </div>
  );
}

/**
 * A compact floating card of what is being built right now — the hero's
 * foreground object. Real data lives in data/site.ts. The card overlaps the
 * headline slightly on desktop, then stacks below on mobile.
 */
export function WorkspacePanel() {
  return (
    <div
      role="region"
      aria-label={site.currently.label}
      className="hero-workspace w-full max-w-[300px] border border-border/50 bg-card/85 p-4 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4 pb-3">
        <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-saffron">
          {site.currently.label}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
          <span
            className="size-1.5 animate-signal-pulse rounded-full bg-signal"
            aria-hidden="true"
          />
          live
        </span>
      </div>
      <dl className="space-y-3 border-t border-border/40 pt-3">
        <Cell k="project">{site.currently.project}</Cell>
        <Cell k="stack">{site.currently.stack}</Cell>
        <Cell k="status">
          <span className="text-saffron">{site.currently.status}</span>
        </Cell>
      </dl>
      <p className="mt-3 border-t border-border/40 pt-2 font-mono text-[10px] text-muted-foreground/70">
        {`// data/site.ts`}
      </p>
    </div>
  );
}
