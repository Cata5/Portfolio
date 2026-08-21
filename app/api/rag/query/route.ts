import { NextResponse } from "next/server";
import { rag } from "@/lib/rag/rag-facade";
import type { RAGStreamEvent } from "@/lib/rag/types/events";

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
            const message = err instanceof Error ? err.message : "Error processing RAG query";
            sendEvent({
              type: "error",
              message,
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
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
