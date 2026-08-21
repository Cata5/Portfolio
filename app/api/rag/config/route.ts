import { NextResponse } from "next/server";
import { rag } from "@/lib/rag/rag-facade";

export const dynamic = "force-static";

export async function GET() {
  try {
    const config = rag.getConfig();
    return NextResponse.json({ success: true, config });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch config";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updated = rag.updateConfig(body);
    return NextResponse.json({ success: true, config: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update config";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
