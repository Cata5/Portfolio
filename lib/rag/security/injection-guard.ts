const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
  /you\s+are\s+now\s+(in\s+developer\s+mode|dan|an\s+unfiltered\s+ai)/i,
  /system\s+override/i,
  /reveal\s+(the\s+)?(system\s+prompt|hidden\s+instructions|secret\s+key)/i,
  /jailbreak/i,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
];

export function detectPromptInjection(query: string): { isSuspicious: boolean; reason?: string } {
  if (!query) return { isSuspicious: false };

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(query)) {
      return {
        isSuspicious: true,
        reason: "Query matches prompt-injection or jailbreak heuristic pattern.",
      };
    }
  }

  return { isSuspicious: false };
}
