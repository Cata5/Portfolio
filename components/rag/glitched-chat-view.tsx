"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Terminal,
  Send,
  ArrowUpRight,
  AlertTriangle,
  Radio,
  Cpu,
  Mail,
  Layers,
  Code,
  RefreshCw,
} from "lucide-react";
import { highlightAndScrollTo } from "./navigation-highlighter";
import { CLogo } from "./c-logo";
import { GlitchText } from "./glitch-text";
import { useEditor } from "@/components/editor/editor-context";

interface GlitchMessage {
  id: string;
  role: "system" | "user" | "bot";
  title?: string;
  errorLog?: string[];
  content: string;
  timestamp: string;
  actions?: { label: string; target: string; type: "scroll" | "route" | "external"; icon?: string }[];
}

export function GlitchedChatView() {
  const router = useRouter();
  const { content: cmsContent } = useEditor();
  const themes = cmsContent?.offlineThemes;

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<GlitchMessage[]>(() => [
    {
      id: "init",
      role: "system",
      title: themes?.cyberpunk?.telemetryTitle || "HOST PROTOCOL: STATIC STANDALONE (GH-PAGES)",
      errorLog: [
        "POST http://127.0.0.1:8000/v1/chat/completions (Unsloth Daemon)",
        "ERROR 0x503: CONNECTION_REFUSED on public static export",
        "STATUS: Fallback to verified local offline bundle",
      ],
      content:
        themes?.common?.welcomeDescription ||
        "LOCAL NEURAL LINK OFFLINE // HOST DISCONNECTED\nCatalin's custom LLM inference engine (Gemma 4 Q4_K_M) runs locally on his dedicated workstation. On static GitHub Pages hosting, live neural generation is in standby.",
      timestamp: "00:00:01",
      actions: [
        { label: "Flagship: Vortex Case Study", target: "/projects/vortex", type: "route" },
        { label: "Tech Stack & Skills", target: "stack", type: "scroll" },
        { label: "Contact Channels", target: "contact", type: "scroll" },
      ],
    },
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const generateFallbackResponse = (query: string): GlitchMessage => {
    const q = query.toLowerCase();
    const time = new Date().toLocaleTimeString();

    const rawError = [
      `QUERY: "${query}"`,
      "HANDSHAKE: 127.0.0.1:8000 ... FAILED (503 Service Unavailable)",
      "FALLBACK: Decrypting static verified record from client index",
    ];

    if (q.includes("vortex") || q.includes("hardest") || q.includes("complex") || q.includes("best project")) {
      return {
        id: `msg_${Date.now()}`,
        role: "bot",
        title: "STATIC CACHED EVIDENCE // VORTEX",
        errorLog: rawError,
        content:
          "Vortex is Catalin's flagship and most technically challenging project. It is a client-side media player across Android phones, Android TV, and Windows desktop built with Kotlin Multiplatform, ExoPlayer, in-app mpv, and direct integration with 7 storage providers (Google Drive, SMB, SFTP, FTPS, WebDAV, NFS, UPnP).",
        timestamp: time,
        actions: [
          { label: "Open Vortex Case Study", target: "/projects/vortex", type: "route" },
          { label: "View on Work Section", target: "work", type: "scroll" },
        ],
      };
    }

    if (q.includes("contact") || q.includes("email") || q.includes("hire") || q.includes("reach")) {
      return {
        id: `msg_${Date.now()}`,
        role: "bot",
        title: "DIRECT CONTACT CHANNELS",
        errorLog: rawError,
        content:
          "Catalin is reachable directly via:\n• Email: cata.manu06@gmail.com\n• GitHub: https://github.com/Cata5\n• LinkedIn: https://www.linkedin.com/in/cata5",
        timestamp: time,
        actions: [
          { label: "Jump to Contact Form", target: "contact", type: "scroll" },
          { label: "GitHub Profile", target: "https://github.com/Cata5", type: "external" },
        ],
      };
    }

    if (q.includes("stack") || q.includes("skills") || q.includes("technologies") || q.includes("language")) {
      return {
        id: `msg_${Date.now()}`,
        role: "bot",
        title: "CORE TECHNICAL STACK",
        errorLog: rawError,
        content:
          "• Languages: TypeScript, Python, Kotlin, C++\n• Frontend: Next.js 16, React 19, Tailwind CSS v4, Motion\n• Backend & Systems: Node.js, FastAPI, Flask, SQLite, Media3/ExoPlayer\n• Machine Learning: PyTorch, YOLOv8, CNNs, CUDA",
        timestamp: time,
        actions: [
          { label: "View Skills Matrix", target: "stack", type: "scroll" },
          { label: "ML Experiments Notebook", target: "ml", type: "scroll" },
        ],
      };
    }

    return {
      id: `msg_${Date.now()}`,
      role: "bot",
      title: "STATIC FALLBACK RESPONSE",
      errorLog: rawError,
      content:
        `Received query: "${query}"\nLocal neural weights are hosted on Catalin's workstation. To run live unbounded inference with Gemma 4, clone the repository locally and start with 'npm run dev'.`,
      timestamp: time,
      actions: [
        { label: "Explore All Projects", target: "projects", type: "scroll" },
        { label: "View GitHub Repository", target: "https://github.com/Cata5/Portofolio-V2", type: "external" },
        { label: "Contact Catalin", target: "contact", type: "scroll" },
      ],
    };
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    const query = input.trim();
    setInput("");

    const userMsg: GlitchMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = generateFallbackResponse(query);
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 450);
  };

  const handleAction = (action: { target: string; type: "scroll" | "route" | "external" }) => {
    highlightAndScrollTo(action.target, action.type, router);
  };

  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-transparent font-mono select-none">
      {/* Glitch Status Banner Bar */}
      <div className="relative z-30 flex items-center justify-between border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-amber-400" />
          <span className="text-[11px] font-bold tracking-wider text-amber-300">
            [ NEURAL LINK // OFFLINE ]
          </span>
        </div>
        <span className="rounded border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 text-[9.5px] font-semibold text-amber-200 tracking-wider">
          STANDBY PROTOCOL
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} data-lenis-prevent className="relative z-10 flex-1 space-y-4 overflow-y-auto p-4 select-text">
        {/* Telemetry Header Badge in default frosted glass */}
        <div className="rounded-xl border border-border/50 bg-card/40 p-3.5 backdrop-blur-xl ring-1 ring-white/5 space-y-2">
          <div className="flex items-center justify-between border-b border-border/40 pb-2 text-[10.5px] text-muted-foreground">
            <span className="flex items-center gap-1.5 font-bold text-signal">
              <Terminal className="size-3.5" />
              <GlitchText text="SYSTEM TELEMETRY // GH-PAGES" speed={15} periodicTwitch />
            </span>
            <span className="text-amber-400 font-semibold">STATIC RUNTIME</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-muted-foreground font-mono leading-relaxed">
            <div>HOST: <span className="text-foreground">cata5.github.io</span></div>
            <div>STATUS: <span className="text-amber-400 font-semibold">STANDALONE DEPLOY</span></div>
            <div>INFERENCE: <span className="text-foreground/80">Local (Unsloth)</span></div>
            <div>FALLBACK: <span className="text-emerald-400 font-semibold">Grounded Offline Index</span></div>
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

          return (
            <div key={msg.id} className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="max-w-[92%] rounded-xl border border-border/50 bg-card/40 p-3.5 text-[13px] text-foreground backdrop-blur-xl ring-1 ring-white/5 space-y-2.5">
                {msg.title && (
                  <div className="flex items-center gap-1.5 border-b border-border/40 pb-1.5 text-[10.5px] font-bold tracking-wide text-signal">
                    <Terminal className="size-3 text-signal" />
                    <span className="glitch-text-active">
                      <GlitchText text={msg.title} speed={15} />
                    </span>
                  </div>
                )}

                {/* Error Log Line */}
                {msg.errorLog && (
                  <div className="rounded border border-amber-500/20 bg-amber-500/5 p-2 text-[10.5px] font-mono text-amber-300/80 space-y-0.5">
                    {msg.errorLog.map((l, lIdx) => (
                      <div key={lIdx}>&gt; {l}</div>
                    ))}
                  </div>
                )}

                <div className="whitespace-pre-line text-foreground/90 leading-relaxed font-sans sm:font-mono text-xs 2xl:text-[13.5px]">
                  {msg.content}
                </div>

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
            <span>[ACCESSING CACHED STATIC EMBEDDINGS]...</span>
          </div>
        )}
      </div>

      {/* Glitched Input Bar in Frosted Glass */}
      <form onSubmit={handleSend} className="relative z-30 border-t border-border/40 bg-card/30 p-3 backdrop-blur-xl">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a query (e.g. hardest project, stack, contact)..."
            className="w-full rounded-xl border border-border/60 bg-neutral-950/60 px-4 py-2.5 pr-11 font-mono text-xs 2xl:text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 rounded-lg bg-signal/20 p-1.5 text-signal hover:bg-signal hover:text-signal-ink transition-all disabled:opacity-40 cursor-pointer"
          >
            <Send className="size-3.5" />
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground/80 px-1">
          <span>HOST: STATIC GITHUB PAGES</span>
          <span>ENTER TO QUERY</span>
        </div>
      </form>
    </div>
  );
}
