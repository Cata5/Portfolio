"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRAG } from "./rag-context";
import {
  Send,
  ChevronRight,
  ArrowUpRight,
  ArrowDown,
  Compass,
  X,
} from "lucide-react";
import type { ValidatedCitation } from "@/lib/rag/citations/validator";
import {
  detectNavigationActions,
  getDynamicStarterPrompts,
  getSectionLabel,
  type NavigationAction,
} from "@/lib/rag/navigation-helpers";
import {
  highlightAndScrollTo,
  isExplicitNavigationQuery,
  resolveQueryTarget,
  resolveDocumentTarget,
} from "./navigation-highlighter";
import { CLogo } from "./c-logo";
import { ThinkingIndicator } from "./thinking-indicator";
import { parseHeadingLine, sanitizeAssistantContent } from "@/lib/rag/chat-format";

/** Visitor preference: should the page follow the assistant's navigation? */
const AUTO_NAVIGATE_STORAGE_KEY = "portfolio.rag.auto-navigate";

/** Detector labels read "View X" because they double as button text. */
function noticeLabel(label: string): string {
  return label.replace(/^view\s+/i, "");
}

export function ChatView() {
  const router = useRouter();
  const { messages, sendMessage, isStreaming } = useRAG();

  const [input, setInput] = useState("");
  const [activeCitationPreview, setActiveCitationPreview] = useState<{
    msgId: string;
    citation: ValidatedCitation;
  } | null>(null);
  const [activeNavNotice, setActiveNavNotice] = useState<{
    text: string;
    auto: boolean;
  } | null>(null);
  // Read the stored preference lazily so no setState is needed after mount.
  const [autoNavigate, setAutoNavigate] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return window.localStorage.getItem(AUTO_NAVIGATE_STORAGE_KEY) !== "off";
    } catch {
      return true; // Storage unavailable (private mode) — keep the default.
    }
  });
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastAutoScrolledMsgId = useRef<string | null>(null);

  const starterCategories = useMemo(() => getDynamicStarterPrompts(), []);

  const updateAutoNavigate = useCallback((enabled: boolean) => {
    setAutoNavigate(enabled);
    try {
      window.localStorage.setItem(AUTO_NAVIGATE_STORAGE_KEY, enabled ? "on" : "off");
    } catch {
      // Storage unavailable — the preference applies for this session only.
    }
  }, []);

  // Keep the thread pinned to the newest message unless the visitor scrolled up.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && isPinnedToBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isStreaming, activeCitationPreview, isPinnedToBottom]);

  const handleMessageScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsPinnedToBottom(distanceFromBottom < 80);
  };

  const scrollToBottom = () => {
    setIsPinnedToBottom(true);
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  // Real-time dynamic auto-jump to the section an answer points at, once it
  // finishes streaming. The toggle disables it instantly, and the fallback
  // covers explicit "take me to X" commands when the model forgets its tag.
  useEffect(() => {
    if (!autoNavigate || messages.length === 0 || isStreaming) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "assistant" || lastMsg.id === "welcome") return;
    if (lastAutoScrolledMsgId.current === lastMsg.id) return;

    const prevUserMsg = messages[messages.length - 2]?.content || "";
    let action: NavigationAction | undefined =
      detectNavigationActions(prevUserMsg, lastMsg.content)[0];

    if (!action && isExplicitNavigationQuery(prevUserMsg)) {
      const target = resolveQueryTarget(prevUserMsg);
      if (target) {
        action = {
          id: `scroll-${target}`,
          label: getSectionLabel(target) ?? `#${target}`,
          type: "scroll",
          target,
        };
      }
    }
    if (!action) return;

    // Scroll targets must exist on the current page.
    if (action.type === "scroll" && !document.getElementById(action.target)) return;

    const navAction: NavigationAction = action;
    lastAutoScrolledMsgId.current = lastMsg.id;
    setActiveNavNotice({
      text:
        navAction.type === "route"
          ? `Opening ${noticeLabel(navAction.label)}`
          : `Auto-navigated to ${noticeLabel(navAction.label)}`,
      auto: true,
    });
    window.setTimeout(() => {
      highlightAndScrollTo(navAction.target, navAction.type, router);
    }, 260);
    window.setTimeout(() => setActiveNavNotice(null), 6000);
  }, [messages, isStreaming, autoNavigate, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const query = input.trim();
    setInput("");
    setActiveCitationPreview(null);
    setIsPinnedToBottom(true);

    sendMessage(query);
  };

  const handleStarterSelect = (query: string) => {
    if (isStreaming) return;
    setActiveCitationPreview(null);
    setIsPinnedToBottom(true);

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
    setActiveNavNotice({ text: `Navigated to ${noticeLabel(action.label)}`, auto: false });
    setTimeout(() => setActiveNavNotice(null), 3500);
  };

  // Manual "view matching section" jump from the evidence preview panel.
  const handleCitationJump = (citation: ValidatedCitation) => {
    const target = resolveDocumentTarget(citation.filePath);
    if (document.getElementById(target)) {
      highlightAndScrollTo(target, "scroll", router);
    } else {
      // The section lives on the landing page — route there instead.
      highlightAndScrollTo(`/#${target}`, "route", router);
    }
  };

  const parseInlineMarkdown = (
    msgId: string,
    text: string,
    citationMap: Map<number, ValidatedCitation>
  ): React.ReactNode[] => {
    // Regex matching: Citations ([1]), Bold (**bold**), Italic (*italic*), Inline Code (`code`), Links ([text](url))
    const tokenRegex =
      /(\[\d+(?:\s*,\s*\d+)*\]|\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
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
                  className={`group inline-flex items-center justify-center rounded border px-1.5 py-0.2 font-mono text-[10.5px] font-semibold transition-all cursor-pointer align-baseline ${isSelected
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

      // 3. Italic text match: *italic text* (also tames stray single-asterisk emphasis)
      if (
        part.startsWith("*") &&
        part.endsWith("*") &&
        !part.startsWith("**") &&
        part.length > 2
      ) {
        return (
          <em key={pIdx} className="italic text-foreground/90">
            {part.slice(1, -1)}
          </em>
        );
      }

      // 4. Inline code match: `code`
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

      // 5. Link match: [title](url)
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

    // 1. Strip action tags, prompt scaffolding and pseudo-header artifacts
    let text = sanitizeAssistantContent(content);

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

    // "**Label:**" / "Label:" / "### Label:" all render as section headers.
    const isLabelLine = (line: string) =>
      (line.startsWith("**") && line.endsWith("**")) || /^[A-Za-z\s()/&-]{2,40}:$/.test(line);

    // Split into structural blocks by double newlines
    const rawBlocks = text.split(/\n\n+/);

    return (
      <div className="space-y-3.5">
        {rawBlocks.map((block, bIdx) => {
          const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
          if (lines.length === 0) return null;

          const firstParsed = parseHeadingLine(lines[0]);
          const firstLine = firstParsed.heading ?? firstParsed.rest;

          // Check if block is a category header with following item lines
          const isHeaderWithItems =
            lines.length > 1 && (!!firstParsed.heading || isLabelLine(firstLine));

          const isListBlock = lines.some((l) => /^[-*•]|\d+\.\s/.test(l)) || isHeaderWithItems;

          if (isListBlock) {
            return (
              <div key={bIdx} className="space-y-1.5">
                {lines.map((line, lIdx) => {
                  // Category header line ("Primary Languages:", "**Primary
                  // Languages:**", or a "### Key Facts & Highlights:" heading)
                  // wins over the bullet check so "*"-marked bold labels glued
                  // to their item lines still render as headers.
                  const parsed = parseHeadingLine(line);
                  const labelLine = parsed.heading ?? parsed.rest;
                  if (parsed.heading || isLabelLine(labelLine)) {
                    return (
                      <div
                        key={lIdx}
                        className="font-mono text-xs 2xl:text-[13px] font-bold text-signal uppercase tracking-wide pt-2 pb-0.5"
                      >
                        {parseInlineMarkdown(
                          msgId,
                          labelLine.startsWith("**") ? labelLine : `**${labelLine}**`,
                          citationMap
                        )}
                      </div>
                    );
                  }

                  const listMatch = line.match(/^([-*•]|\d+\.)\s*(.*)$/);
                  if (listMatch) {
                    return (
                      <div
                        key={lIdx}
                        className="flex items-start gap-2 text-[13.5px] 2xl:text-[14.5px] leading-relaxed pl-1 py-0.5"
                      >
                        <div className="flex-1">
                          {parseInlineMarkdown(msgId, listMatch[2], citationMap)}
                        </div>
                      </div>
                    );
                  }

                  // Item line within category block (e.g. "TypeScript [1]")
                  return (
                    <div
                      key={lIdx}
                      className="flex items-start gap-2 text-[13.5px] 2xl:text-[14.5px] leading-relaxed pl-1 py-0.5"
                    >
                      <div className="flex-1">
                        {parseInlineMarkdown(msgId, labelLine, citationMap)}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }

          // Single category header line ("**Languages:**", "Languages:", or
          // "### Key Facts & Highlights:" as a markdown heading).
          if (lines.length === 1 && (firstParsed.heading || isLabelLine(firstLine))) {
            return (
              <div
                key={bIdx}
                className="font-mono text-xs 2xl:text-[13px] font-bold text-signal uppercase tracking-wide pt-1"
              >
                {parseInlineMarkdown(
                  msgId,
                  firstLine.startsWith("**") ? firstLine : `**${firstLine}**`,
                  citationMap
                )}
              </div>
            );
          }

          // Regular paragraph — heading markers on embedded lines are stripped
          const cleanedBlock = block
            .split("\n")
            .map((l) => {
              const lineParsed = parseHeadingLine(l);
              return lineParsed.heading ?? lineParsed.rest;
            })
            .join("\n");
          return (
            <p key={bIdx} className="leading-relaxed text-[13.5px] 2xl:text-[14.5px]">
              {parseInlineMarkdown(msgId, cleanedBlock, citationMap)}
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
          <ArrowUpRight className="size-3 shrink-0" />
          <span className="truncate">{activeNavNotice.text}</span>
          {activeNavNotice.auto && autoNavigate && (
            <button
              type="button"
              onClick={() => updateAutoNavigate(false)}
              title="Stop the page from following the assistant automatically"
              className="ml-1 shrink-0 rounded border border-signal/40 bg-signal/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-signal transition-colors hover:bg-signal/25 cursor-pointer"
            >
              Turn off
            </button>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollRef}
          onScroll={handleMessageScroll}
          data-lenis-prevent
          className="h-full overflow-y-auto overscroll-contain p-3.5 sm:p-5 2xl:p-6 space-y-4"
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
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleStarterSelect(cat.query)}
                      className="group relative flex flex-col justify-between rounded-xl border border-border/40 bg-card/30 p-3 sm:p-3.5 backdrop-blur-md transition-all duration-200 hover:border-signal/50 hover:bg-card/50 hover:shadow-lg hover:shadow-signal/10 cursor-pointer"
                    >
                      <span className="mb-1.5 block font-mono text-xs 2xl:text-sm font-semibold text-foreground group-hover:text-signal transition-colors">
                        {cat.label}
                      </span>
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
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"
                    }`}
                >
                  <div
                    className={`max-w-[94%] sm:max-w-[92%] 2xl:max-w-[88%] rounded-xl p-4 sm:p-4.5 2xl:p-5 text-[13.5px] 2xl:text-[14.5px] leading-relaxed shadow-lg ${msg.role === "user"
                      ? "bg-signal/20 border border-signal/40 text-foreground font-medium rounded-tr-none shadow-signal/5"
                      : "border border-border/50 bg-card/70 text-foreground/90 rounded-tl-none ring-1 ring-white/5"
                      }`}
                  >
                    {/* Thinking trace: live while streaming, expandable after */}
                    {msg.role === "assistant" &&
                      (msg.isStreaming || msg.stage || msg.timings) && (
                        <ThinkingIndicator
                          stage={msg.stage}
                          stageMessage={msg.stageMessage}
                          query={lastUserQuery}
                          evidence={msg.evidence}
                          hasContent={msg.content.length > 0}
                          isStreaming={!!msg.isStreaming}
                          timings={msg.timings}
                        />
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
                          <span className="font-mono text-[10px] uppercase tracking-wider text-signal font-semibold">
                            Jump to:
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {detectedActions.map((action) => (
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

                    {/* Evidence preview for the selected citation */}
                    {activeCitationPreview?.msgId === msg.id && (
                      <div className="mt-3 space-y-2 rounded-xl border border-signal/25 bg-neutral-950/50 p-3 animate-in fade-in slide-in-from-bottom-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-signal">
                            Evidence [{activeCitationPreview.citation.citationId}]
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveCitationPreview(null)}
                            title="Close evidence preview"
                            className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground cursor-pointer"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                        <div className="text-[12.5px] font-semibold text-foreground">
                          {activeCitationPreview.citation.title}
                        </div>
                        <div className="truncate font-mono text-[10px] text-muted-foreground">
                          {activeCitationPreview.citation.filePath}
                        </div>
                        <p className="line-clamp-3 text-[11.5px] leading-relaxed text-muted-foreground">
                          {activeCitationPreview.citation.preview}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCitationJump(activeCitationPreview.citation)}
                          className="inline-flex items-center gap-1 rounded-lg border border-signal/40 bg-signal/15 px-2 py-1 font-mono text-[10.5px] font-semibold text-signal transition-colors hover:bg-signal hover:text-signal-ink cursor-pointer"
                        >
                          View matching section
                          <ArrowUpRight className="size-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Jump back to the newest message when unpinned */}
        {!isPinnedToBottom && (
          <button
            type="button"
            onClick={scrollToBottom}
            title="Scroll to the newest message"
            className="absolute bottom-2 right-3 z-10 inline-flex size-7 items-center justify-center rounded-full border border-signal/40 bg-neutral-950/90 text-signal shadow-lg transition-all hover:bg-signal hover:text-signal-ink animate-in fade-in slide-in-from-bottom-1 cursor-pointer"
          >
            <ArrowDown className="size-3.5" />
          </button>
        )}
      </div>

      {/* Input Container */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-border/40 bg-card/60 p-3 sm:p-4"
      >
        {/* Auto-navigate control: lets the page follow the assistant's jumps */}
        <div className="mb-2.5 flex items-center justify-between gap-2 px-0.5">
          <span className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
            Grounded answers with verified citations
          </span>
          <button
            type="button"
            onClick={() => updateAutoNavigate(!autoNavigate)}
            aria-pressed={autoNavigate}
            title={
              autoNavigate
                ? "Auto-navigate is on — the page follows the assistant. Click to disable."
                : "Auto-navigate is off — click to let the page follow the assistant."
            }
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer ${autoNavigate
              ? "border-signal/40 bg-signal/10 text-signal"
              : "border-border/50 bg-card/20 text-muted-foreground hover:text-foreground"
              }`}
          >
            <Compass className="size-3" />
            Auto-navigate
            <span
              className={`relative h-3 w-5 rounded-full transition-colors ${autoNavigate ? "bg-signal/60" : "bg-muted"
                }`}
            >
              <span
                className={`absolute top-[2px] size-2 rounded-full bg-foreground shadow transition-all ${autoNavigate ? "left-[11px]" : "left-[2px]"
                  }`}
              />
            </span>
          </button>
        </div>
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
