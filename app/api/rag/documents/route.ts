import { NextResponse } from "next/server";
import { rag } from "@/lib/rag/rag-facade";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await rag.ensureInitialized();
    const documents = rag.getDocuments();
    return NextResponse.json({ success: true, documents });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch documents";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
