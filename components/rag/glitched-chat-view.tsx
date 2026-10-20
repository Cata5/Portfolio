"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  ArrowUpRight,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
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

interface GlitchMessage {
  id: string;
  role: "system" | "user" | "bot";
  title?: string;
  badge?: string;
  /** User message text. Bot answers render from `blocks`. */
  content?: string;
  blocks?: OfflineBlock[];
  sources?: OfflineSource[];
  trace?: OfflineTrace;
  errorLog?: string[];
  timestamp: string;
  actions?: OfflineAction[];
}

// Monotonic ids: `Date.now()` is impure and React may re-invoke the handlers
// that build messages, so identity comes from a counter instead of the clock.
let messageSeq = 0;
const nextId = (prefix: string) => `${prefix}_${(messageSeq += 1)}`;

export function GlitchedChatView() {
  const router = useRouter();
  const { content: cmsContent } = useEditor();
  const themes = cmsContent?.offlineThemes;

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const recordCount = corpusRecordCount(cmsContent);
  const featured = cmsContent.projects.find((project) => project.featured) ?? cmsContent.projects[0];

  const buildWelcome = (): GlitchMessage => {
    const bullets: string[] = [];
    if (cmsContent.site?.name) {
      bullets.push(`${cmsContent.site.name} — ${cmsContent.site.role ?? ""}`.trim());
    }
    if (featured) {
      bullets.push(
        `Featured build: ${featured.title}${featured.platform ? ` (${featured.platform})` : ""}`
      );
    }
    bullets.push(
      `Archive: ${recordCount} portfolio records + ${ragArchive.entries.length} pre-compiled answers`
    );
    if (cmsContent.site?.email) bullets.push(`Direct contact: ${cmsContent.site.email}`);

    const actions: OfflineAction[] = [];
    if (featured) {
      actions.push({
        id: `route-/projects/${featured.id}`,
        label: `${featured.title} Case Study`,
        type: "route",
        target: `/projects/${featured.id}`,
      });
    }
    actions.push({ id: "scroll-stack", label: "Tech Stack & Skills", type: "scroll", target: "stack" });
    actions.push({ id: "scroll-contact", label: "Contact Channels", type: "scroll", target: "contact" });

    return {
      id: "init",
      role: "system",
      title: themes?.common?.assistantTitle || "Catalin AI Guide // [STATIC ARCHIVE]",
      badge: themes?.common?.badge || "ARCHIVE MODE // STATIC MIRROR",
      errorLog: themes?.glitchedAssistant?.handshakeLog || [
        "LIVE ENGINE: local neural weights on Catalin's workstation (offline on a static host)",
        "STATIC MIRROR: pre-compiled answers + lexical search over the portfolio records",
      ],
      blocks: [
        {
          kind: "text",
          text:
            themes?.common?.welcomeDescription ||
            "This static mirror answers from a pre-compiled archive plus a lexical search over the portfolio records.",
        },
        { kind: "bullets", items: bullets },
      ],
      timestamp: "00:00:01",
      actions,
    };
  };

  const [messages, setMessages] = useState<GlitchMessage[]>(() => [buildWelcome()]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const toggleLog = (id: string) => {
    setExpandedLogs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    const query = input.trim();
    setInput("");

    const userMsg: GlitchMessage = {
      id: nextId("user"),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const answer = answerOfflineQuery(query, { source: cmsContent, archive: ragArchive });
      setMessages((prev) => [
        ...prev,
        {
          id: nextId("msg"),
          role: "bot",
          title: answer.title,
          badge: answer.badge,
          blocks: answer.blocks,
          sources: answer.sources,
          trace: answer.trace,
          actions: answer.actions,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setIsTyping(false);
    }, 120);
  };

  const handleAction = (action: { target: string; type: "scroll" | "route" | "external" }) => {
    highlightAndScrollTo(action.target, action.type, router);
  };

  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-transparent font-mono select-none">
      {/* Archive Status Banner Bar */}
      <div className="relative z-30 flex items-center justify-between border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-wider text-amber-300">
            [ ARCHIVE MODE // STATIC MIRROR ]
          </span>
        </div>
        <span className="rounded border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 text-[9.5px] font-semibold text-amber-200 tracking-wider">
          {themes?.common?.status || "ARCHIVE"}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} data-lenis-prevent className="relative z-10 flex-1 space-y-4 overflow-y-auto p-4 select-text">
        {/* Telemetry Header Badge in default frosted glass */}
        <div className="rounded-xl border border-border/50 bg-card/40 p-3.5 backdrop-blur-xl ring-1 ring-white/5 space-y-2">
          <div className="flex items-center justify-between border-b border-border/40 pb-2 text-[10.5px] text-muted-foreground">
            <span className="flex items-center gap-1.5 font-bold text-signal">
              <GlitchText
                text={themes?.cyberpunk?.telemetryTitle || "SYSTEM TELEMETRY // GH-PAGES"}
                speed={15}
                periodicTwitch
              />
            </span>
            <span className="text-amber-400 font-semibold">STATIC RUNTIME</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-muted-foreground font-mono leading-relaxed">
            <div>HOST: <span className="text-foreground">{themes?.cyberpunk?.host || "cata5.github.io"}</span></div>
            <div>STATUS: <span className="text-amber-400 font-semibold">{themes?.cyberpunk?.status || "ARCHIVE MODE"}</span></div>
            <div>INFERENCE: <span className="text-foreground/80">{themes?.cyberpunk?.inference || "Local workstation (offline here)"}</span></div>
            <div>ANSWERS: <span className="text-emerald-400 font-semibold">{themes?.cyberpunk?.fallback || "Pre-compiled + corpus search"}</span></div>
          </div>
        </div>

        {/* Message Stream */}
        {messages.map((msg) => {
          if (msg.role === "user") {
            return (
              <div key={msg.id} className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="max-w-[85%] rounded-xl border border-signal/40 bg-signal/15 p-3 text-[13px] text-foreground backdrop-blur-md">
                  <div className="mb-1 text-[10px] text-signal/80 font-bold tracking-wider">
                    OPERATOR // {msg.timestamp}
                  </div>
                  <div className="leading-relaxed">{msg.content}</div>
                </div>
              </div>
            );
          }

          const isLogOpen = expandedLogs[msg.id] || false;

          return (
            <div key={msg.id} className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="max-w-[92%] rounded-xl border border-border/50 bg-card/40 p-3.5 text-[13px] text-foreground backdrop-blur-xl ring-1 ring-white/5 space-y-2.5">
                {msg.title && (
                  <div className="flex items-center gap-1.5 border-b border-border/40 pb-1.5 text-[10.5px] font-bold tracking-wide text-signal">
                    <span className="glitch-text-active">
                      <GlitchText text={msg.title} speed={15} />
                    </span>
                    {msg.badge && (
                      <span className="ml-auto rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                        {msg.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Runtime disclosure, collapsed by default */}
                {msg.errorLog && msg.errorLog.length > 0 && (
                  <div className="rounded border border-amber-500/20 bg-amber-500/5 p-2 text-[10.5px] font-mono">
                    <button
                      type="button"
                      onClick={() => toggleLog(msg.id)}
                      className="flex w-full items-center justify-between text-amber-300/90 font-bold hover:text-amber-200 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="size-3 text-amber-400" />
                        <span>{themes?.common?.disclosureLabel || "Runtime details"}</span>
                      </span>
                      {isLogOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                    </button>
                    {isLogOpen && (
                      <div className="pt-1.5 mt-1.5 border-t border-amber-500/20 text-amber-300/80 space-y-0.5">
                        {msg.errorLog.map((line, lIdx) => (
                          <div key={lIdx}>&gt; {line}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <OfflineAnswerBody
                  variant="cyberpunk"
                  blocks={msg.blocks ?? []}
                  sources={msg.sources}
                  trace={msg.trace}
                />

                {msg.actions && msg.actions.length > 0 && (
                  <div className="pt-2 border-t border-border/30 flex flex-wrap gap-1.5">
                    {msg.actions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        type="button"
                        onClick={() => handleAction(act)}
                        className="group inline-flex items-center gap-1.5 rounded-lg border border-signal/40 bg-signal/15 px-2.5 py-1 text-[11px] font-semibold text-signal hover:bg-signal hover:text-signal-ink transition-all cursor-pointer shadow-sm"
                      >
                        <span>{act.label}</span>
                        <ArrowUpRight className="size-3 text-signal group-hover:text-signal-ink" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono animate-pulse">
            <RefreshCw className="size-3 animate-spin text-amber-400" />
            <span>[{themes?.common?.processingLabel || "Searching archive records"}]...</span>
          </div>
        )}
      </div>

      {/* Input Bar in Frosted Glass */}
      <form onSubmit={handleSend} className="relative z-30 border-t border-border/40 bg-card/30 p-3 backdrop-blur-xl">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a project, the stack, contact..."
            aria-label="Ask the portfolio archive"
            className="w-full rounded-xl border border-border/60 bg-neutral-950/60 px-4 py-2.5 pr-11 font-mono text-xs 2xl:text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            aria-label="Send question"
            className="absolute right-2 rounded-lg bg-signal/20 p-1.5 text-signal hover:bg-signal hover:text-signal-ink transition-all disabled:opacity-40 cursor-pointer"
          >
            <Send className="size-3.5" />
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground/80 px-1">
          <span>{themes?.common?.footerHost || "HOST: STATIC GITHUB PAGES"}</span>
          <span>{themes?.common?.footerAction || "ENTER TO QUERY ARCHIVE"}</span>
        </div>
      </form>
    </div>
  );
}
