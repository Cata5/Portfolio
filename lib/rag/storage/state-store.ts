import { promises as fs } from "fs";
import fsSync from "fs";
import path from "path";

import type { DeepPartial, RAGConfig } from "../types/config";

export interface PersistedRAGConfig {
  version: string;
  savedAt: number;
  /** Config overlay; the API key is deliberately never persisted. */
  config: DeepPartial<RAGConfig>;
}

/**
 * Persists the RAG engine config to `.rag/config.json` so console tuning
 * (model choice, hyperparameters, retrieval budget) survives restarts.
 *
 * Keys never touch disk: `saveConfig` strips `models.apiKey`, and callers
 * merge the overlay with defaults rather than replacing them.
 */
export class StateStore {
  private dataDir: string;

  constructor(rootDir?: string) {
    this.dataDir = path.join(rootDir || process.cwd(), ".rag");
  }

  private filePath(): string {
    return path.join(this.dataDir, "config.json");
  }

  public async saveConfig(config: RAGConfig): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      const { apiKey: _apiKey, ...safeModels } = config.models;
      const state: PersistedRAGConfig = {
        version: "1.0.0",
        savedAt: Date.now(),
        config: { ...config, models: safeModels } as DeepPartial<RAGConfig>,
      };
      await fs.writeFile(this.filePath(), JSON.stringify(state, null, 2), "utf8");
    } catch {
      // Non-fatal: config stays in memory for the lifetime of the process.
    }
  }

  /**
   * Synchronous read used at module init (config.ts is imported synchronously
   * by route handlers). Returns `null` when nothing has been persisted yet.
   */
  public loadConfigSync(): DeepPartial<RAGConfig> | null {
    try {
      const raw = fsSync.readFileSync(this.filePath(), "utf8");
      const state = JSON.parse(raw) as PersistedRAGConfig;
      return state?.config ?? null;
    } catch {
      return null;
    }
  }

  public async clearConfig(): Promise<void> {
    try {
      await fs.rm(this.filePath(), { force: true });
    } catch {
      // Nothing to clear.
    }
  }
}

export const stateStore = new StateStore();
