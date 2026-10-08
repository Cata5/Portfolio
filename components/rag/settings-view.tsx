"use client";

import { useRAG } from "./rag-context";
import { withBasePath } from "@/lib/base-path";
import {
  Save,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  ChevronDown,
  Sliders,
  Cpu,
  Layers,
} from "lucide-react";
import { useState, useEffect } from "react";

interface AvailableModel {
  id: string;
  name?: string;
  loaded?: boolean;
  quant?: string;
}

export function SettingsView() {
  const { config, updateConfig, fetchStatus, fetchConfig } = useRAG();

  const [baseUrl, setBaseUrl] = useState(
    config?.models?.generationBaseUrl || "http://127.0.0.1:8888/v1"
  );
  const [modelName, setModelName] = useState(
    config?.models?.generationModel || "unsloth/gemma-4-E2B-it-qat-GGUF"
  );
  const [apiKey, setApiKey] = useState(config?.models?.apiKey || "");
  const [temperature, setTemperature] = useState(config?.models?.temperature ?? 0.2);
  const [maxTokens, setMaxTokens] = useState(config?.models?.maxTokens ?? 2048);
  const [topP, setTopP] = useState(config?.models?.topP ?? 0.95);
  const [frequencyPenalty, setFrequencyPenalty] = useState(
    config?.models?.frequencyPenalty ?? 0.0
  );
  const [presencePenalty, setPresencePenalty] = useState(
    config?.models?.presencePenalty ?? 0.0
  );

  const [denseTopK, setDenseTopK] = useState(config?.retrieval?.denseTopK ?? 30);
  const [bm25TopK, setBm25TopK] = useState(config?.retrieval?.bm25TopK ?? 30);
  const [rrfK, setRrfK] = useState(config?.fusion?.rrfK ?? 60);
  const [maxContextTokens, setMaxContextTokens] = useState(
    config?.context?.maxContextTokens ?? 3072
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [reloadMessage, setReloadMessage] = useState<string | null>(null);

  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: "idle" | "testing" | "success" | "failed";
    message?: string;
  }>({ status: "idle" });

  const fetchModels = async (targetUrl = baseUrl, targetKey = apiKey) => {
    setIsLoadingModels(true);
    try {
      const res = await fetch(withBasePath("/api/rag/models"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl: targetUrl, apiKey: targetKey }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.models) && data.models.length > 0) {
        setAvailableModels(data.models);
        // If current modelName isn't in models and there is a loaded model, default to it
        if (!data.models.some((m: AvailableModel) => m.id === modelName)) {
          const loadedOne = data.models.find((m: AvailableModel) => m.loaded) || data.models[0];
          if (loadedOne) setModelName(loadedOne.id);
        }
        return { ok: true, count: data.models.length, models: data.models };
      } else {
        return { ok: false, error: data.error || "No models returned" };
      }
    } catch (err) {
      return { ok: false, error: String(err) };
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    if (config?.models) {
      if (config.models.generationBaseUrl) setBaseUrl(config.models.generationBaseUrl);
      if (config.models.generationModel) setModelName(config.models.generationModel);
      if (config.models.apiKey) setApiKey(config.models.apiKey);
      if (config.models.temperature !== undefined) setTemperature(config.models.temperature);
      if (config.models.maxTokens !== undefined) setMaxTokens(config.models.maxTokens);
      if (config.models.topP !== undefined) setTopP(config.models.topP);
      if (config.models.frequencyPenalty !== undefined)
        setFrequencyPenalty(config.models.frequencyPenalty);
      if (config.models.presencePenalty !== undefined)
        setPresencePenalty(config.models.presencePenalty);
    }
    if (config?.retrieval) {
      if (config.retrieval.denseTopK !== undefined) setDenseTopK(config.retrieval.denseTopK);
      if (config.retrieval.bm25TopK !== undefined) setBm25TopK(config.retrieval.bm25TopK);
    }
    if (config?.fusion?.rrfK !== undefined) {
      setRrfK(config.fusion.rrfK);
    }
    if (config?.context?.maxContextTokens !== undefined) {
      setMaxContextTokens(config.context.maxContextTokens);
    }
  }, [config]);

  useEffect(() => {
    fetchModels(
      config?.models?.generationBaseUrl || baseUrl,
      config?.models?.apiKey || apiKey
    );
  }, [config?.models?.generationBaseUrl, config?.models?.apiKey]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsReloading(true);
    setReloadMessage(`Applying hyperparameters & restarting model instance with Temperature: ${temperature}, MaxTokens: ${maxTokens}, Top-P: ${topP}...`);

    try {
      await updateConfig({
        models: {
          generationBaseUrl: baseUrl,
          embeddingBaseUrl: baseUrl,
          rerankerBaseUrl: baseUrl,
          generationModel: modelName,
          apiKey,
          temperature,
          maxTokens,
          topP,
          frequencyPenalty,
          presencePenalty,
        },
        retrieval: {
          denseTopK,
          bm25TopK,
        },
        fusion: {
          rrfK,
        },
        context: {
          maxContextTokens,
        },
      });

      // Explicitly trigger model reload / re-prime in Unsloth / LM Studio
      const reloadRes = await fetch(withBasePath("/api/rag/models"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl,
          apiKey,
          modelName,
          reload: true,
        }),
      });
      const reloadData = await reloadRes.json().catch(() => ({}));

      await fetchConfig?.();
      await fetchStatus?.();

      setSavedSuccess(true);
      setReloadMessage(
        reloadData?.reload?.message ||
          `Model ${modelName.split("/").pop()} successfully restarted & online with updated hyperparameters (Temp: ${temperature}, MaxTokens: ${maxTokens}, Top-P: ${topP})`
      );
    } catch (err) {
      console.error("Failed to save and reload model:", err);
      setReloadMessage("Failed to reload model instance. Check server endpoint.");
    } finally {
      setIsReloading(false);
      setTimeout(() => {
        setSavedSuccess(false);
        setReloadMessage(null);
      }, 6000);
    }
  };

  const handleTestConnection = async () => {
    setTestResult({ status: "testing" });
    const res = await fetchModels(baseUrl, apiKey);
    if (res.ok) {
      setTestResult({
        status: "success",
        message: `Connected (${res.count} model${res.count === 1 ? "" : "s"} found)`,
      });
    } else {
      setTestResult({
        status: "failed",
        message: res.error || "Connection failed",
      });
    }
    setTimeout(() => setTestResult({ status: "idle" }), 5000);
  };

  return (
    <form
      onSubmit={handleSave}
      data-lenis-prevent
      className="h-full overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-saffron">
            Model & Generation Tuning
          </span>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            Unsloth / Local LLM Hyperparameters
          </h2>
        </div>
        <button
          type="submit"
          disabled={isReloading}
          className="inline-flex items-center gap-2 rounded-lg bg-signal px-4 py-2 font-mono text-[12px] font-semibold text-signal-ink transition-opacity hover:opacity-90 cursor-pointer shadow-md shadow-signal/20 disabled:opacity-50"
        >
          {isReloading ? (
            <RefreshCw className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          {isReloading ? "Restarting Model..." : savedSuccess ? "Saved & Restarted!" : "Save & Apply Hyperparams"}
        </button>
      </div>

      {/* Live Reload Status Banner */}
      {reloadMessage && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border p-3.5 font-mono text-xs shadow-lg transition-all ${
            isReloading
              ? "border-signal/50 bg-signal/15 text-signal animate-pulse"
              : savedSuccess
              ? "border-green-500/50 bg-green-950/40 text-green-300"
              : "border-destructive/50 bg-destructive/15 text-destructive"
          }`}
        >
          {isReloading ? (
            <RefreshCw className="size-4 animate-spin shrink-0" />
          ) : savedSuccess ? (
            <CheckCircle2 className="size-4 shrink-0 text-green-400" />
          ) : (
            <XCircle className="size-4 shrink-0 text-destructive" />
          )}
          <span className="leading-snug">{reloadMessage}</span>
        </div>
      )}

      {/* Connection & Model Selection Card */}
      <div className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-4 font-mono text-[12px]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Server className="size-4 text-signal" />
            <span className="font-semibold text-foreground">Local Inference Server Endpoint</span>
          </div>

          <div className="flex items-center gap-2">
            {testResult.status === "success" && (
              <span className="inline-flex items-center gap-1 text-[11px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/30">
                <CheckCircle2 className="size-3" />
                <span>{testResult.message}</span>
              </span>
            )}
            {testResult.status === "failed" && (
              <span className="inline-flex items-center gap-1 text-[11px] text-destructive bg-destructive/10 px-2 py-0.5 rounded border border-destructive/30">
                <XCircle className="size-3" />
                <span>{testResult.message}</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testResult.status === "testing" || isLoadingModels}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-[11px] hover:border-signal hover:text-foreground cursor-pointer transition-all disabled:opacity-50"
            >
              {testResult.status === "testing" || isLoadingModels ? (
                <RefreshCw className="size-3 animate-spin text-signal" />
              ) : (
                <Server className="size-3 text-signal" />
              )}
              <span>
                {testResult.status === "testing" ? "Testing..." : "Test Connection & Fetch Models"}
              </span>
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 pt-2">
          <div>
            <label className="text-muted-foreground uppercase text-[10px]">
              OpenAI-Compatible Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://127.0.0.1:8888/v1"
              className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] text-foreground focus:border-signal focus:outline-none font-mono"
            />
            <span className="text-[10px] text-muted-foreground">
              Unsloth: 8888/v1 · LM Studio: 1234/v1
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-muted-foreground uppercase text-[10px]">Active Model</label>
              {availableModels.length > 0 && (
                <span className="text-[10px] text-signal font-mono">
                  {availableModels.length} available
                </span>
              )}
            </div>

            {availableModels.length > 0 ? (
              <div className="relative mt-1">
                <select
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border/60 bg-background px-3 py-2 pr-8 text-[12.5px] text-foreground focus:border-signal focus:outline-none font-mono cursor-pointer"
                >
                  {availableModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id} {m.quant ? `(${m.quant})` : ""} {m.loaded ? "● loaded" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-3 size-3.5 text-muted-foreground" />
              </div>
            ) : (
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="unsloth/gemma-4-E2B-it-qat-GGUF"
                className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] text-foreground focus:border-signal focus:outline-none font-mono"
              />
            )}
            <span className="text-[10px] text-muted-foreground">
              {availableModels.length > 0
                ? "Select from Unsloth loaded models"
                : "e.g. unsloth/gemma-4-E2B-it-qat-GGUF"}
            </span>
          </div>

          <div>
            <label className="text-muted-foreground uppercase text-[10px]">
              API Key (Optional / Unsloth token)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Leave empty or enter server key"
              className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] text-foreground focus:border-signal focus:outline-none font-mono"
            />
            <span className="text-[10px] text-muted-foreground">
              sk-unsloth-... or empty for LM Studio
            </span>
          </div>
        </div>
      </div>

      {/* Local LLM Generation Hyperparameters Card */}
      <div className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-4 font-mono text-[12px]">
        <div className="flex items-center gap-2">
          <Cpu className="size-4 text-signal" />
          <h3 className="font-semibold text-foreground uppercase tracking-wider text-[11px] text-saffron">
            Inference Generation Hyperparameters (Transmitted to Unsloth / LM Studio)
          </h3>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 pt-2">
          {/* Temperature */}
          <div className="rounded-lg border border-border/40 bg-background/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-muted-foreground uppercase text-[10.5px] font-semibold">
                Temperature
              </label>
              <span className="text-signal font-bold text-xs bg-signal/15 px-2 py-0.5 rounded border border-signal/30">
                {temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-signal"
            />
            <p className="text-[10px] text-muted-foreground">
              0.0 = deterministic & grounded, 0.7 = creative & expressive
            </p>
          </div>

          {/* Max Output Tokens */}
          <div className="rounded-lg border border-border/40 bg-background/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-muted-foreground uppercase text-[10.5px] font-semibold">
                Max Output Tokens
              </label>
              <span className="text-signal font-bold text-xs bg-signal/15 px-2 py-0.5 rounded border border-signal/30">
                {maxTokens}
              </span>
            </div>
            <input
              type="range"
              min="256"
              max="4096"
              step="128"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
              className="w-full accent-signal"
            />
            <p className="text-[10px] text-muted-foreground">
              Max tokens generated by the LLM per turn
            </p>
          </div>

          {/* Top-P Nucleus Sampling */}
          <div className="rounded-lg border border-border/40 bg-background/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-muted-foreground uppercase text-[10.5px] font-semibold">
                Top-P (Nucleus)
              </label>
              <span className="text-signal font-bold text-xs bg-signal/15 px-2 py-0.5 rounded border border-signal/30">
                {topP.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={topP}
              onChange={(e) => setTopP(parseFloat(e.target.value))}
              className="w-full accent-signal"
            />
            <p className="text-[10px] text-muted-foreground">
              Cumulative probability cutoff for candidate tokens
            </p>
          </div>

          {/* Frequency Penalty */}
          <div className="rounded-lg border border-border/40 bg-background/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-muted-foreground uppercase text-[10.5px] font-semibold">
                Frequency Penalty
              </label>
              <span className="text-saffron font-bold text-xs bg-saffron/15 px-2 py-0.5 rounded border border-saffron/30">
                {frequencyPenalty.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={frequencyPenalty}
              onChange={(e) => setFrequencyPenalty(parseFloat(e.target.value))}
              className="w-full accent-saffron"
            />
            <p className="text-[10px] text-muted-foreground">
              Penalizes verbatim token repetition based on frequency
            </p>
          </div>

          {/* Presence Penalty */}
          <div className="rounded-lg border border-border/40 bg-background/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-muted-foreground uppercase text-[10.5px] font-semibold">
                Presence Penalty
              </label>
              <span className="text-saffron font-bold text-xs bg-saffron/15 px-2 py-0.5 rounded border border-saffron/30">
                {presencePenalty.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={presencePenalty}
              onChange={(e) => setPresencePenalty(parseFloat(e.target.value))}
              className="w-full accent-saffron"
            />
            <p className="text-[10px] text-muted-foreground">
              Encourages introducing new topics and concepts
            </p>
          </div>

          {/* Max Context Window Budget */}
          <div className="rounded-lg border border-border/40 bg-background/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-muted-foreground uppercase text-[10.5px] font-semibold">
                Context Token Budget
              </label>
              <span className="text-signal font-bold text-xs bg-signal/15 px-2 py-0.5 rounded border border-signal/30">
                {maxContextTokens}
              </span>
            </div>
            <input
              type="range"
              min="1024"
              max="8192"
              step="256"
              value={maxContextTokens}
              onChange={(e) => setMaxContextTokens(parseInt(e.target.value, 10))}
              className="w-full accent-signal"
            />
            <p className="text-[10px] text-muted-foreground">
              Total prompt context budget allocated for evidence chunks
            </p>
          </div>
        </div>
      </div>

      {/* Retrieval & Fusion Tuning Parameters Card */}
      <div className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-4 font-mono text-[12px]">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-signal" />
          <h3 className="font-semibold text-foreground uppercase tracking-wider text-[11px] text-saffron">
            Hybrid Retrieval & Fusion Hyperparameters
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 pt-2">
          <div className="rounded-lg border border-border/40 bg-background/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-muted-foreground uppercase text-[10px]">
                Dense Vector Top-K
              </label>
              <span className="text-signal font-bold text-xs bg-signal/15 px-2 py-0.5 rounded border border-signal/30">
                {denseTopK}
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              value={denseTopK}
              onChange={(e) => setDenseTopK(parseInt(e.target.value, 10))}
              className="w-full accent-signal"
            />
          </div>

          <div className="rounded-lg border border-border/40 bg-background/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-muted-foreground uppercase text-[10px]">
                BM25 Lexical Top-K
              </label>
              <span className="text-saffron font-bold text-xs bg-saffron/15 px-2 py-0.5 rounded border border-saffron/30">
                {bm25TopK}
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              value={bm25TopK}
              onChange={(e) => setBm25TopK(parseInt(e.target.value, 10))}
              className="w-full accent-saffron"
            />
          </div>

          <div className="rounded-lg border border-border/40 bg-background/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-muted-foreground uppercase text-[10px]">
                RRF Constant k
              </label>
              <span className="text-signal font-bold text-xs bg-signal/15 px-2 py-0.5 rounded border border-signal/30">
                {rrfK}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={rrfK}
              onChange={(e) => setRrfK(parseInt(e.target.value, 10))}
              className="w-full accent-signal"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
