"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Send,
  Radio,
  Cpu,
  Layers,
  Code,
  FolderGit2,
  Mail,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  Terminal,
  FileText,
} from "lucide-react";
import { highlightAndScrollTo } from "./navigation-highlighter";
import { CLogo } from "./c-logo";
import { GlitchText } from "./glitch-text";
import { useEditor } from "@/components/editor/editor-context";

interface GlitchOfflineMessage {
  id: string;
  role: "user" | "bot";
  query?: string;
  badge?: string;
  title?: string;
  errorLog?: string[];
  content: string;
  bullets?: string[];
  actions?: { label: string; target: string; type: "scroll" | "route" | "external" }[];
  timestamp: string;
}

const TOPIC_CHIPS = [
  {
    label: "Flagship: Vortex",
    query: "Tell me about Vortex: how does it work and what technologies are used?",
    icon: FolderGit2,
  },
  {
    label: "Tech Stack & Skills",
    query: "What are Catalin's primary programming languages and frameworks?",
    icon: Code,
  },
  {
    label: "Contact & Channels",
    query: "How can I contact Catalin directly?",
    icon: Mail,
  },
  {
    label: "Machine Learning Lab",
    query: "What machine learning models and experiments has Catalin trained?",
    icon: Cpu,
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

  const [messages, setMessages] = useState<GlitchOfflineMessage[]>(() => [
    {
      id: "init",
      role: "bot",
      badge: themes?.common?.status ? `HOST OFFLINE // ${themes.common.status}` : "HOST OFFLINE // STANDBY ARCHIVE",
      title: themes?.common?.assistantTitle || "Catalin AI Guide // [OFFLINE ARCHIVE]",
      errorLog: themes?.glitchedAssistant?.handshakeLog || [
        "POST http://127.0.0.1:8000/v1/chat/completions (Local Workstation)",
        "STATUS 503 SERVICE UNAVAILABLE (ERR_CONNECTION_REFUSED)",
        "HOST SANDBOX: cata5.github.io/Portfolio (Static Cloud Target)",
        "PROTOCOL: Auto-switched to Pre-Compiled Verified Knowledge Archive",
      ],
      content:
        themes?.common?.welcomeDescription ||
        "Local neural inference weights (Gemma 4 Q4_K_M via Unsloth) run on Catalin's workstation and are unreachable on this static GitHub Pages build. The assistant is reading from the pre-indexed portfolio knowledge archive with instant verified navigation.",
      bullets: [
        "Vortex (Cross-Platform Media Player) — Flagship systems engineering project",
        "Technical Stack: TypeScript, Python, Kotlin, Next.js 16, React 19, PyTorch",
        "Direct Contact: cata.manu06@gmail.com | github.com/Cata5 | linkedin.com/in/cata5",
      ],
      actions: [
        { label: "Open Vortex Case Study", target: "/projects/vortex", type: "route" },
        { label: "View Tech Stack Grid", target: "stack", type: "scroll" },
        { label: "Contact Channels", target: "contact", type: "scroll" },
      ],
      timestamp: "00:00:01",
    },
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const toggleErrorLog = (id: string) => {
    setExpandedLogs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const generateOfflineResponse = (query: string): GlitchOfflineMessage => {
    const q = query.toLowerCase();
    const time = new Date().toLocaleTimeString();

    const rawError = themes?.glitchedAssistant?.handshakeLog || [
      `QUERY: "${query}"`,
      "HANDSHAKE: Target http://127.0.0.1:8000/v1 ... FAILED",
      "ERROR 0x503: Workstation LLM daemon offline on static cloud hosting",
      "DECRYPT: Reading verified claim embeddings from local bundle...",
    ];

    if (q.includes("vortex") || q.includes("hardest") || q.includes("complex") || q.includes("flagship") || q.includes("best project")) {
      return {
        id: `msg_${Date.now()}`,
        role: "bot",
        badge: "VERIFIED ARCHIVE // VORTEX",
        title: "Vortex — Cross-Platform Streaming Media Player",
        errorLog: rawError,
        content:
          themes?.glitchedAssistant?.vortexSummary ||
          "Vortex is Catalin's flagship and most technically challenging project: a client-side media player across Android (phones & tablets), Android TV, and Windows desktop built with a unified Kotlin Multiplatform codebase.",
        bullets: [
          "Streams directly from 7 storage protocols: Google Drive OAuth, SMB, SFTP, FTPS, WebDAV, NFS, and UPnP",
          "Dual playback engines: Media3/ExoPlayer (Android/TV) and in-app mpv integration (Windows desktop)",
          "WorkManager background download queue with quotas, pauses, and auto-cleanup",
          "YouTube music streaming engine with background playback and real offline downloads",
        ],
        actions: [
          { label: "Open Vortex Case Study", target: "/projects/vortex", type: "route" },
          { label: "View in Featured Work", target: "work", type: "scroll" },
        ],
        timestamp: time,
      };
    }

    if (q.includes("contact") || q.includes("email") || q.includes("hire") || q.includes("reach") || q.includes("social")) {
      return {
        id: `msg_${Date.now()}`,
        role: "bot",
        badge: "VERIFIED ARCHIVE // DIRECT CHANNELS",
        title: "Catalin Manu — Direct Contact Uplink",
        errorLog: rawError,
        content:
          themes?.glitchedAssistant?.contactSummary ||
          "Catalin is open for full-time software engineering roles and high-impact internships:",
        bullets: [
          "Email: cata.manu06@gmail.com",
          "GitHub: https://github.com/Cata5",
          "LinkedIn: https://www.linkedin.com/in/cata5",
          "Location: Bucharest, Romania (ETTI POLITEHNICA University)",
        ],
        actions: [
          { label: "Scroll to Contact Form", target: "contact", type: "scroll" },
          { label: "GitHub Profile", target: "https://github.com/Cata5", type: "external" },
        ],
        timestamp: time,
      };
    }

    if (q.includes("stack") || q.includes("skill") || q.includes("language") || q.includes("technolog") || q.includes("framework")) {
      return {
        id: `msg_${Date.now()}`,
        role: "bot",
        badge: "VERIFIED ARCHIVE // TECH MATRIX",
        title: "Technical Stack & Engineering Competencies",
        errorLog: rawError,
        content:
          themes?.glitchedAssistant?.stackSummary ||
          "Core languages, web architectures, backend engines, and machine learning stacks actively used across projects:",
        bullets: [
          "Primary Languages: TypeScript, Python, Kotlin, C++",
          "Web & Frontend: Next.js 16 (App Router), React 19, Tailwind CSS v4, Motion, Base UI",
          "Backend & Systems: Node.js, FastAPI, Flask, SQLite, Room (KMP), ExoPlayer/mpv",
          "Machine Learning: PyTorch, YOLOv8 object detection, custom CNNs, CUDA Acceleration",
        ],
        actions: [
          { label: "View Full Skills Grid", target: "stack", type: "scroll" },
          { label: "ML Experiments Notebook", target: "ml", type: "scroll" },
        ],
        timestamp: time,
      };
    }

    if (q.includes("ml") || q.includes("machine learning") || q.includes("yolo") || q.includes("model") || q.includes("ai")) {
      return {
        id: `msg_${Date.now()}`,
        role: "bot",
        badge: "VERIFIED ARCHIVE // ML LAB",
        title: "Machine Learning Experiments & Vision Models",
        errorLog: rawError,
        content: "Applied machine learning notebooks, vision models, and neural experiments:",
        bullets: [
          "Custom YOLOv8 object detection and real-time bounding box segmentation",
          "CNN image classification trained on custom datasets with PyTorch & CUDA",
          "Interactive browser neural visualizer and model training loss curves",
        ],
        actions: [
          { label: "View ML Lab Section", target: "ml", type: "scroll" },
          { label: "Explore All Projects", target: "projects", type: "scroll" },
        ],
        timestamp: time,
      };
    }

    return {
      id: `msg_${Date.now()}`,
      role: "bot",
      badge: "VERIFIED ARCHIVE // FALLBACK",
      title: "Offline Static Dossier Record",
      errorLog: rawError,
      content: `Received query: "${query}"\nLocal workstation LLM inference is offline on this static GitHub Pages host. Decrypted verified facts from the bundled knowledge registry:`,
      bullets: [
        "Flagship Project: Vortex (Cross-platform Kotlin/Compose media player)",
        "Education: Computer & Information Technology (CTI) at ETTI Bucharest",
        "Primary Stack: TypeScript, Next.js, Python, Kotlin, PyTorch",
        "Direct Contact: cata.manu06@gmail.com",
      ],
      actions: [
        { label: "Explore Projects", target: "projects", type: "scroll" },
        { label: "Tech Stack", target: "stack", type: "scroll" },
        { label: "Contact Form", target: "contact", type: "scroll" },
      ],
      timestamp: time,
    };
  };

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isProcessing) return;
    setInput("");

    const userMsg: GlitchOfflineMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    setTimeout(() => {
      const response = generateOfflineResponse(query);
      setMessages((prev) => [...prev, response]);
      setIsProcessing(false);
    }, 450);
  };

  const handleAction = (action: { target: string; type: "scroll" | "route" | "external" }) => {
    highlightAndScrollTo(action.target, action.type, router);
  };

  return (
    <div className="flex h-full flex-col justify-between bg-transparent font-sans">
      {/* Real-time Embedded Glitch Notification Banner */}
      <div className="border-b border-amber-500/30 bg-amber-500/10 px-3.5 py-2 backdrop-blur-md flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-amber-400" />
          <span className="font-bold text-amber-300">
            {themes?.glitchedAssistant?.bannerText || "[ ERROR 0x503: LOCAL LLM UNREACHABLE // READING OFFLINE ARCHIVE ]"}
          </span>
        </div>
        <span className="rounded border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 text-[9.5px] font-semibold text-amber-200 uppercase tracking-wider">
          {themes?.common?.status || "STANDBY"}
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
                text={themes?.common?.assistantTitle || "Catalin AI Guide // [STANDBY]"}
                speed={20}
                periodicTwitch
              />
            </h2>
            <p className="max-w-md mx-auto text-xs text-muted-foreground leading-relaxed">
              {themes?.common?.welcomeDescription ||
                "Local workstation neural weights (Gemma 4 via Unsloth) are in standby on this static deployment. Select a topic or type any question below to decrypt the verified portfolio archive."}
            </p>
          </div>

          {/* Preset Topic Chips matching default UI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-1">
            {TOPIC_CHIPS.map((chip, idx) => {
              const Icon = chip.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(chip.query)}
                  className="group relative flex items-center justify-between rounded-xl border border-border/40 bg-card/30 p-2.5 sm:p-3 backdrop-blur-md transition-all duration-200 hover:border-signal/50 hover:bg-card/50 hover:shadow-lg hover:shadow-signal/10 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg border border-border/50 bg-neutral-950/60 p-1.5 text-muted-foreground transition-colors group-hover:text-signal group-hover:border-signal/30 shrink-0">
                      <Icon className="size-3.5" />
                    </div>
                    <span className="font-mono text-xs font-semibold text-foreground group-hover:text-signal transition-colors">
                      {chip.label}
                    </span>
                  </div>
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
                    {msg.badge || "VERIFIED OFFLINE CLAIM"}
                  </span>
                  <span className="text-muted-foreground text-[10.5px]">{msg.timestamp}</span>
                </div>

                {/* Glitched Response Title */}
                {msg.title && (
                  <h3 className="glitch-text-active font-mono font-bold text-sm text-foreground tracking-tight flex items-center gap-2">
                    <Terminal className="size-3.5 text-signal shrink-0" />
                    <GlitchText text={msg.title} speed={15} />
                  </h3>
                )}

                {/* Collapsible Network Error Log Diagnostics */}
                {msg.errorLog && msg.errorLog.length > 0 && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-2.5 font-mono text-[11px] space-y-1.5">
                    <button
                      type="button"
                      onClick={() => toggleErrorLog(msg.id)}
                      className="flex items-center justify-between w-full text-amber-300/90 font-bold hover:text-amber-200 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="size-3 text-amber-400" />
                        <span>HTTP 503 Diagnostic Handshake</span>
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

                {/* Response Text with Scramble Reveal */}
                <div className="text-foreground/90 text-xs 2xl:text-[13.5px] leading-relaxed font-sans">
                  {msg.content}
                </div>

                {/* Bullet Points */}
                {msg.bullets && msg.bullets.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {msg.bullets.map((b, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2 text-xs 2xl:text-[13px] text-muted-foreground leading-relaxed">
                        <span className="text-signal select-none font-bold">•</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                )}

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
            <span>[DECRYPTING OFFLINE KNOWLEDGE RECORD]...</span>
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
            placeholder={themes?.common?.inputPlaceholder || "Ask offline archive (e.g. hardest project, stack, contact)..."}
            className="w-full rounded-xl border border-border/60 bg-neutral-950/60 px-4 py-2.5 pr-11 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
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
