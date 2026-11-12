import mlJson from "@/content/ml.json";

export type MlRun = {
  category?: "vision" | "llm" | string;
  model: string;
  dataset: string;
  datasetUrl?: string;
  framework: string;
  hardware: string;
  training: string;
  notes: string;
};

export const ml = {
  fields: ["model", "dataset", "framework", "hardware", "training"] as const,
  hardware: mlJson.hardware,
  runs: mlJson.runs as MlRun[],
};

