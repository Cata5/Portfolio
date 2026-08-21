import { NextResponse } from "next/server";
import { getRAGConfig } from "@/lib/rag/config";

export const dynamic = "force-dynamic";

const FALLBACK_UNSLOTH_KEY = "sk-unsloth-f4823b690552e8812ba5884dc4cccb26";

interface ModelInfo {
  id: string;
  name?: string;
  loaded?: boolean;
  quant?: string;
}

export async function GET() {
  try {
    const config = getRAGConfig();
    const baseUrl = (config.models.generationBaseUrl || "http://127.0.0.1:8888/v1").replace(/\/+$/, "");
    const apiKey =
      config.models.apiKey ||
      process.env.LOCAL_LLM_API_KEY ||
      FALLBACK_UNSLOTH_KEY;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
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
        },
        { status: 200 }
      );
    }

    const data = await res.json();
    const rawList = Array.isArray(data.data) ? data.data : Array.isArray(data.models) ? data.models : [];

    const models: ModelInfo[] = rawList.map((m: Record<string, unknown>) => ({
      id: String(m.id || m.name || ""),
      name: String(m.display_name || m.name || m.id || ""),
      loaded: Boolean(m.loaded),
      quant: m.quant ? String(m.quant) : undefined,
    }));

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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const config = getRAGConfig();
    const baseUrl = (body.baseUrl || config.models.generationBaseUrl || "http://127.0.0.1:8888/v1").replace(/\/+$/, "");
    const targetModel = body.modelName || config.models.generationModel || "unsloth/gemma-4-E2B-it-qat-GGUF";
    const shouldReload = Boolean(body.reload);

    const rawKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    const apiKey =
      rawKey ||
      config.models.apiKey ||
      process.env.LOCAL_LLM_API_KEY ||
      FALLBACK_UNSLOTH_KEY;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    // If reload requested, trigger Unsloth / LM Studio inference load
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
        }
      } catch (loadErr) {
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

    const models: ModelInfo[] = rawList.map((m: Record<string, unknown>) => ({
      id: String(m.id || m.name || ""),
      name: String(m.display_name || m.name || m.id || ""),
      loaded: Boolean(m.loaded),
      quant: m.quant ? String(m.quant) : undefined,
    }));

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
