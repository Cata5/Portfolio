"use client";

import { useRAG } from "./rag-context";
import { RefreshCw, CheckCircle2, Search, FileText } from "lucide-react";
import { useState, useMemo } from "react";

export function KBView() {
  const { documents, triggerReindex, status } = useRAG();
  const [isReindexing, setIsReindexing] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const handleReindex = async () => {
    setIsReindexing(true);
    try {
      await triggerReindex();
    } finally {
      setIsReindexing(false);
    }
  };

  const filteredDocs = useMemo(() => {
    if (!searchFilter) return documents;
    const q = searchFilter.toLowerCase();
    return documents.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.filePath.toLowerCase().includes(q) ||
        d.fileType.toLowerCase().includes(q)
    );
  }, [documents, searchFilter]);

  return (
    <div
      data-lenis-prevent
      className="h-full max-h-[700px] overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-saffron">
            Knowledge Base Registry
          </span>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            Indexed Portfolio Documents ({documents.length})
          </h2>
        </div>
        <button
          type="button"
          onClick={handleReindex}
          disabled={isReindexing}
          className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/80 px-3.5 py-1.5 font-mono text-[12px] text-foreground transition-all hover:border-signal hover:bg-signal/10 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`size-3.5 ${isReindexing ? "animate-spin text-signal" : ""}`} />
          {isReindexing ? "Re-indexing..." : "Re-index All"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card/60 p-4">
          <span className="font-mono text-[10px] uppercase text-muted-foreground">Indexed Documents</span>
          <p className="mt-1 font-mono text-xl font-semibold text-foreground">{documents.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/60 p-4">
          <span className="font-mono text-[10px] uppercase text-muted-foreground">Dense & BM25 Chunks</span>
          <p className="mt-1 font-mono text-xl font-semibold text-signal">{status?.counts?.chunks || 0}</p>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-border/50 bg-card/60 p-4">
          <span className="font-mono text-[10px] uppercase text-muted-foreground">Change Detection</span>
          <p className="mt-1 font-mono text-xl font-semibold text-saffron">SHA-256 Incremental</p>
        </div>
      </div>

      {/* Search and Table Container */}
      <div className="rounded-xl border border-border/50 bg-card/60 p-4 sm:p-5 space-y-3" data-lenis-prevent>
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/80 px-3 py-1.5 font-mono text-xs">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search indexed files by name, path, or format..."
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          {searchFilter && (
            <button
              type="button"
              onClick={() => setSearchFilter("")}
              className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div
          data-lenis-prevent
          className="max-h-[380px] overflow-x-auto overflow-y-auto overscroll-contain rounded-lg border border-border/40"
        >
          <table className="w-full font-mono text-[11px] text-left">
            <thead className="sticky top-0 bg-neutral-900/95 backdrop-blur-md z-10 border-b border-border/60 text-muted-foreground">
              <tr>
                <th className="p-3 font-semibold">Type</th>
                <th className="p-3 font-semibold">Title</th>
                <th className="p-3 font-semibold">File Path</th>
                <th className="p-3 font-semibold text-center">Chunks</th>
                <th className="p-3 font-semibold text-center">Tokens</th>
                <th className="p-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 bg-card/30">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No documents matching &ldquo;{searchFilter}&rdquo;
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[9px] uppercase font-semibold text-muted-foreground">
                        {doc.fileType}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-foreground">
                      <div className="flex items-center gap-1.5">
                        <FileText className="size-3 text-signal shrink-0" />
                        <span>{doc.title}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground truncate max-w-[200px]" title={doc.filePath}>
                      {doc.filePath}
                    </td>
                    <td className="p-3 text-center text-muted-foreground">{doc.chunkCount}</td>
                    <td className="p-3 text-center text-muted-foreground">~{doc.tokenCount}</td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 text-signal text-[10px]">
                        <CheckCircle2 className="size-3" /> indexed
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
