/**
 * ML notebook — publishes real training runs only.
 *
 * Every run is backed by evidence found in the analyzed projects (see
 * PROJECT_ANALYSIS.md). Fields that could not be confirmed are left as "—"
 * rather than invented. Metrics like loss curves are never fabricated.
 */

export type MlRun = {
  model: string;
  dataset: string;
  framework: string;
  hardware: string;
  training: string;
  notes: string;
};

export const ml = {
  /** Field order in the notebook ledger. */
  fields: ["model", "dataset", "framework", "hardware", "training"] as const,
  runs: [
    {
      model: "YOLOv8 — car parts (2 variants: with / without side mirrors)",
      dataset: "own car-part photos",
      framework: "Ultralytics · PyTorch",
      hardware: "—",
      training: "—",
      notes:
        "Powers photo → part detection on Siteauto (utils/detect.py, inference confidence floor 0.15). Training details weren't recorded in the repo. The with/without-mirror variants exist because mirrors changed what the model saw.",
    },
    {
      model: "LoRA fine-tune — Llama 3.2 1B / Mistral 7B (Unsloth 4-bit)",
      dataset: "chat pairs (e.g. car-diagnostics data.json example)",
      framework: "Unsloth · TRL SFTTrainer · PyTorch",
      hardware: "NVIDIA GPU (CUDA, 8GB+ VRAM recommended)",
      training: "LoRA rank 8, alpha 16, dropout 0.05, lr 2e-4, batch 4 × 4 grad accum (defaults)",
      notes:
        "Defaults come from LLM Finetuner's config/default_settings.json. Training runs fully locally behind the web UI with live GPU metrics.",
    },
    {
      model: "YOLO (plates) + EasyOCR",
      dataset: "—",
      framework: "Ultralytics · EasyOCR",
      hardware: "—",
      training: "—",
      notes:
        "License-plate detection pipeline in Detectie: YOLO finds the plate, EasyOCR reads the text, results stream over WebSocket to an ESP32 client.",
    },
  ] as MlRun[],
};
