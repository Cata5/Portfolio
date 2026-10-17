import { NextResponse } from "next/server";
import { getRAGConfig } from "@/lib/rag/config";
import { stubbedRagResponse } from "@/lib/rag/gh-pages-stubs";

// Read-only module: the public GET stays here (and is baked as an offline stub
// for the GitHub Pages export). Reload/parameter-apply lives in
// ./reload/route.ts so this module needs no request headers — `force-static`
// blanks them, and a plain model listing carries no admin-only data.
export const dynamic = "force-static";

interface ModelInfo {
  id: string;
  name?: string;
  loaded?: boolean;
  quant?: string;
}

/** Key sources only: explicit override → configured key → env. Never hardcoded. */
function resolveApiKey(explicit?: string): string {
  if (explicit && explicit.trim().length > 0) return explicit.trim();
  return getRAGConfig().models.apiKey || process.env.LOCAL_LLM_API_KEY || "";
}

function buildHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  return headers;
}

function parseModels(rawList: Record<string, unknown>[]): ModelInfo[] {
  return rawList.map((m) => ({
    id: String(m.id || m.name || ""),
    name: String(m.display_name || m.name || m.id || ""),
    loaded: Boolean(m.loaded),
    quant: m.quant ? String(m.quant) : undefined,
  }));
}

export async function GET() {
  // Static export: never touch the LLM server or bake its config into the deploy.
  const stubbed = stubbedRagResponse();
  if (stubbed) return stubbed;
  try {
    const config = getRAGConfig();
    const baseUrl = (config.models.generationBaseUrl || "http://127.0.0.1:8888/v1").replace(/\/+$/, "");
    const headers = buildHeaders(resolveApiKey());

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${baseUrl}/models`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        {
          success: false,
          error: `HTTP ${res.status}: ${text || res.statusText}`,
          models: [],
        },
        { status: 200 }
      );
    }

    const data = await res.json();
    const rawList = Array.isArray(data.data) ? data.data : Array.isArray(data.models) ? data.models : [];

    const models = parseModels(rawList as Record<string, unknown>[]);

    return NextResponse.json({
      success: true,
      models,
      count: models.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        error: `Could not connect to LLM server: ${msg}`,
        models: [],
      },
      { status: 200 }
    );
  }
}
