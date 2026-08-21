import type { RetrievalQuery } from "../types/retrieval";

export function normalizeQuery(rawQuery: string): RetrievalQuery {
  if (!rawQuery) {
    return {
      rawQuery: "",
      normalizedQuery: "",
      detectedLanguage: "en",
      detectedIntent: "general",
    };
  }

  // 1. Whitespace & character cleanup
  let cleaned = rawQuery
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Strip excessive punctuation at ends
  cleaned = cleaned.replace(/^[?.,!;:~`'"-]+|[?.,!;:~`'"-]+$/g, "").trim();

  // 2. Language detection (basic Romanian / English detector for portfolio context)
  const isRomanian = /\b(proiect|despre|cum|ce|care|facut|lucrat|experienta|tehnologii|contact|unde)\b/i.test(
    cleaned
  );
  const detectedLanguage = isRomanian ? "ro" : "en";

  // 3. Intent detection
  let detectedIntent: RetrievalQuery["detectedIntent"] = "general";
  const lower = cleaned.toLowerCase();

  if (
    lower.includes("vortex") ||
    lower.includes("coral") ||
    lower.includes("teka") ||
    lower.includes("siteauto") ||
    lower.includes("liceul") ||
    lower.includes("project") ||
    lower.includes("app")
  ) {
    detectedIntent = "project_detail";
  } else if (
    lower.includes("stack") ||
    lower.includes("tech") ||
    lower.includes("language") ||
    lower.includes("framework") ||
    lower.includes("kotlin") ||
    lower.includes("react") ||
    lower.includes("python") ||
    lower.includes("next.js")
  ) {
    detectedIntent = "tech_stack";
  } else if (
    lower.includes("ml") ||
    lower.includes("model") ||
    lower.includes("train") ||
    lower.includes("yolo") ||
    lower.includes("neural") ||
    lower.includes("dataset")
  ) {
    detectedIntent = "ml_experiment";
  } else if (
    lower.includes("experience") ||
    lower.includes("journey") ||
    lower.includes("education") ||
    lower.includes("etti") ||
    lower.includes("student") ||
    lower.includes("university")
  ) {
    detectedIntent = "experience";
  } else if (
    lower.includes("code") ||
    lower.includes("function") ||
    lower.includes("symbol") ||
    lower.includes("proxy") ||
    lower.includes("stream") ||
    lower.includes("class")
  ) {
    detectedIntent = "code_lookup";
  }

  return {
    rawQuery,
    normalizedQuery: cleaned,
    detectedLanguage,
    detectedIntent,
  };
}
