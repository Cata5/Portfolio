"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Trash2 } from "lucide-react";
import { highlightAndScrollTo } from "./navigation-highlighter";
import { GlitchText } from "./glitch-text";
import { useEditor } from "@/components/editor/editor-context";
import { OfflineAnswerBody } from "./offline-answer-body";
import { answerOfflineQuery, corpusRecordCount } from "@/lib/rag/offline/assistant";
import { ragArchive } from "@/lib/rag/offline/archive-data";
import type {
  OfflineAction,
  OfflineBlock,
  OfflineSource,
  OfflineTrace,
} from "@/lib/rag/offline/types";

interface CommandOutput {
  id: string;
  command: string;
  /** Plain output lines (shell built-ins: help, ping). */
  lines: string[];
  badge?: string;
  title?: string;
  /** Archive answer content, rendered like the other standby themes. */
  blocks?: OfflineBlock[];
  sources?: OfflineSource[];
  trace?: OfflineTrace;
  actions?: OfflineAction[];
  timestamp: string;
}

/**
 * Shell shortcuts are aliases: the labels keep the terminal feel, and each one
 * expands to the question the archive answers best (a bare "ml" would otherwise
 * match a skill group before the training records).
 */
const SHELL_COMMANDS: { label: string; query: string }[] = [
  { label: "vortex", query: "Tell me about the Vortex project and what makes it technically impressive." },
  { label: "stack", query: "What are Catalin's primary programming languages and frameworks?" },
  { label: "contact", query: "How can I contact Catalin directly?" },
  { label: "projects", query: "Summarize Catalin's portfolio for a recruiter." },
  { label: "ml", query: "Which machine learning models has Catalin trained, and on what hardware?" },
  { label: "about", query: "Who is Catalin and where does he study?" },
  { label: "ping", query: "ping" },
  { label: "help", query: "help" },
];

// Monotonic ids: `Date.now()` is impure and React may re-invoke the handlers
// that build output blocks, so identity comes from a counter instead.
let outputSeq = 0;
const nextId = (prefix: string) => `${prefix}_${(outputSeq += 1)}`;

export function CyberdeckCliView() {
  const router = useRouter();
  const { content: cmsContent } = useEditor();
  const themes = cmsContent?.offlineThemes;

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const recordCount = corpusRecordCount(cmsContent);

  const [history, setHistory] = useState<CommandOutput[]>(() => [
    {
      id: "init",
      command: "boot --diagnostics",
      lines:
        themes?.cyberdeck?.bootBanner || [
          "CATALIN MANU // PORTFOLIO CLI [ARCHIVE MODE]",
          "------------------------------------------------------------",
          "[LIVE ENGINE]: local neural weights - offline on a static host",
          "[STATIC MIRROR]: pre-compiled answers + lexical search over the portfolio records",
          "",
          "Available commands: vortex, stack, contact, projects, about, ml, ping, clear",
        ],
      timestamp: "00:00:01",
    },
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const push = (entry: CommandOutput) => setHistory((prev) => [...prev, entry]);

  const executeCommand = (cmd: string, display?: string) => {
    const raw = cmd.trim();
    if (!raw) return;
    const shown = (display ?? cmd).trim();
    const lower = shown.toLowerCase();
    const time = new Date().toLocaleTimeString();
    const id = nextId("cmd");

    if (lower === "clear" || lower === "cls") {
      setHistory([]);
      return;
    }

    if (lower === "help" || lower === "?") {
      push({
        id,
        command: shown,
        lines: [
          "ARCHIVE SHELL // BUILT-INS:",
          "  help         - this directory",
          "  ping         - archive index status",
          "  clear        - clear console buffer",
          "",
          "SHORTCUTS (any question works too):",
          "  vortex       - flagship media player dossier",
          "  stack        - languages, web, backend, ML competencies",
          "  contact      - direct email, GitHub, LinkedIn",
          "  projects     - portfolio summary for a recruiter",
          "  ml           - models trained and the hardware used",
          "  about        - background and education",
        ],
        timestamp: time,
      });
      return;
    }

    if (lower === "ping") {
      push({
        id,
        command: shown,
        lines: [
          "PING archive.local:",
          `• portfolio records indexed: ${recordCount}`,
          `• pre-compiled answers: ${ragArchive.entries.length} (${ragArchive.model})`,
          "• transport: in-browser, no network requests",
          "• live engine: Catalin's workstation only - offline on a static host",
        ],
        timestamp: time,
      });
      return;
    }

    const answer = answerOfflineQuery(raw, { source: cmsContent, archive: ragArchive });
    push({
      id,
      command: shown,
      lines: [],
      badge: answer.badge,
      title: answer.title,
      blocks: answer.blocks,
      sources: answer.sources,
      trace: answer.trace,
      actions: answer.actions,
      timestamp: time,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    executeCommand(input);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col justify-between bg-transparent font-mono text-foreground select-text">
      {/* Top CLI Header in Frosted Glass */}
      <div className="flex items-center justify-between border-b border-border/40 bg-card/30 px-4 py-2 text-xs backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="font-bold text-signal tracking-wide glitch-text-active">
            <GlitchText
              text={themes?.cyberdeck?.headerTitle || "NEURAL_CLI // OFFLINE_ARCHIVE"}
              speed={20}
              periodicTwitch
            />
          </span>
        </div>
        <button
          type="button"
          onClick={() => setHistory([])}
          title="Clear console"
          aria-label="Clear console"
          className="rounded p-1 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Trash2 className="size-3" />
        </button>
      </div>

      {/* Terminal Output Area in Frosted Glass */}
      <div ref={scrollRef} data-lenis-prevent className="flex-1 space-y-3 overflow-y-auto p-4 text-xs leading-relaxed">
        {history.map((entry) => (
          <div key={entry.id} className="rounded-xl border border-border/40 bg-card/40 p-3 backdrop-blur-md ring-1 ring-white/5 space-y-2">
            <div className="flex items-center gap-1.5 text-signal font-semibold border-b border-border/30 pb-1">
              <span className="text-signal">$</span>
              <span>{entry.command}</span>
              {entry.badge && (
                <span className="rounded bg-signal/15 px-1.5 py-0.5 text-[9px] font-bold text-signal">
                  {entry.badge}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground ml-auto">{entry.timestamp}</span>
            </div>

            {entry.lines.length > 0 && (
              <div className="space-y-0.5 text-foreground/90 whitespace-pre-line text-xs font-mono">
                {entry.lines.map((line, lIdx) => (
                  <div key={lIdx} className={line.startsWith("•") ? "pl-2 text-muted-foreground" : ""}>
                    {line}
                  </div>
                ))}
              </div>
            )}

            {entry.blocks && entry.blocks.length > 0 && (
              <OfflineAnswerBody
                variant="cyberdeck"
                blocks={entry.blocks}
                sources={entry.sources}
                trace={entry.trace}
              />
            )}

            {entry.actions && entry.actions.length > 0 && (
              <div className="pt-2 border-t border-border/30 flex flex-wrap gap-1.5">
                {entry.actions.map((action, aIdx) => (
                  <button
                    key={aIdx}
                    type="button"
                    onClick={() => highlightAndScrollTo(action.target, action.type, router)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-signal/40 bg-signal/15 px-2.5 py-1 text-[11px] font-bold text-signal hover:bg-signal hover:text-signal-ink transition-colors cursor-pointer shadow-sm shadow-signal/15"
                  >
                    <span>{action.label}</span>
                    <ArrowUpRight className="size-3" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Shell Shortcuts */}
      <div className="border-t border-border/30 bg-card/20 px-3 py-2 flex flex-wrap gap-1.5 text-[11px] backdrop-blur-md">
        {SHELL_COMMANDS.map((command) => (
          <button
            key={command.label}
            type="button"
            onClick={() => executeCommand(command.query, command.label)}
            className="rounded-lg border border-border/50 bg-neutral-950/60 px-2.5 py-1 text-muted-foreground hover:border-signal/50 hover:text-signal transition-colors cursor-pointer"
          >
            $ {command.label}
          </button>
        ))}
      </div>

      {/* Prompt Input Line */}
      <form onSubmit={handleSubmit} className="border-t border-border/40 bg-card/30 p-3 flex items-center gap-2 backdrop-blur-md">
        <span className="font-bold text-signal pl-1">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a command or any question (e.g. hardest project)..."
          aria-label="Ask the portfolio archive"
          className="flex-1 bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="rounded-lg bg-signal/20 px-3 py-1.5 text-xs font-bold text-signal hover:bg-signal hover:text-signal-ink transition-colors disabled:opacity-30 cursor-pointer"
        >
          EXEC
        </button>
      </form>
    </div>
  );
}
