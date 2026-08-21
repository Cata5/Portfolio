"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRAG } from "./rag-context";
import {
  Send,
  ChevronRight,
  ArrowUpRight,
  Code,
  Mail,
  Cpu,
  Rocket,
  Folder,
  Terminal,
  FileText,
  X,
  Layers,
  Search,
  RefreshCw,
} from "lucide-react";
import type { ValidatedCitation } from "@/lib/rag/citations/validator";
import {
  detectNavigationActions,
  getDynamicStarterPrompts,
  type NavigationAction,
} from "@/lib/rag/navigation-helpers";
import {
  highlightAndScrollTo,
  isExplicitNavigationQuery,
  resolveQueryTarget,
  resolveDocumentTarget,
} from "./navigation-highlighter";
import { CLogo } from "./c-logo";

const ICON_MAP = {
  rocket: Rocket,
  layers: Layers,
  code: Code,
  mail: Mail,
  terminal: Terminal,
  folder: Folder,
  cpu: Cpu,
};

export function ChatView() {
  const router = useRouter();
  const { messages, sendMessage, isStreaming } = useRAG();

  const [input, setInput] = useState("");
  const [activeCitationPreview, setActiveCitationPreview] = useState<{
    msgId: string;
    citation: ValidatedCitation;
  } | null>(null);
  const [activeNavNotice, setActiveNavNotice] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastAutoScrolledMsgId = useRef<string | null>(null);

  const starterCategories = useMemo(() => getDynamicStarterPrompts(), []);

  // Auto-scroll to bottom of messages inside the widget
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming, activeCitationPreview]);

  // Real-time Dynamic Auto-Jump to Section when model finishes answer (in-page scroll only)
  useEffect(() => {
    if (messages.length === 0 || isStreaming) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "assistant" || lastMsg.id === "welcome") return;
    if (lastAutoScrolledMsgId.current === lastMsg.id) return;

    const prevUserMsg = messages[messages.length - 2]?.content || "";
    const actions = detectNavigationActions(prevUserMsg, lastMsg.content);

    if (actions.length > 0) {
      lastAutoScrolledMsgId.current = lastMsg.id;
      const primaryAction = actions[0];

      if (primaryAction.type === "scroll" && document.getElementById(primaryAction.target)) {
        setActiveNavNotice(primaryAction.label);
        setTimeout(() => {
          highlightAndScrollTo(primaryAction.target, "scroll", router);
        }, 200);
        setTimeout(() => setActiveNavNotice(null), 3500);
      } else if (primaryAction.type === "route") {
        setActiveNavNotice(`Navigating to ${primaryAction.label}`);
        setTimeout(() => {
          highlightAndScrollTo(primaryAction.target, "route", router);
        }, 300);
        setTimeout(() => setActiveNavNotice(null), 3500);
      }
    }
  }, [messages, isStreaming, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const query = input.trim();
    setInput("");
    setActiveCitationPreview(null);

    sendMessage(query);
  };

  const handleStarterSelect = (query: string) => {
    if (isStreaming) return;
    setActiveCitationPreview(null);

    sendMessage(query);
  };

  const handleCitationClick = (msgId: string, citation: ValidatedCitation) => {
    if (
      activeCitationPreview?.msgId === msgId &&
      activeCitationPreview.citation.citationId === citation.citationId
    ) {
      setActiveCitationPreview(null);
    } else {
      setActiveCitationPreview({ msgId, citation });
    }
  };

  const handleActionClick = (action: NavigationAction) => {
    highlightAndScrollTo(action.target, action.type, router);
    setActiveNavNotice(`Navigated to ${action.label}`);
    setTimeout(() => setActiveNavNotice(null), 3500);
  };

  const parseInlineMarkdown = (
    msgId: string,
    text: string,
    citationMap: Map<number, ValidatedCitation>
  ): React.ReactNode[] => {
    // Regex matching: Citations ([1]), Bold (**bold**), Inline Code (`code`), Links ([text](url))
    const tokenRegex = /(\[\d+(?:\s*,\s*\d+)*\]|\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, pIdx) => {
      if (!part) return null;

      // 1. Citation match: [1] or [1, 2]
      const citMatch = part.match(/^\[(\d+(?:\s*,\s*\d+)*)\]$/);
      if (citMatch) {
        const ids = citMatch[1].split(",").map((s) => parseInt(s.trim(), 10));
        return (
          <span key={pIdx} className="inline-flex gap-1 align-baseline mx-0.5">
            {ids.map((id) => {
              const cit = citationMap.get(id);
              const isSelected =
                activeCitationPreview?.msgId === msgId &&
                activeCitationPreview.citation.citationId === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => cit && handleCitationClick(msgId, cit)}
                  title={cit ? `${cit.title} (${cit.filePath})` : `Evidence [${id}]`}
                  className={`group inline-flex items-center justify-center rounded border px-1.5 py-0.2 font-mono text-[10.5px] font-semibold transition-all cursor-pointer align-baseline ${
                    isSelected
                      ? "border-signal bg-signal text-signal-ink shadow-sm shadow-signal/30"
                      : "border-signal/40 bg-signal/15 text-signal hover:bg-signal hover:text-signal-ink"
                  }`}
                >
                  [{id}]
                </button>
              );
            })}
          </span>
        );
      }

      // 2. Bold text match: **bold text**
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        const inner = part.slice(2, -2);
        return (
          <strong key={pIdx} className="font-semibold text-foreground">
            {parseInlineMarkdown(msgId, inner, citationMap)}
          </strong>
        );
      }

      // 3. Inline code match: `code`
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        const code = part.slice(1, -1);
        return (
          <code
            key={pIdx}
            className="rounded border border-border/50 bg-neutral-950/70 px-1.5 py-0.5 font-mono text-[12px] text-signal font-semibold"
          >
            {code}
          </code>
        );
      }

      // 4. Link match: [title](url)
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const href = linkMatch[2];
        const isInternal = href.startsWith("/");
        if (isInternal) {
          return (
            <button
              key={pIdx}
              type="button"
              onClick={() => highlightAndScrollTo(href, "route", router)}
              className="font-medium text-signal underline underline-offset-2 hover:opacity-80 cursor-pointer inline-flex items-center gap-0.5"
            >
              {linkMatch[1]}
              <ArrowUpRight className="size-3 inline opacity-70" />
            </button>
          );
        }

        return (
          <a
            key={pIdx}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-signal underline underline-offset-2 hover:opacity-80 inline-flex items-center gap-0.5"
          >
            {linkMatch[1]}
            <ArrowUpRight className="size-3 inline opacity-70" />
          </a>
        );
      }

      return <span key={pIdx}>{part}</span>;
    });
  };

  const renderContentWithCitations = (
    msgId: string,
    content: string,
    citations?: ValidatedCitation[]
  ) => {
    const citationMap = new Map(citations?.map((c) => [c.citationId, c]) || []);

    // 1. Strip [ACTION: ...] tags
    let text = content.replace(/\[ACTION:[^\]]+\]/gi, "").trim();

    // 2. Fix orphan punctuation on separate lines caused by citation spacing (e.g. "[1]\n," or "\n,")
    text = text.replace(/(\[\d+(?:\s*,\s*\d+)*\])\s*\n+\s*([,.;:!?])/g, "$1$2 ");
    text = text.replace(/([^\n])\s*\n+\s*([,.;:!?])/g, "$1$2 ");
    text = text.replace(/\n\s*([,.;:!?])\s*/g, "$1 ");

    // 3. Separate inline list bullets attached to bold headers (e.g. "**Languages:** * TypeScript")
    text = text.replace(/(\*\*[^*]+:\*\*)\s*([*-]|\d+\.)\s*/g, "$1\n$2 ");

    // 4. Separate multiple bullets concatenated on one line (e.g. "* item 1. * item 2.")
    text = text.replace(/([^\n])\s+([*-]|\d+\.)\s+/g, "$1\n$2 ");

    // 5. Ensure category headers ending in a colon are isolated as structural blocks
    text = text.replace(/([^\n])\n+([A-Za-z\s()/-]{2,35}:)\s*\n+/g, "$1\n\n$2\n");

    // Split into structural blocks by double newlines
    const rawBlocks = text.split(/\n\n+/);

    return (
      <div className="space-y-3.5">
        {rawBlocks.map((block, bIdx) => {
          const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
          if (lines.length === 0) return null;

          // Check if block is a category header with following item lines
          const isHeaderWithItems =
            lines.length > 1 &&
            ((lines[0].startsWith("**") && lines[0].endsWith("**")) ||
              /^[A-Za-z\s()/-]{2,35}:$/.test(lines[0]));

          const isListBlock = lines.some((l) => /^[-*•]|\d+\.\s/.test(l)) || isHeaderWithItems;

          if (isListBlock) {
            return (
              <div key={bIdx} className="space-y-1.5">
                {lines.map((line, lIdx) => {
                  const listMatch = line.match(/^([-*•]|\d+\.)\s*(.*)$/);
                  if (listMatch) {
                    return (
                      <div
                        key={lIdx}
                        className="flex items-start gap-2 text-[13.5px] 2xl:text-[14.5px] leading-relaxed pl-1 py-0.5"
                      >
                        <span className="text-signal select-none font-bold pt-0.5">•</span>
                        <div className="flex-1">
                          {parseInlineMarkdown(msgId, listMatch[2], citationMap)}
                        </div>
                      </div>
                    );
                  }

                  // Category Header line (e.g. "Primary Languages:" or "**Primary Languages:**")
                  if (
                    (line.startsWith("**") && line.endsWith("**")) ||
                    /^[A-Za-z\s()/-]{2,35}:$/.test(line)
                  ) {
                    return (
                      <div
                        key={lIdx}
                        className="font-mono text-xs 2xl:text-[13px] font-bold text-signal uppercase tracking-wide pt-2 pb-0.5"
                      >
                        {parseInlineMarkdown(
                          msgId,
                          line.startsWith("**") ? line : `**${line}**`,
                          citationMap
                        )}
                      </div>
                    );
                  }

                  // Item line within category block (e.g. "TypeScript [1]")
                  return (
                    <div
                      key={lIdx}
                      className="flex items-start gap-2 text-[13.5px] 2xl:text-[14.5px] leading-relaxed pl-1 py-0.5"
                    >
                      <span className="text-signal select-none font-bold pt-0.5">•</span>
                      <div className="flex-1">
                        {parseInlineMarkdown(msgId, line, citationMap)}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }

          // Single category header line (e.g. "**Languages:**" or "Languages:")
          if (
            lines.length === 1 &&
            ((lines[0].startsWith("**") && lines[0].endsWith("**")) ||
              /^[A-Za-z\s()/-]{2,35}:$/.test(lines[0]))
          ) {
            return (
              <div
                key={bIdx}
                className="font-mono text-xs 2xl:text-[13px] font-bold text-signal uppercase tracking-wide pt-1"
              >
                {parseInlineMarkdown(
                  msgId,
                  lines[0].startsWith("**") ? lines[0] : `**${lines[0]}**`,
                  citationMap
                )}
              </div>
            );
          }

          // Regular paragraph
          return (
            <p key={bIdx} className="leading-relaxed text-[13.5px] 2xl:text-[14.5px]">
              {parseInlineMarkdown(msgId, block, citationMap)}
            </p>
          );
        })}
      </div>
    );
  };

  const isInitialWelcome = messages.length === 1 && messages[0].id === "welcome";

  return (
    <div className="flex h-full flex-col justify-between bg-transparent">
      {/* Real-time Embedded Navigation Notification Banner */}
      {activeNavNotice && (
        <div className="bg-signal/15 border-b border-signal/30 px-3.5 py-1.5 text-center font-mono text-[11px] text-signal font-medium flex items-center justify-center gap-1.5 animate-in fade-in slide-in-from-top-1">
          <ArrowUpRight className="size-3" />
          <span>{activeNavNotice}</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        data-lenis-prevent
        className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-5 2xl:p-6 space-y-4"
      >
        {/* Visitor Friendly Welcome Card in Frosted Glass */}
        {isInitialWelcome && (
          <div className="mx-auto max-w-xl py-3 space-y-4 text-center sm:py-4">
            <div className="inline-flex size-12 2xl:size-14 items-center justify-center rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md shadow-lg ring-1 ring-white/10">
              <CLogo className="size-6 text-signal" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base sm:text-lg 2xl:text-xl font-bold tracking-tight text-foreground">
                Catalin AI Portfolio Guide
              </h2>
              <p className="max-w-xs sm:max-w-md mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Grounded conversational intelligence with verified citations and automatic background section navigation.
              </p>
            </div>

            {/* Dynamic Starter Action Cards in Frosted Glass */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-2">
              {starterCategories.map((cat, idx) => {
                const Icon = (cat.icon && ICON_MAP[cat.icon as keyof typeof ICON_MAP]) || Rocket;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleStarterSelect(cat.query)}
                    className="group relative flex flex-col justify-between rounded-xl border border-border/40 bg-card/30 p-3 sm:p-3.5 backdrop-blur-md transition-all duration-200 hover:border-signal/50 hover:bg-card/50 hover:shadow-lg hover:shadow-signal/10 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="rounded-lg border border-border/50 bg-neutral-950/60 p-2 text-muted-foreground transition-colors group-hover:text-signal group-hover:border-signal/30 shrink-0">
                        <Icon className="size-4" />
                      </div>
                      <span className="font-mono text-xs 2xl:text-sm font-semibold text-foreground group-hover:text-signal transition-colors">
                        {cat.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1 text-[11px] text-muted-foreground">
                      <span className="truncate max-w-[200px]">{cat.query}</span>
                      <ChevronRight className="size-3.5 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-signal shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Message Thread */}
        {!isInitialWelcome &&
          messages.map((msg, msgIdx) => {
            const lastUserQuery = messages[msgIdx - 1]?.content || "";
            const detectedActions =
              msg.role === "assistant" && !msg.isStreaming
                ? detectNavigationActions(lastUserQuery, msg.content)
                : [];

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[94%] sm:max-w-[92%] 2xl:max-w-[88%] rounded-2xl p-4 sm:p-4.5 2xl:p-5 text-[13.5px] 2xl:text-[14.5px] leading-relaxed backdrop-blur-md shadow-lg ${
                    msg.role === "user"
                      ? "bg-signal/15 border border-signal/30 text-foreground font-medium rounded-tr-none shadow-signal/5"
                      : "border border-border/40 bg-card/40 text-foreground/90 rounded-tl-none ring-1 ring-white/5"
                  }`}
                >
                  {/* Stage Progress while streaming */}
                  {msg.isStreaming && msg.stage && (
                    <div className="mb-3 flex items-center gap-2 border-b border-border/40 pb-2 font-mono text-xs text-muted-foreground">
                      <RefreshCw className="size-3 text-signal animate-spin" />
                      <span className="text-signal font-medium">{msg.stageMessage || "Thinking..."}</span>
                    </div>
                  )}

                  {/* Message Content */}
                  <div>
                    {msg.role === "assistant"
                      ? renderContentWithCitations(msg.id, msg.content, msg.citations)
                      : msg.content}
                  </div>

                  {/* Clean Navigation Actions */}
                  {detectedActions.length > 0 && (
                    <div className="mt-3.5 border-t border-border/40 pt-2.5 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Layers className="size-3 text-signal" />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-signal font-semibold">
                          Embedded Action — View on Portfolio:
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {detectedActions.map((action, aIdx) => (
                          <button
                            key={action.id}
                            type="button"
                            onClick={() => handleActionClick(action)}
                            className="group inline-flex items-center gap-1.5 rounded-lg border border-signal/40 bg-signal/15 px-3 py-1.5 text-left transition-all hover:bg-signal hover:text-signal-ink shadow-sm shadow-signal/10 cursor-pointer"
                          >
                            <span className="font-mono text-xs font-semibold text-foreground group-hover:text-signal-ink">
                              {action.label}
                            </span>
                            <ArrowUpRight className="size-3.5 text-signal group-hover:text-signal-ink opacity-80" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Frosted Glass Input Container */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-border/40 bg-card/30 p-3 sm:p-4 backdrop-blur-md"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about projects, stack, ML runs..."
            disabled={isStreaming}
            className="w-full rounded-xl border border-border/60 bg-neutral-950/70 px-4 py-3 pr-12 font-mono text-xs 2xl:text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-signal/80 focus:bg-neutral-950/90 focus:outline-none focus:ring-1 focus:ring-signal/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 flex size-8 items-center justify-center rounded-lg bg-signal text-signal-ink transition-all hover:opacity-90 disabled:opacity-30 cursor-pointer shadow-md shadow-signal/20"
          >
            <Send className="size-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
