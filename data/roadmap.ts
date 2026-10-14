import roadmapJson from "@/content/roadmap.json";

export type RoadmapStageStatus = "done" | "current" | "planned";

export type RoadmapStage = {
  n: number;
  id: string;
  title: string;
  /** Abbreviated label under the progress rail. */
  short: string;
  /** Source file this stage lands in, when it has one. */
  file?: string;
  status: RoadmapStageStatus;
  summary: string;
  /** Concrete work items - shown for shipped and in-flight stages. */
  items: string[];
};

export type RoadmapRuntime = { label: string; value: string };

/** One recorded training run - the terminal screenshot plus what it produced. */
export type RoadmapRun = {
  n: number;
  id: string;
  /** Terse label under the stage rail. */
  short: string;
  title: string;
  /** Source file this run was produced by. */
  file?: string;
  /** Architecture line shown under the title. */
  model: string;
  /** Vocabulary line - how many symbols the model scores against. */
  tokenizer: string;
  /** Drives the rail marker: char-level runs vs the BPE run. */
  tokenizerKind: "char" | "bpe";
  /** Window / batch / steps / device, as printed in the run. */
  config: string;
  /** First and last logged cross-entropy for this run. */
  lossStart: number;
  lossEnd: number;
  /** Terminal screenshot in public/. */
  shot: string;
  /** What this stage changed about the output. */
  note: string;
  /** Text the model generated after training. */
  sample: string;
};

/** Copy for the run-comparison section on the project page. */
export type RoadmapRunsSection = {
  label: string;
  navLabel: string;
  title: string;
  intro: string;
  hint: string;
  chartLabel: string;
  chartBaseline: string;
  sampleLabel: string;
  caveat: string;
};

/**
 * The LLM from Scratch build board. Copy, runtime facts and every stage live
 * in content/roadmap.json, so the whole flagship block is editable from the
 * admin "Roadmap" tab and saved to disk like every other store.
 */
export const roadmap = roadmapJson as unknown as {
  eyebrow: string;
  intro: string;
  statusLabel: string;
  roadmapLabel: string;
  shippedLabel: string;
  ctaLabel: string;
  railLabel: string;
  buildingLabel: string;
  plannedLabel: string;
  noteLead: string;
  noteLink: string;
  runtime: RoadmapRuntime[];
  stages: RoadmapStage[];
  runsSection: RoadmapRunsSection;
  runs: RoadmapRun[];
};

export const llmRoadmap: RoadmapStage[] = roadmap.stages;
export const llmRuntime: RoadmapRuntime[] = roadmap.runtime;
export const llmRuns: RoadmapRun[] = roadmap.runs;
export const llmRunsSection: RoadmapRunsSection = roadmap.runsSection;

export function roadmapProgress(stages: RoadmapStage[]) {
  const done = stages.filter((s) => s.status === "done").length;
  const total = stages.length;
  return {
    done,
    total,
    /** Share of shipped stages, for the numeric progress readout. */
    percent: total > 0 ? (done / total) * 100 : 0,
    /** Width of the rail segment that is "lit", running up to the stage being built. */
    railPercent: total > 1 ? Math.min((done / (total - 1)) * 100, 100) : 0,
  };
}
