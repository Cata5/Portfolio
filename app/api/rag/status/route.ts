import { NextResponse } from "next/server";
import { rag } from "@/lib/rag/rag-facade";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await rag.getStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch status";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
