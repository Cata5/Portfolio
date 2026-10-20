/**
 * Prints the raw and sanitized answer for a single query through the exact
 * production prompt path, so phrasing-level behaviour (refusals, citation
 * style, artifacts) can be inspected instead of only scored.
 *
 * Usage: npx tsx scripts/probe-answer.ts "query" [format] [temperature] [freqPen]
 *        format: verbose (default) | compact | lean
 */
import { rag } from "../lib/rag/rag-facade";
import { getRAGConfig } from "../lib/rag/config";
import { hybridRetriever } from "../lib/rag/retrieval/hybrid-retriever";
import { assembleContext } from "../lib/rag/context/budget";
import { buildGroundedSystemPrompt, buildGroundedUserPrompt } from "../lib/rag/generation/prompts";
import { sanitizeAssistantContent } from "../lib/rag/chat-format";
import { resolveNavigationActions } from "../lib/rag/navigation-helpers";

type Format = "verbose" | "compact" | "lean";

function formatEvidence(ctx: ReturnType<typeof assembleContext>, format: Format): string {
  if (format === "verbose") return ctx.formattedContext;
  return ctx.evidenceBlocks
    .map((b) => {
      const head = `${b.title}${b.heading ? ` — ${b.heading}` : ""} (${b.filePath})`;
      return format === "lean"
        ? `EVIDENCE ITEM [${b.citationId}] — ${head}:\n${b.content}`
        : `[${b.citationId}] ${head}\n${b.content}`;
    })
    .join("\n\n");
}

async function main() {
  const query = process.argv[2] ?? "What is the capital city of Australia?";
  const format = (process.argv[3] as Format) ?? "verbose";
  const temperature = Number(process.argv[4] ?? 0.2);
  const frequencyPenalty = Number(process.argv[5] ?? 0.05);

  const config = getRAGConfig();
  await rag.ensureInitialized();
  const ret = await hybridRetriever.retrieve(query);
  const ctx = assembleContext(ret.rerankedResults.map((r) => r.chunk));

  const res = await fetch(`${config.models.generationBaseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.models.apiKey ? { Authorization: `Bearer ${config.models.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: config.models.generationModel,
      messages: [
        { role: "system", content: buildGroundedSystemPrompt() },
        { role: "user", content: buildGroundedUserPrompt(query, formatEvidence(ctx, format)) },
      ],
      temperature,
      top_p: config.models.topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: config.models.presencePenalty,
      max_tokens: config.models.maxTokens,
      stream: false,
    }),
  });
  const json = (await res.json()) as {
    choices?: { message?: { content?: string; reasoning_content?: string } }[];
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      completion_tokens_details?: { reasoning_tokens?: number };
    };
  };
  const raw = json.choices?.[0]?.message?.content?.trim() ?? "";
  const clean = sanitizeAssistantContent(raw);

  console.log(`\nQuery   : ${query}`);
  console.log(`Model   : ${config.models.generationModel}  format=${format} temp=${temperature} freqPen=${frequencyPenalty}`);
  console.log(`Evidence: ${ctx.evidenceBlocks.length} blocks`);
  console.log(
    `Usage   : prompt=${json.usage?.prompt_tokens ?? "?"} completion=${json.usage?.completion_tokens ?? "?"} reasoning=${json.usage?.completion_tokens_details?.reasoning_tokens ?? 0} chars=${json.choices?.[0]?.message?.reasoning_content?.length ?? 0}`
  );
  console.log(`\n--- RAW (${raw.length} chars) ---\n${raw}`);
  console.log(`\n--- RENDERED (${clean.length} chars) ---\n${clean}`);
  console.log(
    `\nRefusal-like: ${/not enough information|cannot|can't|don't have|do not have|unable to/i.test(clean)}` +
      `   Nav: ${resolveNavigationActions(query, raw).map((a) => `${a.type}:${a.target}`).join(" ") || "none"}`
  );
}

main().catch((err) => {
  console.error("probe failed:", err);
  process.exit(1);
});
