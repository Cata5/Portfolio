import { NextResponse } from "next/server";
import { getRAGConfig } from "@/lib/rag/config";
import { requireAdminAuth } from "@/lib/api-auth";

/**
 * POST /api/rag/models/reload — list the models on a (candidate) server and,
 * when `{ reload: true }`, ask the inference server to load `modelName`.
 *
 * Lives apart from the GET-only ../route.ts because `output: export` requires
 * `force-static` on every module that exports GET, and force-static blanks
 * request headers (which would make bearer auth impossible). This module has
 * no GET, so it stays dynamic and header auth works.
 *
 * Body: `{ baseUrl?, apiKey?, modelName?, reload? }` — all optional; omitted
 * fields fall back to the persisted config.
 */

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

export async function POST(request: Request) {
  const unauthorized = requireAdminAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json().catch(() => ({}));
    const config = getRAGConfig();
    const baseUrl = (body.baseUrl || config.models.generationBaseUrl || "http://127.0.0.1:8888/v1").replace(/\/+$/, "");
    const targetModel = body.modelName || config.models.generationModel || "unsloth/gemma-4-E2B-it-qat-GGUF";
    const shouldReload = Boolean(body.reload);

    const rawKey = typeof body.apiKey === "string" ? body.apiKey : undefined;
    const headers = buildHeaders(resolveApiKey(rawKey));

    // If reload requested, trigger the Unsloth / LM Studio inference load
    let reloadResult: { status: string; message: string } | null = null;
    if (shouldReload) {
      try {
        const rootUrl = baseUrl.replace(/\/v1$/, "");
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const loadRes = await fetch(`${rootUrl}/api/inference/load`, {
          method: "POST",
          headers,
          body: JSON.stringify({ model_path: targetModel }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (loadRes.ok) {
          reloadResult = {
            status: "success",
            message: `Model ${targetModel.split("/").pop()} reloaded and primed with new hyperparameters`,
          };
        } else {
          const text = await loadRes.text().catch(() => "");
          reloadResult = {
            status: "failed",
            message: `Reload endpoint returned HTTP ${loadRes.status}${text ? `: ${text.slice(0, 300)}` : ""}`,
          };
        }
      } catch (loadErr) {
        const msg = loadErr instanceof Error ? loadErr.message : String(loadErr);
        reloadResult = {
          status: "failed",
          message: `Could not reach the reload endpoint: ${msg}`,
        };
        console.warn("[RAG API] Model reload attempt failed:", loadErr);
      }
    }

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
          reload: reloadResult,
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
      reload: reloadResult,
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
