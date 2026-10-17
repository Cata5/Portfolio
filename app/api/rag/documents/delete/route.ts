import { NextResponse } from "next/server";
import { rag } from "@/lib/rag/rag-facade";
import { requireAdminAuth } from "@/lib/api-auth";

/**
 * DELETE /api/rag/documents/delete — remove one document from every index
 * (body: `{ id }`).
 *
 * Lives apart from the GET-only ../route.ts because `output: export` requires
 * `force-static` on every module that exports GET, and force-static blanks
 * request headers (which would make bearer auth impossible). This module has
 * no GET, so it stays dynamic and header auth works.
 */
export async function DELETE(request: Request) {
  const unauthorized = requireAdminAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "Document ID is required" }, { status: 400 });
    }
    const deleted = await rag.deleteDocument(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete document";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
