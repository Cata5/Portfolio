import { NextResponse } from "next/server";
import { rag } from "@/lib/rag/rag-facade";
import { requireAdminAuth } from "@/lib/api-auth";

/**
 * POST /api/rag/eval — run the 17-query benchmark suite (retrieval + optional
 * generation round trips). Admin-only and deliberately POST-only.
 *
 * There is no GET here because `output: export` requires `force-static` on
 * every module that exports GET, and force-static blanks request headers
 * (which would make bearer auth impossible). Without a GET handler this module
 * stays dynamic, header auth works, and the static export simply omits it —
 * the public GitHub Pages site has no admin console to run benchmarks from.
 */
export async function POST(request: Request) {
  const unauthorized = requireAdminAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const comparison = await rag.runEvaluation();
    return NextResponse.json({ success: true, comparison });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to run evaluation";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
