"use client";

import { useRAG } from "./rag-context";
import { FileText, ArrowLeft, Copy, Check } from "lucide-react";
import { useState } from "react";

export function SourceView() {
  const { selectedCitation, setActiveTab } = useRAG();
  const [copied, setCopied] = useState(false);

  if (!selectedCitation) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <FileText className="size-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-medium">No Citation Selected</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Click any citation badge (like <span className="text-signal font-mono">[1]</span>) in the chat response to inspect the source file and preview the evidence chunk!
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedCitation.preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div data-lenis-prevent className="h-full overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
      {/* Top Breadcrumb & Back */}
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("chat")}
          className="inline-flex items-center gap-1.5 font-mono text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to Chat
        </button>

        <span className="rounded bg-signal/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-signal">
          Citation [{selectedCitation.citationId}]
        </span>
      </div>

      {/* Source Metadata Card */}
      <div className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-saffron">
            Document Title
          </span>
          <h2 className="text-xl font-normal text-foreground mt-0.5">
            {selectedCitation.title}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 font-mono text-[12px] border-t border-border/40 pt-3">
          <div>
            <span className="text-muted-foreground uppercase text-[10px]">File Path</span>
            <p className="mt-0.5 text-foreground truncate">{selectedCitation.filePath}</p>
          </div>
          <div>
            <span className="text-muted-foreground uppercase text-[10px]">Section</span>
            <p className="mt-0.5 text-foreground truncate">{selectedCitation.heading || "Main Content"}</p>
          </div>
        </div>
      </div>

      {/* Highlighted Chunk Content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Retrieved Evidence Chunk Content
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? <Check className="size-3 text-signal" /> : <Copy className="size-3" />}
            {copied ? "Copied" : "Copy text"}
          </button>
        </div>

        <div className="rounded-xl border border-signal/40 bg-signal/5 p-5 font-mono text-[13px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {selectedCitation.preview}
        </div>
      </div>
    </div>
  );
}
