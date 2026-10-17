/**
 * The canonical embedding provider interface lives in `types/models.ts`
 * (alongside the other provider contracts). This module re-exports it so the
 * existing `../embeddings/interface` imports keep working.
 */
export type { EmbeddingProviderHealth, IEmbeddingProvider } from "../types/models";
