import { NextResponse } from "next/server";
import { rag } from "@/lib/rag/rag-facade";
import { stripSecrets, stubbedRagResponse } from "@/lib/rag/gh-pages-stubs";

export const dynamic = "force-static";

export async function GET() {
  const stubbed = stubbedRagResponse();
  if (stubbed) return stubbed;
  try {
    const config = rag.getConfig();
    return NextResponse.json({ success: true, config: stripSecrets(config as unknown as Record<string, unknown>) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch config";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const stubbed = stubbedRagResponse();
  if (stubbed) return stubbed;
  try {
    const body = await request.json();
    const updated = rag.updateConfig(body);
    return NextResponse.json({ success: true, config: stripSecrets(updated as unknown as Record<string, unknown>) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update config";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
