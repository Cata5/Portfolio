"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  FileText,
  BarChart3,
  Database,
  Settings,
  ArrowLeft,
  ShieldAlert,
  Lock,
  Cpu,
  Server,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useEditor } from "@/components/editor/editor-context";
import { useRAG } from "@/components/rag/rag-context";
import { PipelineView } from "@/components/rag/pipeline-view";
import { SourceView } from "@/components/rag/source-view";
import { EvalView } from "@/components/rag/eval-view";
import { KBView } from "@/components/rag/kb-view";
import { SettingsView } from "@/components/rag/settings-view";
import { CLogo } from "@/components/rag/c-logo";
import { withBasePath } from "@/lib/base-path";

type AdminTab = "pipeline" | "source" | "eval" | "kb" | "settings";

export function RAGAdminDashboard() {
  const { isAuthenticated, unlockWithPassword } = useEditor();
  const { status, refreshDocuments, triggerReindex } = useRAG();

  const [activeTab, setActiveTab] = useState<AdminTab>("pipeline");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsSubmitting(true);
    setAuthError("");

    const res = await unlockWithPassword(password);
    setIsSubmitting(false);

    if (!res.success) {
      setAuthError(res.error || "Incorrect password");
    }
  };

  const handleManualReindex = async () => {
    setIsReindexing(true);
    try {
      await triggerReindex();
    } finally {
      setIsReindexing(false);
    }
  };

  // Locked State Gate
  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card/40 p-6 md:p-8 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 text-center space-y-6">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-border/60 bg-neutral-900/80 text-signal shadow-lg">
            <Lock className="size-6" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
              <CLogo className="size-5 text-signal" />
              <span>RAG Admin Suite</span>
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Developer tools, pipeline telemetry, and evaluation benchmarks are restricted to authorized administrators.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-3">
            <div className="space-y-1 text-left">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password..."
                className="w-full rounded-xl border border-border/60 bg-neutral-950/80 px-3.5 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-signal/80 focus:outline-none focus:ring-1 focus:ring-signal/30"
                autoFocus
              />
              {authError && (
                <p className="text-[11px] text-destructive flex items-center gap-1 font-mono pt-1">
                  <ShieldAlert className="size-3" />
                  <span>{authError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="w-full rounded-xl bg-signal py-2.5 font-mono text-xs font-semibold text-signal-ink transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-md shadow-signal/20"
            >
              {isSubmitting ? "Authenticating..." : "Unlock Admin Dashboard"}
            </button>
          </form>

          <div className="pt-2 border-t border-border/40">
            <Link
              href={withBasePath("/")}
              className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3" /> Back to Portfolio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isConnected = status?.models?.isServerConnected ?? false;
  const modelName = (status?.models?.generationModel as string) || "Gemma 4 / Qwen";
  const docCount = status?.counts?.documents ?? 0;
  const chunkCount = status?.counts?.chunks ?? 0;

  return (
    <div className="min-h-screen text-foreground pb-12 pt-4 sm:pt-6 px-3 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header Glass Card */}
      <div className="rounded-2xl border border-border/50 bg-card/40 p-4 sm:p-6 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] ring-1 ring-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={withBasePath("/")}
            title="Back to Portfolio"
            className="flex size-9 items-center justify-center rounded-xl border border-border/60 bg-neutral-900/80 text-muted-foreground hover:border-signal/40 hover:text-foreground transition-all shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`size-2 rounded-full ${
                  isConnected ? "bg-signal" : "bg-destructive"
                }`}
              />
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <CLogo className="size-4 text-signal" />
                <span>RAG Operations & Telemetry</span>
              </h1>
              <span className="rounded border border-signal/30 bg-signal/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-signal">
                ADMIN
              </span>
            </div>
            <p className="text-xs text-muted-foreground pt-0.5">
              Live retrieval execution, 5-way benchmarks, knowledge base indexing, and neural hyperparameter controls.
            </p>
          </div>
        </div>

        {/* Status Metrics Pills */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 text-muted-foreground">
            <Server className="size-3 text-signal" />
            <span>LLM:</span>
            <span className="text-foreground font-semibold truncate max-w-[130px]" title={modelName}>
              {modelName.split("/").pop()}
            </span>
            <span className={`size-1.5 rounded-full ${isConnected ? "bg-green-400" : "bg-destructive"}`} />
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 text-muted-foreground">
            <Database className="size-3 text-signal" />
            <span>Index:</span>
            <span className="text-foreground font-semibold">{docCount} docs</span>
            <span className="text-muted-foreground">({chunkCount} chunks)</span>
          </div>

          <button
            type="button"
            onClick={handleManualReindex}
            disabled={isReindexing}
            className="flex items-center gap-1.5 rounded-lg border border-signal/40 bg-signal/15 px-3 py-1.5 font-medium text-signal hover:bg-signal hover:text-signal-ink transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`size-3 ${isReindexing ? "animate-spin" : ""}`} />
            <span>{isReindexing ? "Syncing..." : "Sync Portfolio"}</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation Glass Strip */}
      <div
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-xl border border-border/40 bg-card/30 p-1.5 backdrop-blur-xl ring-1 ring-white/5"
      >
        <button
          type="button"
          onClick={() => setActiveTab("pipeline")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 font-mono text-xs font-medium transition-all cursor-pointer shrink-0 ${
            activeTab === "pipeline"
              ? "bg-signal text-signal-ink font-semibold shadow-md shadow-signal/20"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          <Layers className="size-3.5" />
          <span>Pipeline DAG & Traces</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("source")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 font-mono text-xs font-medium transition-all cursor-pointer shrink-0 ${
            activeTab === "source"
              ? "bg-signal text-signal-ink font-semibold shadow-md shadow-signal/20"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          <FileText className="size-3.5" />
          <span>Source Evidence Explorer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("eval")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 font-mono text-xs font-medium transition-all cursor-pointer shrink-0 ${
            activeTab === "eval"
              ? "bg-signal text-signal-ink font-semibold shadow-md shadow-signal/20"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          <BarChart3 className="size-3.5" />
          <span>Evaluation Studio (5-Way)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("kb")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 font-mono text-xs font-medium transition-all cursor-pointer shrink-0 ${
            activeTab === "kb"
              ? "bg-signal text-signal-ink font-semibold shadow-md shadow-signal/20"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          <Database className="size-3.5" />
          <span>Knowledge Base Manager</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 font-mono text-xs font-medium transition-all cursor-pointer shrink-0 ${
            activeTab === "settings"
              ? "bg-signal text-signal-ink font-semibold shadow-md shadow-signal/20"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          <Settings className="size-3.5" />
          <span>Hyperparameters & Models</span>
        </button>
      </div>

      {/* Main Tool Container Glass Card */}
      <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] ring-1 ring-white/10 min-h-[550px] overflow-hidden">
        {activeTab === "pipeline" && <PipelineView />}
        {activeTab === "source" && <SourceView />}
        {activeTab === "eval" && <EvalView />}
        {activeTab === "kb" && <KBView />}
        {activeTab === "settings" && <SettingsView />}
      </div>
    </div>
  );
}
