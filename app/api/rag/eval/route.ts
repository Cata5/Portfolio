import { NextResponse } from "next/server";
import { rag } from "@/lib/rag/rag-facade";

export const dynamic = "force-static";

export async function GET() {
  try {
    const comparison = await rag.runEvaluation();
    return NextResponse.json({ success: true, comparison });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to run evaluation";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const comparison = await rag.runEvaluation();
    return NextResponse.json({ success: true, comparison });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to run evaluation";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
