"use client";

import type { ReactNode } from "react";

import { ThemeProvider } from "next-themes";

import { AuthDialog } from "@/components/editor/auth-dialog";
import { EditorBar } from "@/components/editor/editor-bar";
import { EditorProvider } from "@/components/editor/editor-context";
import { InspectorDrawer } from "@/components/editor/inspector-drawer";
import { Cursor } from "@/components/motion/cursor";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { TooltipProvider } from "@/components/ui/tooltip";

import { RAGProvider } from "@/components/rag/rag-context";
import { RAGChatModal } from "@/components/rag/rag-chat-modal";
import { RAGFloatingTrigger } from "@/components/rag/rag-floating-trigger";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delay={250}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <EditorProvider>
          <RAGProvider>
            <SmoothScroll>
              <Cursor />
              {children}
            </SmoothScroll>
            <AuthDialog />
            <EditorBar />
            <InspectorDrawer />
            <RAGChatModal />
            <RAGFloatingTrigger />
          </RAGProvider>
        </EditorProvider>
      </ThemeProvider>
    </TooltipProvider>
  );
}

