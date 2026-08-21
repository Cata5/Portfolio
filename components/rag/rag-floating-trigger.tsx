"use client";

import { useRAG } from "./rag-context";
import { useState, useEffect } from "react";
import { CLogo } from "./c-logo";

export function RAGFloatingTrigger() {
  const { isOpen, setIsOpen } = useRAG();
  const [shortcut, setShortcut] = useState("Ctrl J");

  useEffect(() => {
    if (typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)) {
      setShortcut("⌘J");
    }
  }, []);

  // Don't render floating trigger when modal is already open
  if (isOpen) return null;

  return (
    <aside
      aria-label="Portfolio AI Assistant Shortcut"
      className="fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6"
    >
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group relative flex size-11 items-center justify-center rounded-full border border-border/50 bg-card/40 backdrop-blur-2xl text-foreground shadow-2xl ring-1 ring-white/10 transition-all duration-200 hover:border-signal/70 hover:scale-105 hover:shadow-[0_0_25px_rgba(128,82,255,0.35)] cursor-pointer"
        aria-label={`Open Portfolio AI Guide (${shortcut})`}
      >
        {/* Brand C Logo */}
        <div className="relative flex items-center justify-center">
          <CLogo className="size-5 text-signal transition-transform duration-200 group-hover:scale-110" />
        </div>

        {/* Frosted Glass Tooltip on hover */}
        <div className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-xl border border-border/50 bg-card/70 px-3 py-1.5 font-mono text-[11px] font-medium text-foreground shadow-2xl backdrop-blur-xl ring-1 ring-white/10 transition-all duration-150 group-hover:block">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">AI Guide</span>
            <kbd className="rounded-md border border-border/40 bg-neutral-900/80 px-1.5 py-0.5 text-[9px] uppercase text-signal">
              {shortcut}
            </kbd>
          </div>
        </div>
      </button>
    </aside>
  );
}
