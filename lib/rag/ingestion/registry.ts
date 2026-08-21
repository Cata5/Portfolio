import { createHash } from "crypto";
import type { Document, DocumentRegistryEntry, DocumentStatus } from "../types/document";

export function computeContentHash(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export class DocumentRegistry {
  private entries = new Map<string, DocumentRegistryEntry>();
  private documents = new Map<string, Document>();

  public register(document: Document): DocumentRegistryEntry {
    const totalTokens = document.chunks.reduce(
      (acc, c) => acc + (c.metadata.tokenCount || 0),
      0
    );

    const entry: DocumentRegistryEntry = {
      id: document.id,
      filePath: document.filePath,
      fileType: document.fileType,
      title: document.title,
      hash: document.hash,
      chunkCount: document.chunks.length,
      tokenCount: totalTokens,
      status: document.metadata.status,
      indexedAt: document.metadata.indexedAt || Date.now(),
      updatedAt: document.metadata.updatedAt || Date.now(),
      sizeBytes: document.metadata.sizeBytes || 0,
      error: document.metadata.errorMessage,
    };

    this.entries.set(document.id, entry);
    this.documents.set(document.id, document);
    return entry;
  }

  public getEntry(id: string): DocumentRegistryEntry | undefined {
    return this.entries.get(id);
  }

  public getDocument(id: string): Document | undefined {
    return this.documents.get(id);
  }

  public getAllEntries(): DocumentRegistryEntry[] {
    return Array.from(this.entries.values());
  }

  public getAllDocuments(): Document[] {
    return Array.from(this.documents.values());
  }

  public remove(id: string): boolean {
    const deleted = this.entries.delete(id);
    this.documents.delete(id);
    return deleted;
  }

  public hasChanged(id: string, currentHash: string): boolean {
    const existing = this.entries.get(id);
    if (!existing) return true;
    return existing.hash !== currentHash;
  }

  public updateStatus(id: string, status: DocumentStatus, error?: string): void {
    const entry = this.entries.get(id);
    if (entry) {
      entry.status = status;
      entry.error = error;
      entry.updatedAt = Date.now();
    }
  }

  public clear(): void {
    this.entries.clear();
    this.documents.clear();
  }

  public serialize(): { entries: DocumentRegistryEntry[] } {
    return {
      entries: Array.from(this.entries.values()),
    };
  }

  public loadEntries(entries: DocumentRegistryEntry[]): void {
    this.entries.clear();
    for (const e of entries) {
      this.entries.set(e.id, e);
    }
  }
}

export const documentRegistry = new DocumentRegistry();
