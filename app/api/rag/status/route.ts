import { NextResponse } from "next/server";
import { rag } from "@/lib/rag/rag-facade";
import { stubbedRagResponse } from "@/lib/rag/gh-pages-stubs";

export const dynamic = "force-static";

export async function GET() {
  // Static export: serve a fixed offline stub — the real response used to bake
  // build-machine hardware and the local llama.cpp apiKey into the public
  // deployment (see lib/rag/gh-pages-stubs.ts).
  const stubbed = stubbedRagResponse();
  if (stubbed) return stubbed;
  try {
    const status = await rag.getStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch status";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
