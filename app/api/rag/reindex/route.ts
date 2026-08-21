import { NextResponse } from "next/server";
import { rag } from "@/lib/rag/rag-facade";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await rag.syncPortfolio(true);
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to reindex portfolio";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
