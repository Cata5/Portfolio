import { NextResponse } from "next/server";
import { rag } from "@/lib/rag/rag-facade";
import { RagLlmError } from "@/lib/rag/generation/qwen-generator";
import type { RAGStreamEvent } from "@/lib/rag/types/events";

/** Never leak internal URLs / upstream bodies to clients. */
function toClientError(err: unknown): { status: number; message: string } {
  if (err instanceof RagLlmError) {
    console.error(`[RAG query] Generation failure: ${err.message}`);
    return { status: 502, message: err.userMessage };
  }
  const message = err instanceof Error ? err.message : "Internal server error";
  return { status: 500, message };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body.query;
    const isStream = body.stream ?? true;
    const isDebug = body.debug ?? false;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    if (isStream) {
      // SSE Streaming Response
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          function sendEvent(event: RAGStreamEvent) {
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
              );
            } catch {
              // Stream may have closed
            }
          }

          try {
            await rag.query(query, {
              debug: isDebug,
              stream: true,
              history: body.history,
              temperature: body.temperature,
              maxTokens: body.maxTokens,
              onEvent: sendEvent,
            });
          } catch (err: unknown) {
            sendEvent({
              type: "error",
              message: toClientError(err).message,
            });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(customReadable, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    } else {
      // Non-streaming JSON response
      const result = await rag.query(query, {
        debug: isDebug,
        stream: false,
        history: body.history,
        temperature: body.temperature,
        maxTokens: body.maxTokens,
      });

      return NextResponse.json(result);
    }
  } catch (err: unknown) {
    const { status, message } = toClientError(err);
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
