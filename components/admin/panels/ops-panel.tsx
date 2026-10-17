"use client";

import { Radio } from "lucide-react";

import { useEditor } from "@/components/editor/editor-context";
import { useRAG } from "@/components/rag/rag-context";
import { useGlitchMode, type OfflineStyle } from "@/components/rag/use-glitch-mode";
import { BASE_PATH, isGhPages } from "@/lib/base-path";
import {
  Field,
  Panel,
  ReadoutRow,
  StatusDot,
  btnGhost,
  controlClass,
  frostControl,
} from "@/components/admin/console-ui";
import { cn } from "@/lib/utils";

const PRESETS: {
  id: OfflineStyle;
  title: string;
  description: string;
}[] = [
  {
    id: "cyberpunk",
    title: "Cyberpunk CRT",
    description:
      "Frosted terminal with text-scramble decode and amber telemetry badges.",
  },
  {
    id: "holographic",
    title: "Glitched glass",
    description:
      "Matches the live site's glass UI with a simulated 503 handshake and dossier reveals.",
  },
  {
    id: "cyberdeck",
    title: "Cyber-deck CLI",
    description:
      "Interactive command shell styled to the site — vortex, stack, contact, ping.",
  },
];

export function OpsPanel() {
  const { content, updateField } = useEditor();
  const { status, setIsOpen: setChatOpen } = useRAG();
  const { isGlitchActive, isSimulated, toggleGlitchMode, offlineStyle, setOfflineStyle } =
    useGlitchMode();

  const themes = content.offlineThemes;

  return (
    <div className="space-y-5">
      <Panel
        title="Static-deploy simulation"
        description="Force the assistant into its offline standby interface to check how the GitHub Pages build behaves."
        actions={
          <>
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className={btnGhost}
            >
              <Radio className="size-3.5" />
              Open chat
            </button>
            <button
              type="button"
              onClick={() => toggleGlitchMode()}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold transition-colors",
                isSimulated
                  ? "bg-signal text-signal-ink"
                  : cn(
                      frostControl,
                      "text-muted-foreground hover:border-signal/40 hover:text-foreground",
                    ),
              )}
            >
              <Radio className="size-3.5" />
              {isSimulated ? "Simulation on" : "Simulation off"}
            </button>
          </>
        }
      >
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3 font-mono text-[11px]",
            isGlitchActive
              ? "border-signal/40 bg-signal/10 text-signal"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
          )}
        >
          <StatusDot tone={isGlitchActive ? "signal" : "positive"} />
          <span>
            Assistant state:{" "}
            <strong className="font-semibold">
              {isGlitchActive ? "offline standby" : "live local inference"}
            </strong>
          </span>
          <span className="ml-auto text-muted-foreground">
            {isSimulated
              ? "admin override"
              : isGhPages
                ? "auto-engaged by static export"
                : "local development"}
          </span>
        </div>
      </Panel>

      <Panel
        title="Standby preset"
        description="Which offline interface is shown on the static deployment."
        actions={
          <span className="rounded-full border border-signal/40 bg-signal/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-signal">
            {offlineStyle}
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PRESETS.map((preset) => {
            const active = offlineStyle === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setOfflineStyle(preset.id)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col gap-2 rounded-xl p-4 text-left transition-colors",
                  frostControl,
                  active
                    ? "border-signal/60 bg-signal/10"
                    : "hover:border-signal/40",
                )}
              >
                <span className="font-mono text-[11px] font-semibold text-foreground">
                  {preset.title}
                </span>
                <span className="text-[11px] leading-relaxed text-muted-foreground">
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel
        title="Standby copy"
        description="Every line shown in the offline interfaces while the local model is unreachable."
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-signal">
              Shared chrome
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Status badge" className="sm:col-span-2">
                <input
                  type="text"
                  value={themes?.common?.badge ?? ""}
                  onChange={(e) => updateField("offlineThemes.common.badge", e.target.value)}
                  className={controlClass}
                />
              </Field>
              <Field label="Assistant title">
                <input
                  type="text"
                  value={themes?.common?.assistantTitle ?? ""}
                  onChange={(e) =>
                    updateField("offlineThemes.common.assistantTitle", e.target.value)
                  }
                  className={controlClass}
                />
              </Field>
              <Field label="Short status">
                <input
                  type="text"
                  value={themes?.common?.status ?? ""}
                  onChange={(e) => updateField("offlineThemes.common.status", e.target.value)}
                  className={controlClass}
                />
              </Field>
              <Field label="Welcome description" className="sm:col-span-2">
                <textarea
                  rows={2}
                  value={themes?.common?.welcomeDescription ?? ""}
                  onChange={(e) =>
                    updateField("offlineThemes.common.welcomeDescription", e.target.value)
                  }
                  className={controlClass}
                />
              </Field>
              <Field label="Input placeholder">
                <input
                  type="text"
                  value={themes?.common?.inputPlaceholder ?? ""}
                  onChange={(e) =>
                    updateField("offlineThemes.common.inputPlaceholder", e.target.value)
                  }
                  className={controlClass}
                />
              </Field>
              <Field label="Footer host">
                <input
                  type="text"
                  value={themes?.common?.footerHost ?? ""}
                  onChange={(e) =>
                    updateField("offlineThemes.common.footerHost", e.target.value)
                  }
                  className={controlClass}
                />
              </Field>
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-5">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-signal">
              Glitched glass dossiers
            </h3>
            <Field label="503 banner">
              <input
                type="text"
                value={themes?.glitchedAssistant?.bannerText ?? ""}
                onChange={(e) =>
                  updateField("offlineThemes.glitchedAssistant.bannerText", e.target.value)
                }
                className={controlClass}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(
                [
                  ["vortexSummary", "Vortex summary"],
                  ["stackSummary", "Stack summary"],
                  ["contactSummary", "Contact summary"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <textarea
                    rows={4}
                    value={themes?.glitchedAssistant?.[key] ?? ""}
                    onChange={(e) =>
                      updateField(`offlineThemes.glitchedAssistant.${key}`, e.target.value)
                    }
                    className={controlClass}
                  />
                </Field>
              ))}
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-5">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-signal">
              Preset headers
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Cyberpunk telemetry header">
                <input
                  type="text"
                  value={themes?.cyberpunk?.telemetryTitle ?? ""}
                  onChange={(e) =>
                    updateField("offlineThemes.cyberpunk.telemetryTitle", e.target.value)
                  }
                  className={controlClass}
                />
              </Field>
              <Field label="Cyber-deck CLI header">
                <input
                  type="text"
                  value={themes?.cyberdeck?.headerTitle ?? ""}
                  onChange={(e) =>
                    updateField("offlineThemes.cyberdeck.headerTitle", e.target.value)
                  }
                  className={controlClass}
                />
              </Field>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel
          title="Deployment telemetry"
          description="Environment facts for the build serving this console."
        >
          <div className="space-y-3">
            <ReadoutRow
              label="Target"
              value={process.env.NEXT_PUBLIC_DEPLOY_TARGET ?? "local-dev"}
            />
            <ReadoutRow label="Base path" value={BASE_PATH || "/"} />
            <ReadoutRow label="Static export" value={isGhPages ? "yes" : "no"} />
            <ReadoutRow
              label="Backend"
              value={status?.models?.isServerConnected === true ? "connected" : "offline"}
              tone={status?.models?.isServerConnected === true ? "positive" : "muted"}
            />
          </div>
        </Panel>

        <Panel
          title="Hosting modes"
          description="What each environment can and cannot do."
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="font-mono text-[11px] font-semibold text-signal">
                Local workstation
              </span>
              <ul className="space-y-1 font-mono text-[11px] text-muted-foreground">
                <li>Full pipeline: generation, embeddings, fusion, reranking.</li>
                <li>Live index and evaluation against the real model.</li>
              </ul>
            </div>
            <div className="space-y-2 border-t border-border pt-4">
              <span className="font-mono text-[11px] font-semibold text-saffron">
                GitHub Pages
              </span>
              <ul className="space-y-1 font-mono text-[11px] text-muted-foreground">
                <li>No server: the assistant answers from the offline archive.</li>
                <li>RAG telemetry reads a fixed stub, not build-machine data.</li>
              </ul>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
