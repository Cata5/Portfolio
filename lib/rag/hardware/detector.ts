import os from "os";
import type { HardwareSpec } from "../types/models";

export function detectHardwareSpecs(): HardwareSpec {
  const cpus = os.cpus();
  const cpuCores = cpus.length || 4;
  const totalMem = Math.round(os.totalmem() / (1024 * 1024)); // MB
  const freeMem = Math.round(os.freemem() / (1024 * 1024)); // MB

  // Detect batch sizes based on RAM and CPU cores
  let recommendedBatchSize = 16;
  if (totalMem >= 32000 && cpuCores >= 8) {
    recommendedBatchSize = 32;
  } else if (totalMem < 8000) {
    recommendedBatchSize = 8;
  }

  let recommendedMaxContext = 3072;
  if (totalMem >= 16000) {
    recommendedMaxContext = 4096;
  } else if (totalMem < 8000) {
    recommendedMaxContext = 2048;
  }

  return {
    platform: os.platform(),
    arch: os.arch(),
    cpuCores,
    totalMemoryMB: totalMem,
    freeMemoryMB: freeMem,
    hasGpu: false, // In Node.js environment, GPU is managed by local LLM server
    recommendedBatchSize,
    recommendedMaxContext,
  };
}
