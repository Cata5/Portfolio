"use client";

import { Container } from "@/components/container";
import { CurrentYear } from "@/components/current-year";
import { useEditor } from "@/components/editor/editor-context";

export function Footer() {
  const { content } = useEditor();
  const site = content.site;

  return (
    <footer className="relative overflow-hidden border-t border-border/40">
      <Container className="relative z-10 flex flex-col gap-4 py-12 md:flex-row md:items-center md:justify-between">
        <p className="font-mono text-[11px] text-muted-foreground">
          © <CurrentYear /> {site.name} — portfolio v2
        </p>
        <div className="flex flex-wrap items-center gap-6 font-mono text-[11px] text-muted-foreground">
          <a
            href={site.source}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
          >
            view source ↗
          </a>
          <a
            href={site.linkedin}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
          >
            LinkedIn ↗
          </a>
          <a
            href={site.instagram}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Instagram ↗
          </a>
          <a href="#top" className="transition-colors hover:text-foreground">
            back to top ↑
          </a>
        </div>
      </Container>
    </footer>
  );
}
