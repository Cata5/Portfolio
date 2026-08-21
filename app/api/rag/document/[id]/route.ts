import { NextResponse } from "next/server";
import { rag } from "@/lib/rag/rag-facade";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await rag.deleteDocument(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete document";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
