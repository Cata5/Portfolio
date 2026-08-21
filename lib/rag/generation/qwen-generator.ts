import type { GenerationChunk, IGenerationProvider } from "./interface";

export interface OpenAIGeneratorOptions {
  baseUrl: string; // e.g. "http://127.0.0.1:8888/v1" or "http://127.0.0.1:1234/v1"
  modelName: string; // e.g. "unsloth/gemma-4-E2B-it-qat-GGUF" or "qwen2.5-coder-1.5b-instruct"
  apiKey?: string;
  timeoutMs?: number;
}

export class OpenAIGenerationProvider implements IGenerationProvider {
  public readonly modelName: string;
  public readonly baseUrl: string;
  public readonly apiKey: string;
  private timeoutMs: number;

  constructor(options: OpenAIGeneratorOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.modelName = options.modelName || "unsloth/gemma-4-E2B-it-qat-GGUF";
    this.apiKey = options.apiKey || "";
    this.timeoutMs = options.timeoutMs || 45000;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  /**
   * Check if backend is alive and accessible
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: this.getHeaders(),
        signal: controller.signal,
      });
      clearTimeout(id);
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * If local server (like Unsloth) requires explicit model load, trigger it.
   */
  private async tryAutoLoadModel(): Promise<boolean> {
    try {
      const rootUrl = this.baseUrl.replace(/\/v1$/, "");
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 60000);
      const res = await fetch(`${rootUrl}/api/inference/load`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ model_path: this.modelName }),
        signal: controller.signal,
      });
      clearTimeout(id);
      if (res.ok) {
        await res.text();
        return true;
      }
    } catch {
      // Ignore
    }
    return false;
  }

  public async generate(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
      stopSequences?: string[];
    }
  ): Promise<string> {
    const makeRequest = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            model: this.modelName,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: options?.temperature ?? 0.2,
            max_tokens: options?.maxTokens ?? 2048,
            top_p: options?.topP ?? 0.95,
            frequency_penalty: options?.frequencyPenalty ?? 0.0,
            presence_penalty: options?.presencePenalty ?? 0.0,
            stop: options?.stopSequences,
            stream: false,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return res;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    let res: Response;
    try {
      res = await makeRequest();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`[RAG LLM] Could not connect to LLM at ${this.baseUrl}: ${msg}`);
    }

    // If server returned 400 with model not loaded, attempt auto-load and retry once
    if (res.status === 400) {
      const errBody = await res.text();
      if (errBody.includes("No model loaded") || errBody.includes("POST /inference/load")) {
        console.info(`[RAG LLM] Model not loaded on server. Attempting auto-load: ${this.modelName}...`);
        const loaded = await this.tryAutoLoadModel();
        if (loaded) {
          res = await makeRequest();
        } else {
          throw new Error(`[RAG LLM] Model ${this.modelName} is not loaded on server: ${errBody}`);
        }
      } else {
        throw new Error(`[RAG LLM] Request failed (${res.status}): ${errBody}`);
      }
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`[RAG LLM] ${this.baseUrl}/chat/completions returned HTTP ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    if (!choice) {
      throw new Error(`[RAG LLM] Invalid response from LLM (no choices returned)`);
    }

    const content = choice.message?.content || choice.message?.reasoning_content || "";
    return content.trim();
  }

  public async generateStream(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
      stopSequences?: string[];
      onDelta?: (delta: string) => void;
    }
  ): Promise<AsyncIterable<GenerationChunk>> {
    const makeStreamRequest = async () => {
      const controller = new AbortController();
      return fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: options?.temperature ?? 0.2,
          max_tokens: options?.maxTokens ?? 2048,
          top_p: options?.topP ?? 0.95,
          frequency_penalty: options?.frequencyPenalty ?? 0.0,
          presence_penalty: options?.presencePenalty ?? 0.0,
          stop: options?.stopSequences,
          stream: true,
        }),
        signal: controller.signal,
      });
    };

    let res: Response;
    try {
      res = await makeStreamRequest();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`[RAG LLM] Could not connect to LLM stream at ${this.baseUrl}: ${msg}`);
    }

    // If model not loaded, try auto-load and retry stream once
    if (res.status === 400) {
      const errBody = await res.text();
      if (errBody.includes("No model loaded") || errBody.includes("POST /inference/load")) {
        console.info(`[RAG LLM] Model not loaded on server. Attempting auto-load: ${this.modelName}...`);
        const loaded = await this.tryAutoLoadModel();
        if (loaded) {
          res = await makeStreamRequest();
        } else {
          throw new Error(`[RAG LLM] Model ${this.modelName} is not loaded on server: ${errBody}`);
        }
      } else {
        throw new Error(`[RAG LLM] Stream request failed (${res.status}): ${errBody}`);
      }
    }

    if (!res.ok || !res.body) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`[RAG LLM] Stream returned HTTP ${res.status}: ${errBody}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    return (async function* () {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":")) continue;
            if (trimmed === "data: [DONE]") {
              yield { delta: "", done: true };
              return;
            }
            if (trimmed.startsWith("data: ")) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                const deltaObj = json.choices?.[0]?.delta;
                // If content is present, use it. If not, check for reasoning_content (or stream content)
                const delta = deltaObj?.content ?? "";
                if (delta) {
                  options?.onDelta?.(delta);
                  yield { delta, done: false };
                }
              } catch {
                // Ignore malformed SSE chunks
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      yield { delta: "", done: true };
    })();
  }
}
