"use client";

import type { ReactNode } from "react";

import { Editable } from "@/components/editor/editable";
import { useEditor } from "@/components/editor/editor-context";

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

export function WorkspacePanel() {
  const { content } = useEditor();
  const currently = content.site.currently;

  return (
    <div
      role="region"
      aria-label={currently.label}
      className="hero-workspace w-full max-w-[300px] border border-border/50 bg-card/85 p-4 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4 pb-3">
        <Editable path="site.currently.label" label="Widget Label" inline>
          <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-saffron">
            {currently.label}
          </span>
        </Editable>
        <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
          <span
            className="size-1.5 animate-signal-pulse rounded-full bg-signal"
            aria-hidden="true"
          />
          live
        </span>
      </div>
      <dl className="space-y-3 border-t border-border/40 pt-3">
        <Cell k="project">
          <Editable path="site.currently.project" label="Project Name" inline>
            {currently.project}
          </Editable>
        </Cell>
        <Cell k="stack">
          <Editable path="site.currently.stack" label="Stack Details" inline>
            {currently.stack}
          </Editable>
        </Cell>
        <Cell k="status">
          <Editable path="site.currently.status" label="Status" inline>
            <span className="text-saffron">{currently.status}</span>
          </Editable>
        </Cell>
      </dl>
      <p className="mt-3 border-t border-border/40 pt-2 font-mono text-[10px] text-muted-foreground/70">
        {`// content/site.json`}
      </p>
    </div>
  );
}

