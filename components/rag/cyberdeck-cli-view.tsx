"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  ArrowUpRight,
  Radio,
  Cpu,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { highlightAndScrollTo } from "./navigation-highlighter";
import { GlitchText } from "./glitch-text";
import { useEditor } from "@/components/editor/editor-context";

interface CommandOutput {
  id: string;
  command: string;
  lines: string[];
  action?: { label: string; target: string; type: "scroll" | "route" | "external" };
  timestamp: string;
}

export function CyberdeckCliView() {
  const router = useRouter();
  const { content: cmsContent } = useEditor();
  const themes = cmsContent?.offlineThemes;

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const [history, setHistory] = useState<CommandOutput[]>(() => [
    {
      id: "init",
      command: "boot --diagnostics",
      lines: themes?.cyberdeck?.bootBanner || [
        "CATALIN MANU // NEURAL_OS v2.4 [OFFLINE STANDBY]",
        "------------------------------------------------------------",
        "[HANDSHAKE]: POST http://127.0.0.1:8000/v1 ... 503 OFFLINE",
        "[RUNTIME]: GitHub Pages Static Export (Cloud Sandboxed)",
        "[FALLBACK]: Decrypted local knowledge base into memory.",
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

  const executeCommand = (cmd: string) => {
    const raw = cmd.trim();
    if (!raw) return;
    const lower = raw.toLowerCase();
    const time = new Date().toLocaleTimeString();

    if (lower === "clear" || lower === "cls") {
      setHistory([]);
      return;
    }

    let outputLines: string[] = [];
    let action: CommandOutput["action"] | undefined = undefined;

    if (lower === "help" || lower === "?") {
      outputLines = [
        "OFFLINE CLI DIRECTORY COMMANDS:",
        "  vortex       - Flagship media player architecture & download queue",
        "  stack        - Languages, web frameworks, backend & ML competencies",
        "  contact      - Direct email, GitHub, and LinkedIn channels",
        "  projects     - List verified software projects directory",
        "  about        - Educational background (ETTI CTI Politehnica)",
        "  ml           - Machine learning models and training experiments",
        "  ping         - Ping local workstation inference daemon",
        "  clear        - Clear console buffer",
      ];
    } else if (lower.includes("vortex") || lower.includes("hardest") || lower.includes("flagship")) {
      outputLines = [
        "DOSSIER: VORTEX [FLAGSHIP CROSS-PLATFORM MEDIA STREAMER]",
        "-&gt; Codebase: Two apps sharing a Kotlin core (Phone/TV, Desktop)",
        "-&gt; Remote Storage: 5 protocols (Google Drive, SMB, SFTP, FTPS, WebDAV)",
        "• Playback Engine: Media3/ExoPlayer (Android/TV) & in-app mpv player (Windows)",
        "• Music Engine: YouTube streaming + real offline audio downloads",
        "• Downloads: Background WorkManager queue with quota auto-cleanup",
      ];
      action = { label: "Open Vortex Case Study Page", target: "/projects/vortex", type: "route" };
    } else if (lower.includes("stack") || lower.includes("skills") || lower.includes("languages")) {
      outputLines = [
        "TECHNICAL COMPETENCIES MATRIX:",
        "• Languages: TypeScript, Python, Kotlin, C++",
        "• Frontend: Next.js 16, React 19, Tailwind CSS v4, Motion, GSAP",
        "• Backend: Node.js, FastAPI, Flask, SQLite, Room (KMP)",
        "• Machine Learning: PyTorch, YOLOv8, CNNs, CUDA Acceleration",
      ];
      action = { label: "Scroll to Skills Section", target: "stack", type: "scroll" };
    } else if (lower.includes("contact") || lower.includes("email") || lower.includes("hire")) {
      outputLines = [
        "CONTACT & CHANNELS:",
        "• Email: cata.manu06@gmail.com",
        "• GitHub: https://github.com/Cata5",
        "• LinkedIn: https://www.linkedin.com/in/cata5",
        "• Location: Bucharest, Romania (POLITEHNICA University)",
      ];
      action = { label: "Scroll to Contact Form", target: "contact", type: "scroll" };
    } else if (lower.includes("projects") || lower.includes("ls")) {
      outputLines = [
        "VERIFIED PORTFOLIO DIRECTORY:",
        "1. Vortex         - Cross-platform self-hosted media player",
        "2. Aplicatie Teka - Industrial machine automation system",
        "3. Coral Tech     - Marine discovery platform",
        "4. Jarvis         - Local multi-tool assistant engine",
        "5. Detectie       - YOLOv8 computer vision detection",
      ];
      action = { label: "View All Projects", target: "projects", type: "scroll" };
    } else if (lower.includes("about") || lower.includes("education")) {
      outputLines = [
        "BACKGROUND & EDUCATION:",
        "• University: ETTI (Electronics, Telecom & IT), POLITEHNICA Bucharest",
        "• Specialization: Computer and Information Technology (CTI)",
        "• Role: Software Developer & Systems Engineer",
      ];
      action = { label: "Scroll to About Section", target: "about", type: "scroll" };
    } else if (lower.includes("ml")) {
      outputLines = [
        "MACHINE LEARNING LAB:",
        "• Models: YOLOv8 real-time object detector, custom CNN image classifiers",
        "• Frameworks: PyTorch, TorchVision, OpenCV, CUDA",
      ];
      action = { label: "View ML Notebook", target: "ml", type: "scroll" };
    } else if (lower.includes("ping")) {
      outputLines = [
        "PING 127.0.0.1:8000 (Local Workstation Daemon):",
        "• HTTP/1.1 503 Service Unavailable (ERR_CONNECTION_REFUSED)",
        "• State: Local GPU weights are offline on public GitHub Pages host.",
        "• Active Protocol: Offline verified archive fallback.",
      ];
    } else {
      outputLines = [
        `Unknown command: "${cmd}". Type 'help' for available commands.`,
      ];
    }

    setHistory((prev) => [
      ...prev,
      {
        id: `cmd_${Date.now()}`,
        command: raw,
        lines: outputLines,
        action,
        timestamp: time,
      },
    ]);
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
            <GlitchText text="NEURAL_CLI // OFFLINE_ARCHIVE" speed={20} periodicTwitch />
          </span>
        </div>
        <button
          type="button"
          onClick={() => setHistory([])}
          title="Clear console"
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
              <span className="text-[10px] text-muted-foreground ml-auto">{entry.timestamp}</span>
            </div>

            <div className="space-y-0.5 text-foreground/90 whitespace-pre-line text-xs font-mono">
              {entry.lines.map((line, lIdx) => (
                <div key={lIdx} className={line.startsWith("•") ? "pl-2 text-muted-foreground" : ""}>
                  {line}
                </div>
              ))}
            </div>

            {entry.action && (
              <div className="pt-2 border-t border-border/30">
                <button
                  type="button"
                  onClick={() => highlightAndScrollTo(entry.action!.target, entry.action!.type, router)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-signal/40 bg-signal/15 px-2.5 py-1 text-[11px] font-bold text-signal hover:bg-signal hover:text-signal-ink transition-colors cursor-pointer shadow-sm shadow-signal/15"
                >
                  <span>{entry.action.label}</span>
                  <ArrowUpRight className="size-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Shell Shortcuts */}
      <div className="border-t border-border/30 bg-card/20 px-3 py-2 flex flex-wrap gap-1.5 text-[11px] backdrop-blur-md">
        {["vortex", "stack", "contact", "projects", "ml", "ping", "help"].map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => executeCommand(cmd)}
            className="rounded-lg border border-border/50 bg-neutral-950/60 px-2.5 py-1 text-muted-foreground hover:border-signal/50 hover:text-signal transition-colors cursor-pointer"
          >
            $ {cmd}
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
          placeholder="Type command (e.g. vortex, stack, contact)..."
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
