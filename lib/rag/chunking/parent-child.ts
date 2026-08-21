import type { Chunk } from "../types/document";

export class ParentChildContextManager {
  private parentStore = new Map<string, { title: string; fullContent: string; headingMap: Map<string, string> }>();

  public registerParent(
    parentId: string,
    title: string,
    fullContent: string,
    sections?: { heading: string; content: string }[]
  ): void {
    const headingMap = new Map<string, string>();
    if (sections) {
      for (const sec of sections) {
        headingMap.set(sec.heading, sec.content);
      }
    }
    this.parentStore.set(parentId, { title, fullContent, headingMap });
  }

  public expandChunkContext(chunk: Chunk): string {
    const parentId = chunk.parentId || chunk.documentId;
    const parent = this.parentStore.get(parentId);
    if (!parent) return chunk.content;

    const heading = chunk.metadata.heading;
    if (heading && parent.headingMap.has(heading)) {
      const sectionContent = parent.headingMap.get(heading);
      if (sectionContent && sectionContent.length > chunk.content.length) {
        return sectionContent;
      }
    }

    return chunk.content;
  }

  public clear(): void {
    this.parentStore.clear();
  }
}

export const parentChildManager = new ParentChildContextManager();
