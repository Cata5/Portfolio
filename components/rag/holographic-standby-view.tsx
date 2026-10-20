"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Send,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { highlightAndScrollTo } from "./navigation-highlighter";
import { CLogo } from "./c-logo";
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

interface StandbyMessage {
  id: string;
  role: "user" | "bot";
  badge?: string;
  title?: string;
  /** User message text. Bot answers render from `blocks`. */
  content?: string;
  blocks?: OfflineBlock[];
  sources?: OfflineSource[];
  trace?: OfflineTrace;
  errorLog?: string[];
  actions?: OfflineAction[];
  timestamp: string;
}

// Monotonic ids: `Date.now()` is impure and React may re-invoke the handlers
// that build messages, so identity comes from a counter instead of the clock.
let messageSeq = 0;
const nextId = (prefix: string) => `${prefix}_${(messageSeq += 1)}`;

const TOPIC_CHIPS = [
  {
    label: "Flagship: Vortex",
    query: "Tell me about Vortex: how does it work and what technologies are used?",
  },
  {
    label: "Tech Stack & Skills",
    query: "What are Catalin's primary programming languages and frameworks?",
  },
  {
    label: "Contact & Channels",
    query: "How can I contact Catalin directly?",
  },
  {
    label: "Machine Learning Lab",
    query: "Which machine learning models has Catalin trained, and on what hardware?",
  },
];

export function HolographicStandbyView() {
  const router = useRouter();
  const { content: cmsContent } = useEditor();
  const themes = cmsContent?.offlineThemes;

  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const recordCount = corpusRecordCount(cmsContent);
  const featured = cmsContent.projects.find((project) => project.featured) ?? cmsContent.projects[0];

  const buildWelcome = (): StandbyMessage => {
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
      `Searchable archive: ${recordCount} portfolio records + ${ragArchive.entries.length} pre-compiled answers`
    );
    if (cmsContent.site?.email) {
      bullets.push(`Direct contact: ${cmsContent.site.email}`);
    }

    const actions: OfflineAction[] = [];
    if (featured) {
      actions.push({
        id: `route-/projects/${featured.id}`,
        label: `Open ${featured.title} Case Study`,
        type: "route",
        target: `/projects/${featured.id}`,
      });
    }
    actions.push({ id: "scroll-stack", label: "View Tech Stack Grid", type: "scroll", target: "stack" });
    actions.push({ id: "scroll-contact", label: "Contact Channels", type: "scroll", target: "contact" });

    return {
      id: "init",
      role: "bot",
      badge: themes?.common?.badge || "ARCHIVE MODE // STATIC MIRROR",
      title: themes?.common?.assistantTitle || "Catalin AI Guide // [STATIC ARCHIVE]",
      errorLog: themes?.glitchedAssistant?.handshakeLog || [
        "LIVE ENGINE: local neural weights on Catalin's workstation (not reachable from a static host)",
        "STATIC MIRROR: pre-compiled answers + lexical search over the portfolio records",
      ],
      // The header card above already carries the description; the opening
      // message shows the facts derived from the CMS instead of repeating it.
      blocks: [{ kind: "bullets", items: bullets }],
      actions,
      timestamp: "00:00:01",
    };
  };

  const [messages, setMessages] = useState<StandbyMessage[]>(() => [buildWelcome()]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const toggleErrorLog = (id: string) => {
    setExpandedLogs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isProcessing) return;
    setInput("");

    const userMsg: StandbyMessage = {
      id: nextId("user"),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    // The archive is local, so the answer is ready immediately; the timeout
    // only lets the question paint before the answer lands under it.
    setTimeout(() => {
      const answer = answerOfflineQuery(query, { source: cmsContent, archive: ragArchive });
      setMessages((prev) => [
        ...prev,
        {
          id: nextId("msg"),
          role: "bot",
          badge: answer.badge,
          title: answer.title,
          blocks: answer.blocks,
          sources: answer.sources,
          trace: answer.trace,
          actions: answer.actions,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setIsProcessing(false);
    }, 120);
  };

  const handleAction = (action: { target: string; type: "scroll" | "route" | "external" }) => {
    highlightAndScrollTo(action.target, action.type, router);
  };

  return (
    <div className="flex h-full flex-col justify-between bg-transparent font-sans">
      {/* Archive Mode Banner */}
      <div className="border-b border-amber-500/30 bg-amber-500/10 px-3.5 py-2 backdrop-blur-md flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="font-bold text-amber-300">
            {themes?.glitchedAssistant?.bannerText ||
              "[ ARCHIVE MODE // PRE-COMPILED ANSWERS + CORPUS SEARCH ]"}
          </span>
        </div>
        <span className="rounded border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 text-[9.5px] font-semibold text-amber-200 uppercase tracking-wider">
          {themes?.common?.status || "ARCHIVE"}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        data-lenis-prevent
        className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-5 2xl:p-6 space-y-4 select-text"
      >
        {/* Welcome / Initial Header Card in Default Frosted Glass */}
        <div className="mx-auto max-w-xl py-2 space-y-3.5 text-center">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md shadow-lg ring-1 ring-white/10">
            <CLogo className="size-6 text-amber-400" />
          </div>

          <div className="space-y-1">
            <h2 className="glitch-text-active text-base sm:text-lg font-bold tracking-tight text-foreground">
              <GlitchText
                text={themes?.common?.assistantTitle || "Catalin AI Guide // [STATIC ARCHIVE]"}
                speed={20}
                periodicTwitch
              />
            </h2>
            <p className="max-w-md mx-auto text-xs text-muted-foreground leading-relaxed">
              {themes?.common?.welcomeDescription ||
                "The live assistant runs local neural weights on Catalin's workstation. This static mirror answers from a pre-compiled archive plus a lexical search over the portfolio records."}
            </p>
          </div>

          {/* Preset Topic Chips matching default UI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-1">
            {TOPIC_CHIPS.map((chip, idx) => {
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(chip.query)}
                  className="group relative flex items-center justify-between rounded-xl border border-border/40 bg-card/30 p-2.5 sm:p-3 backdrop-blur-md transition-all duration-200 hover:border-signal/50 hover:bg-card/50 hover:shadow-lg hover:shadow-signal/10 cursor-pointer"
                >
                  <span className="font-mono text-xs font-semibold text-foreground group-hover:text-signal transition-colors">
                    {chip.label}
                  </span>
                  <ChevronRight className="size-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-signal shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Message Thread */}
        {messages.map((msg) => {
          if (msg.role === "user") {
            return (
              <div key={msg.id} className="flex flex-col items-end animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="max-w-[92%] rounded-2xl bg-signal/15 border border-signal/30 p-3.5 text-[13.5px] text-foreground font-medium rounded-tr-none backdrop-blur-md shadow-signal/5">
                  <div className="text-foreground">{msg.content}</div>
                </div>
              </div>
            );
          }

          const isLogOpen = expandedLogs[msg.id] || false;

          return (
            <div key={msg.id} className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="max-w-[94%] sm:max-w-[92%] rounded-2xl border border-border/40 bg-card/40 p-4 text-[13.5px] text-foreground/90 rounded-tl-none backdrop-blur-md ring-1 ring-white/5 space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between border-b border-border/40 pb-2 text-xs font-mono">
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 font-bold text-amber-300 tracking-wide text-[10px]">
                    {msg.badge || "ARCHIVE RECORD"}
                  </span>
                  <span className="text-muted-foreground text-[10.5px]">{msg.timestamp}</span>
                </div>

                {/* Glitched Response Title */}
                {msg.title && (
                  <h3 className="glitch-text-active font-mono font-bold text-sm text-foreground tracking-tight flex items-center gap-2">
                    <GlitchText text={msg.title} speed={15} />
                  </h3>
                )}

                {/* Runtime disclosure: why the live model is not answering here */}
                {msg.errorLog && msg.errorLog.length > 0 && (
                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-2.5 font-mono text-[11px] space-y-1.5">
                    <button
                      type="button"
                      onClick={() => toggleErrorLog(msg.id)}
                      className="flex items-center justify-between w-full text-amber-300/90 font-bold hover:text-amber-200 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="size-3 text-amber-400" />
                        <span>{themes?.common?.disclosureLabel || "Runtime details"}</span>
                      </span>
                      {isLogOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                    </button>

                    {isLogOpen && (
                      <div className="pt-1.5 border-t border-amber-500/20 text-muted-foreground space-y-0.5 text-[10.5px] leading-relaxed">
                        {msg.errorLog.map((line, lIdx) => (
                          <div key={lIdx} className="text-amber-200/80">&gt; {line}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Answer */}
                <OfflineAnswerBody
                  variant="holographic"
                  blocks={msg.blocks ?? []}
                  sources={msg.sources}
                  trace={msg.trace}
                />

                {/* Action Buttons */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="pt-2 border-t border-border/40 flex flex-wrap gap-2">
                    {msg.actions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        type="button"
                        onClick={() => handleAction(act)}
                        className="group inline-flex items-center gap-1.5 rounded-xl border border-signal/50 bg-signal/15 px-3 py-1.5 font-mono text-xs font-semibold text-signal hover:bg-signal hover:text-signal-ink transition-all cursor-pointer shadow-sm shadow-signal/15"
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

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 animate-pulse pl-1">
            <RefreshCw className="size-3 animate-spin text-amber-400" />
            <span>[{themes?.common?.processingLabel || "Searching archive records"}]...</span>
          </div>
        )}
      </div>

      {/* Input Search Form in Frosted Glass */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="border-t border-border/40 bg-card/30 p-3 sm:p-4 backdrop-blur-md">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={themes?.common?.inputPlaceholder || "Ask about a project, the stack, ML runs, contact..."}
            aria-label="Ask the portfolio archive"
            className="w-full rounded-xl border border-border/60 bg-neutral-950/60 px-4 py-2.5 pr-11 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            aria-label="Send question"
            className="absolute right-2 rounded-lg bg-signal/20 p-1.5 text-signal hover:bg-signal hover:text-signal-ink transition-all disabled:opacity-40 cursor-pointer"
          >
            <Send className="size-3.5" />
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground/80 px-1 font-mono">
          <span>{themes?.common?.footerHost || "HOST: STATIC GITHUB PAGES"}</span>
          <span>{themes?.common?.footerAction || "ENTER TO QUERY ARCHIVE"}</span>
        </div>
      </form>
    </div>
  );
}
