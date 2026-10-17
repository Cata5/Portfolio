"use client";

import { useEffect } from "react";

import { withBasePath } from "@/lib/base-path";

/**
 * The standalone RAG admin page is gone — the RAG engine now lives inside the
 * single admin console. Old bookmarks land on the pipeline view.
 *
 * This is a full document navigation rather than a client-side route change:
 * the console reads `?tab=` once while mounting, and a router.replace can be
 * committed after that read, landing on the default view. A static export has
 * no server redirect, so a hard hop is both simplest and correct.
 */
export default function RAGAdminRedirect() {
  useEffect(() => {
    window.location.replace(withBasePath("/admin/?tab=rag-pipeline"));
  }, []);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <p className="font-mono text-xs text-muted-foreground">
        Console moved — redirecting…
      </p>
    </div>
  );
}
