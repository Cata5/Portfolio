import { NextResponse } from "next/server";

import { isGhPages } from "@/lib/base-path";

/**
 * On the GitHub Pages static export there is no server — every "API" response
 * is a JSON file baked at build time. These stubs exist so nothing about the
 * build machine (hardware, model config, API keys) is ever written into the
 * public deployment: the real routes previously exported the local llama.cpp
 * apiKey into out/api/rag/status, which was publicly served.
 *
 * The client (rag-context.tsx) treats these shapes exactly like the real ones,
 * but isServerConnected: false keeps the UI in its documented offline state.
 */
/**
 * One neutral payload that satisfies every RAG route's response shape on the
 * static export: success flag, offline status, empty collections. The client
 * (rag-context.tsx) treats these shapes exactly like the real ones, but
 * isServerConnected: false keeps the UI in its documented offline state.
 */
function offlinePayload(): Record<string, unknown> {
  return {
    success: true,
    status: "offline",
    hardware: {},
    models: {
      generationBaseUrl: "",
      generationModel: "",
      embeddingBaseUrl: "",
      embeddingModel: "",
      isServerConnected: false,
    },
    counts: { documents: 0, chunks: 0, lexicalChunks: 0 },
    cache: { queries: { size: 0 } },
    documents: [],
    config: null,
    comparison: null,
    modelList: [],
  };
}

export function stubbedRagResponse(): NextResponse | null {
  if (!isGhPages) return null;
  return NextResponse.json(offlinePayload());
}

/**
 * Defense in depth: strip credential fields from any object before it is
 * serialized into a response. Even on a normal dev/server deploy the RAG
 * config is local-inference detail that never needs to cross the wire.
 */
export function stripSecrets<T extends Record<string, unknown>>(payload: T): T {
  if (!payload || typeof payload !== "object") return payload;
  const clone = { ...payload };
  const clean = (obj: Record<string, unknown>) => {
    for (const key of Object.keys(obj)) {
      if (/^(api_?key|authorization|secret|token)$/i.test(key)) {
        delete obj[key];
      } else if (obj[key] && typeof obj[key] === "object") {
        clean(obj[key] as Record<string, unknown>);
      }
    }
  };
  clean(clone as Record<string, unknown>);
  return clone;
}
