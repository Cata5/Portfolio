import { NextResponse } from "next/server";
import { rag } from "@/lib/rag/rag-facade";
import { stubbedRagResponse, stripSecrets } from "@/lib/rag/gh-pages-stubs";

// GitHub Pages static export requires `force-static` on every GET route
// handler (next: app-route module check), which bakes the offline stub at
// build time. This module must therefore stay read-only and header-free:
// mutating endpoints live in their own POST/DELETE-only modules (exempt from
// the static-export check), where force-static's header blanking can't break
// bearer auth. Consequence: on a `next build && next start` server this GET
// serves the build-time snapshot; dev is fully live.
export const dynamic = "force-static";

export async function GET() {
  // Static export: serve a fixed offline stub — the real response used to bake
  // build-machine hardware and the local llama.cpp apiKey into the public
  // deployment (see lib/rag/gh-pages-stubs.ts).
  const stubbed = stubbedRagResponse();
  if (stubbed) return stubbed;
  try {
    const status = await rag.getStatus();
    // Never ship credentials (models.apiKey) over the wire.
    return NextResponse.json({
      success: true,
      ...stripSecrets(status as unknown as Record<string, unknown>),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch status";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
