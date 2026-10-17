"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Database,
  RefreshCw,
} from "lucide-react";

import { useEditor } from "@/components/editor/editor-context";
import { useRAG } from "@/components/rag/rag-context";
import { BASE_PATH, isGhPages, withBasePath } from "@/lib/base-path";
import {
  Panel,
  ReadoutRow,
  StatTile,
  StatusDot,
  btnGhost,
  btnPrimary,
  fmt,
  frostControl,
  labelClass,
} from "@/components/admin/console-ui";
import type { AdminView } from "@/components/admin/console-views";
import { cn } from "@/lib/utils";

export function OverviewPanel({
  onNavigate,
}: {
  onNavigate: (view: AdminView) => void;
}) {
  const { content, authToken } = useEditor();
  const { status, fetchStatus, fetchConfig, triggerReindex } = useRAG();

  const [isReindexing, setIsReindexing] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const models = (status?.models ?? {}) as Record<string, unknown>;
  const hardware = (status?.hardware ?? {}) as Record<string, unknown>;
  const connected = models.isServerConnected === true;

  const documents = status?.counts?.documents;
  const chunks = status?.counts?.chunks;
  const lexicalChunks = status?.counts?.lexicalChunks;

  const sections = content.sections ?? [];
  const enabledSections = sections.filter((s) => s.enabled).length;

  const engineState = connected
    ? "Online"
    : status?.status === "auth-error"
      ? "Auth error"
      : status?.status === "model-unloaded"
        ? "No model"
        : "Offline";

  const handleReindex = async () => {
    setIsReindexing(true);
    setFeedback({ tone: "success", text: "Re-indexing the portfolio content…" });
    try {
      const outcome = await triggerReindex();
      if (outcome.ok) {
        const indexed = Number(outcome.data?.indexedCount ?? 0);
        const skipped = Number(outcome.data?.skippedCount ?? 0);
        const totalChunks = Number(outcome.data?.totalChunks ?? 0);
        setFeedback({
          tone: "success",
          text: `Synced: ${indexed} indexed, ${skipped} unchanged, ${totalChunks} chunks in the stores.`,
        });
      } else {
        setFeedback({ tone: "error", text: outcome.error || "Re-index failed." });
      }
    } finally {
      setIsReindexing(false);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  const handleRestartModel = async () => {
    setIsRestarting(true);
    setFeedback({ tone: "success", text: "Applying parameters to the local model instance…" });
    try {
      const res = await fetch(withBasePath("/api/rag/models/reload"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ reload: true }),
      });
      const data = await res.json().catch(() => ({}));
      await fetchStatus();
      await fetchConfig();
      if (!res.ok) {
        setFeedback({
          tone: "error",
          text: (data?.error as string) || `Reload request failed (HTTP ${res.status}).`,
        });
        return;
      }
      const reload = data?.reload as { status?: string; message?: string } | null | undefined;
      if (reload?.status === "success") {
        setFeedback({ tone: "success", text: reload.message || "Model reloaded." });
      } else {
        setFeedback({
          tone: "error",
          text:
            reload?.message ||
            "The server did not confirm a model reload — verify the model is loaded.",
        });
      }
    } catch {
      setFeedback({ tone: "error", text: "Couldn't reach the model server. Is it running?" });
    } finally {
      setIsRestarting(false);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Local inference"
          value={engineState}
          tone={connected ? "default" : "muted"}
          sub={fmt(models.generationModel as string, "no model reported")}
        />
        <StatTile
          label="Indexed docs"
          value={fmt(documents)}
          sub={`${fmt(chunks)} chunks · ${fmt(lexicalChunks)} lexical`}
        />
        <StatTile
          label="Page sections"
          value={enabledSections}
          sub={`${sections.length} total, ${sections.length - enabledSections} hidden`}
        />
        <StatTile
          label="Projects"
          value={content.projects?.length ?? 0}
          sub={`${content.projects?.filter((p) => p.featured).length ?? 0} featured`}
        />
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 font-mono text-[11px] ${
            feedback.tone === "error"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-signal/40 bg-signal/10 text-signal"
          }`}
        >
          <RefreshCw
            className={`size-3.5 shrink-0 ${isReindexing || isRestarting ? "animate-spin" : ""}`}
          />
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Engine */}
        <Panel
          title="Inference engine"
          description="The local model server this portfolio answers with."
          actions={
            <button
              type="button"
              onClick={handleRestartModel}
              disabled={isRestarting}
              className={btnGhost}
            >
              <RefreshCw
                className={`size-3.5 ${isRestarting ? "animate-spin" : ""}`}
              />
              Restart model
            </button>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1">
              <StatusDot tone={connected ? "positive" : "negative"} />
              <span className="font-mono text-[11px] font-semibold text-foreground">
                {connected
                  ? "Server reachable"
                  : status?.status === "auth-error"
                    ? "Server rejected the API key"
                    : status?.status === "model-unloaded"
                      ? "No model loaded"
                      : "Server unreachable"}
              </span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                {fmt(models.generationModel as string)}
              </span>
            </div>
            <ReadoutRow label="Endpoint" value={fmt(models.generationBaseUrl as string)} />
            <ReadoutRow label="Embeddings" value={fmt(models.embeddingModel as string)} />
            <ReadoutRow label="Temperature" value={fmt(models.temperature)} />
            <ReadoutRow label="Max tokens" value={fmt(models.maxTokens)} />
            <ReadoutRow label="Top-p" value={fmt(models.topP)} />
          </div>
        </Panel>

        {/* Index */}
        <Panel
          title="Retrieval index"
          description="Vector and lexical stores backing hybrid retrieval."
          actions={
            <>
              <button
                type="button"
                onClick={() => onNavigate("rag-kb")}
                className={btnGhost}
              >
                <Database className="size-3.5" />
                Open
              </button>
              <button
                type="button"
                onClick={handleReindex}
                disabled={isReindexing}
                className={btnPrimary}
              >
                <RefreshCw
                  className={`size-3.5 ${isReindexing ? "animate-spin" : ""}`}
                />
                {isReindexing ? "Syncing…" : "Sync portfolio"}
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <ReadoutRow label="Documents" value={fmt(documents)} tone="signal" />
            <ReadoutRow label="Embedded chunks" value={fmt(chunks)} />
            <ReadoutRow label="Lexical chunks" value={fmt(lexicalChunks)} />
            <ReadoutRow
              label="Cache entries"
              value={fmt(
                (status?.cache?.queries as Record<string, unknown> | undefined)?.size,
              )}
            />
            <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground">
              Syncing re-reads the content stores, re-chunks changed documents and
              refreshes both indexes. Run it after editing site content.
            </p>
          </div>
        </Panel>
      </div>

      {/* Content stores + environment */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Content stores"
          description="Read-only counts. Narrative content is edited in place on the site, not here."
          actions={
            <Link href="/" className={btnGhost}>
              <ArrowUpRight className="size-3.5" />
              Edit on site
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Projects", value: content.projects?.length ?? 0 },
              { label: "Milestones", value: content.journey?.length ?? 0 },
              { label: "ML runs", value: content.ml?.runs?.length ?? 0 },
              { label: "Activities", value: content.activities?.length ?? 0 },
              { label: "Certifications", value: content.certifications?.length ?? 0 },
              { label: "Skills groups", value: content.skills?.skillGroups?.length ?? 0 },
            ].map(({ label, value }) => (
              <div
                key={label}
                className={cn(frostControl, "rounded-xl p-3.5")}
              >
                <span className={labelClass}>{label}</span>
                <p className="mt-1.5 font-mono text-lg font-semibold tabular-nums text-foreground">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Host & hardware" description="Where this build is running.">
          <div className="space-y-3">
            <ReadoutRow
              label="Target"
              value={process.env.NEXT_PUBLIC_DEPLOY_TARGET ?? "local-dev"}
            />
            <ReadoutRow label="Base path" value={BASE_PATH || "/"} />
            <ReadoutRow
              label="Static export"
              value={isGhPages ? "yes" : "no"}
              tone={isGhPages ? "signal" : "muted"}
            />
            <div className="my-1 border-t border-border" />
            <ReadoutRow label="Platform" value={fmt(hardware.platform)} />
            <ReadoutRow label="Arch" value={fmt(hardware.arch)} />
            <ReadoutRow label="CPU cores" value={fmt(hardware.cpuCores)} />
            <ReadoutRow
              label="Memory"
              value={
                typeof hardware.totalMemoryMB === "number"
                  ? `${Math.round(hardware.totalMemoryMB / 1024)} GB`
                  : "—"
              }
            />
            <ReadoutRow label="Batch size (advisory)" value={fmt(hardware.recommendedBatchSize)} />
          </div>
        </Panel>
      </div>
    </div>
  );
}
