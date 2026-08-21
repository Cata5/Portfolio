"use client";

import { useRAG } from "./rag-context";
import { useEditor } from "@/components/editor/editor-context";
import { Dialog } from "@base-ui/react/dialog";
import {
  X,
  Trash2,
  Maximize2,
  Minimize2,
  Cpu,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { CLogo } from "./c-logo";
import { useGlitchMode } from "./use-glitch-mode";
import { GlitchedChatView } from "./glitched-chat-view";
import { HolographicStandbyView } from "./holographic-standby-view";
import { CyberdeckCliView } from "./cyberdeck-cli-view";
import { ChatView } from "./chat-view";
import { withBasePath } from "@/lib/base-path";

export function RAGChatModal() {
  const { isOpen, setIsOpen, clearMessages } = useRAG();
  const { isGlitchActive, offlineStyle } = useGlitchMode();
  const { isAuthenticated } = useEditor();
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        {/* Full backdrop only when expanded */}
        {isExpanded && (
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md transition-opacity duration-200" />
        )}

        <Dialog.Popup
          data-lenis-prevent
          className={`fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/40 shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl ring-1 ring-white/10 overscroll-contain transition-all duration-300 ${
            isExpanded
              ? "inset-3 sm:inset-6 md:inset-10 lg:inset-14 xl:inset-16 2xl:inset-20 mx-auto max-h-[92vh] max-w-5xl 2xl:max-w-6xl"
              : "bottom-3 right-3 sm:bottom-5 sm:right-5 lg:bottom-6 lg:right-6 2xl:bottom-10 2xl:right-10 w-[calc(100vw-1.5rem)] sm:w-[450px] md:w-[500px] lg:w-[560px] xl:w-[600px] 2xl:w-[680px] 3xl:w-[760px] h-[600px] sm:h-[660px] md:h-[700px] lg:h-[760px] xl:h-[800px] 2xl:h-[860px] max-h-[calc(100vh-4.5rem)] sm:max-h-[calc(100vh-5rem)] 2xl:max-h-[88vh]"
          }`}
        >
          {/* Frosted Glass Header Bar */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 px-3.5 sm:px-4.5 bg-card/30 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <span
                className={`size-2 rounded-full ${
                  isGlitchActive ? "bg-amber-400" : "bg-signal"
                }`}
              />
              <div className="flex items-center gap-1.5 font-bold text-[13.5px] tracking-tight text-foreground">
                <CLogo className={`size-4 ${isGlitchActive ? "text-amber-400" : "text-signal"}`} />
                <span>{isGlitchActive ? "Catalin AI Guide (Standby)" : "Catalin AI Guide"}</span>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearMessages}
                title="Clear conversation"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors cursor-pointer"
              >
                <Trash2 className="size-3.5" />
              </button>

              {/* Expand / Minimize Toggle */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse to Floating Window" : "Expand to Fullscreen"}
                className="hidden rounded-lg p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors cursor-pointer sm:inline-flex"
              >
                {isExpanded ? (
                  <Minimize2 className="size-3.5 text-signal" />
                ) : (
                  <Maximize2 className="size-3.5" />
                )}
              </button>

              <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground cursor-pointer">
                <X className="size-4" />
              </Dialog.Close>
            </div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-hidden">
            {isGlitchActive ? (
              offlineStyle === "cyberpunk" ? (
                <GlitchedChatView />
              ) : offlineStyle === "cyberdeck" ? (
                <CyberdeckCliView />
              ) : (
                <HolographicStandbyView />
              )
            ) : (
              <ChatView />
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
