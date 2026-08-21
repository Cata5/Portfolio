import { promises as fs } from "fs";
import path from "path";
import { documentRegistry } from "../ingestion/registry";

export interface PersistedRAGState {
  version: string;
  savedAt: number;
  documents: ReturnType<typeof documentRegistry.getAllEntries>;
}

export class StateStore {
  private dataDir: string;

  constructor(rootDir?: string) {
    this.dataDir = path.join(rootDir || process.cwd(), ".rag");
  }

  public async saveState(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      const state: PersistedRAGState = {
        version: "1.0.0",
        savedAt: Date.now(),
        documents: documentRegistry.getAllEntries(),
      };
      const filePath = path.join(this.dataDir, "registry.json");
      await fs.writeFile(filePath, JSON.stringify(state, null, 2), "utf8");
    } catch {
      // Disk write failure fallback
    }
  }

  public async loadState(): Promise<boolean> {
    try {
      const filePath = path.join(this.dataDir, "registry.json");
      const raw = await fs.readFile(filePath, "utf8");
      const state: PersistedRAGState = JSON.parse(raw);
      if (state && Array.isArray(state.documents)) {
        documentRegistry.loadEntries(state.documents);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const stateStore = new StateStore();
