import { NextResponse } from "next/server";
import { rag } from "@/lib/rag/rag-facade";
import { stubbedRagResponse } from "@/lib/rag/gh-pages-stubs";

// Read-only module: the public GET stays here (and is baked as an offline stub
// for the GitHub Pages export). Deletion lives in ./delete/route.ts so this
// module needs no request headers — `force-static` blanks them.
export const dynamic = "force-static";

export async function GET() {
  const stubbed = stubbedRagResponse();
  if (stubbed) return stubbed;
  try {
    await rag.ensureInitialized();
    const documents = rag.getDocuments();
    return NextResponse.json({ success: true, documents });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch documents";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
