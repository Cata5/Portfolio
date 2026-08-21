import type { GroundedEvidence } from "../types/retrieval";
import { extractCitations } from "./extractor";

export interface ValidatedCitation {
  citationId: number;
  title: string;
  filePath: string;
  heading?: string;
  preview: string;
  chunkId: string;
  documentId: string;
}

export interface CitationValidationResult {
  validatedText: string;
  validCitations: ValidatedCitation[];
  invalidCitationIds: number[];
  citationAccuracy: number; // 0 to 1
}

export function validateCitations(
  generatedText: string,
  evidenceBlocks: GroundedEvidence[]
): CitationValidationResult {
  const evidenceMap = new Map<number, GroundedEvidence>();
  for (const ev of evidenceBlocks) {
    evidenceMap.set(ev.citationId, ev);
  }

  const extracted = extractCitations(generatedText);
  const validMap = new Map<number, ValidatedCitation>();
  const invalidIds = new Set<number>();
  let totalCitationRefs = 0;
  let validCitationRefs = 0;

  // Track replacement operations
  let cleanedText = generatedText;

  for (const c of extracted) {
    const validInChunk: number[] = [];

    for (const id of c.ids) {
      totalCitationRefs++;
      if (evidenceMap.has(id)) {
        validCitationRefs++;
        validInChunk.push(id);
        const ev = evidenceMap.get(id)!;
        if (!validMap.has(id)) {
          validMap.set(id, {
            citationId: id,
            title: ev.title,
            filePath: ev.filePath,
            heading: ev.heading,
            preview: ev.content.slice(0, 180).trim() + "...",
            chunkId: ev.chunkId,
            documentId: ev.documentId,
          });
        }
      } else {
        invalidIds.add(id);
      }
    }

    // If chunk contained invalid citations, fix the string in-place
    if (validInChunk.length !== c.ids.length) {
      const replacement =
        validInChunk.length > 0 ? `[${validInChunk.join(", ")}]` : "";
      cleanedText = cleanedText.replace(c.raw, replacement);
    }
  }

  // If no citations were present in answer but evidence exists, attach primary citation at end
  if (totalCitationRefs === 0 && evidenceBlocks.length > 0 && !generatedText.includes("not enough information")) {
    const primary = evidenceBlocks[0];
    cleanedText = cleanedText.trim() + ` [1]`;
    validMap.set(1, {
      citationId: 1,
      title: primary.title,
      filePath: primary.filePath,
      heading: primary.heading,
      preview: primary.content.slice(0, 180).trim() + "...",
      chunkId: primary.chunkId,
      documentId: primary.documentId,
    });
    totalCitationRefs = 1;
    validCitationRefs = 1;
  }

  const citationAccuracy =
    totalCitationRefs > 0 ? validCitationRefs / totalCitationRefs : 1.0;

  const validCitations = Array.from(validMap.values()).sort(
    (a, b) => a.citationId - b.citationId
  );

  return {
    validatedText: cleanedText,
    validCitations,
    invalidCitationIds: Array.from(invalidIds),
    citationAccuracy,
  };
}
