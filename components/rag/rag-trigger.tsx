"use client";

import { useRAG } from "./rag-context";
import { MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";

export function RAGTrigger() {
  const { setIsOpen } = useRAG();
  const [shortcut, setShortcut] = useState("Ctrl ⇧ J");

  useEffect(() => {
    if (typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)) {
      setShortcut("⌘⇧J");
    }
  }, []);

  return (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      className="group relative inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/40 backdrop-blur-xl px-3 py-1.5 font-mono text-[11px] text-foreground transition-all duration-200 hover:border-signal/70 hover:bg-signal/15 hover:shadow-[0_0_15px_rgba(128,82,255,0.25)] ring-1 ring-white/5 cursor-pointer"
      aria-label={`Open Portfolio AI Assistant (${shortcut})`}
    >
      <span className="flex items-center gap-1.5 font-semibold tracking-wide text-foreground group-hover:text-signal transition-colors">
        <MessageSquare className="size-3 text-signal" />
        Ask AI
      </span>

      <kbd className="hidden rounded-md border border-border/40 bg-neutral-900/70 px-1.5 py-0.5 font-mono text-[9px] uppercase text-muted-foreground transition-colors group-hover:text-signal sm:inline-block">
        {shortcut}
      </kbd>
    </button>
  );
}
