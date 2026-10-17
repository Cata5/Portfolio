import { NextResponse } from "next/server";
import { rag } from "@/lib/rag/rag-facade";
import { stripSecrets } from "@/lib/rag/gh-pages-stubs";
import { requireAdminAuth } from "@/lib/api-auth";

/**
 * POST /api/rag/config/update — apply a partial RAG configuration patch.
 *
 * Lives apart from the GET-only ../route.ts because `output: export` requires
 * `force-static` on every module that exports GET, and force-static blanks
 * request headers (which would make bearer auth impossible). This module has
 * no GET, so it stays dynamic and header auth works.
 */
export async function POST(request: Request) {
  const unauthorized = requireAdminAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json();
    const updated = rag.updateConfig(body);
    return NextResponse.json({ success: true, config: stripSecrets(updated as unknown as Record<string, unknown>) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update config";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
