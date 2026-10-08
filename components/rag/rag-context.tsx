"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { isGhPages, withBasePath } from "@/lib/base-path";
import type { ValidatedCitation } from "@/lib/rag/citations/validator";
import type { GroundedEvidence, RetrievalDiagnostics } from "@/lib/rag/types/retrieval";
import type { PipelineTimings, RAGPipelineStage } from "@/lib/rag/types/events";
import type { BenchmarkComparison } from "@/lib/rag/types/evaluation";
import type { DocumentRegistryEntry } from "@/lib/rag/types/document";
import type { DeepPartial, RAGConfig } from "@/lib/rag/types/config";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: ValidatedCitation[];
  evidence?: GroundedEvidence[];
  diagnostics?: RetrievalDiagnostics;
  timings?: PipelineTimings;
  stage?: RAGPipelineStage;
  stageMessage?: string;
  isStreaming?: boolean;
  timestamp: number;
}

export interface SystemStatusData {
  status: string;
  hardware: Record<string, unknown>;
  models: Record<string, unknown>;
  counts: {
    documents: number;
    chunks: number;
    lexicalChunks: number;
  };
  cache: {
    queries: Record<string, unknown>;
  };
}

interface RAGContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeTab: "chat" | "pipeline" | "source" | "eval" | "kb" | "settings";
  setActiveTab: (tab: "chat" | "pipeline" | "source" | "eval" | "kb" | "settings") => void;
  messages: ChatMessage[];
  sendMessage: (query: string) => Promise<void>;
  clearMessages: () => void;
  selectedEvidence: GroundedEvidence | null;
  setSelectedEvidence: (ev: GroundedEvidence | null) => void;
  selectedCitation: ValidatedCitation | null;
  setSelectedCitation: (cit: ValidatedCitation | null) => void;
  diagnostics: RetrievalDiagnostics | null;
  status: SystemStatusData | null;
  config: RAGConfig | null;
  updateConfig: (patch: DeepPartial<RAGConfig>) => Promise<void>;
  fetchStatus: () => Promise<void>;
  fetchConfig: () => Promise<void>;
  documents: DocumentRegistryEntry[];
  refreshDocuments: () => Promise<void>;
  triggerReindex: () => Promise<void>;
  evalComparison: BenchmarkComparison | null;
  runEvaluation: () => Promise<void>;
  isEvaluating: boolean;
  isStreaming: boolean;
}

const RAGContext = createContext<RAGContextType | null>(null);

export function RAGProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "pipeline" | "source" | "eval" | "kb" | "settings">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am Catalin's Portfolio AI Assistant, powered by a local-first RAG pipeline. Ask me anything about Catalin's projects (like Vortex, Teka, Coral Tech), tech stack, ML experiments, or experience!",
      timestamp: 0,
    },
  ]);

  const [selectedEvidence, setSelectedEvidence] = useState<GroundedEvidence | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<ValidatedCitation | null>(null);
  const [diagnostics, setDiagnostics] = useState<RetrievalDiagnostics | null>(null);
  const [status, setStatus] = useState<SystemStatusData | null>(null);
  const [config, setConfig] = useState<RAGConfig | null>(null);
  const [documents, setDocuments] = useState<DocumentRegistryEntry[]>([]);
  const [evalComparison, setEvalComparison] = useState<BenchmarkComparison | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(withBasePath("/api/rag/status"));
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // Ignore
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(withBasePath("/api/rag/config"));
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
      }
    } catch {
      // Ignore
    }
  }, []);

  const refreshDocuments = useCallback(async () => {
    try {
      const res = await fetch(withBasePath("/api/rag/documents"));
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch {
      // Ignore
    }
  }, []);

  const triggerReindex = useCallback(async () => {
    try {
      const res = await fetch(withBasePath("/api/rag/reindex"), { method: "POST" });
      if (res.ok) {
        await refreshDocuments();
        await fetchStatus();
      }
    } catch {
      // Ignore
    }
  }, [refreshDocuments, fetchStatus]);

  const updateConfig = useCallback(async (patch: DeepPartial<RAGConfig>) => {
    try {
      const res = await fetch(withBasePath("/api/rag/config"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
      }
    } catch {
      // Ignore
    }
  }, []);

  const runEvaluation = useCallback(async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch(withBasePath("/api/rag/eval"), { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setEvalComparison(data.comparison);
      }
    } catch (err) {
      console.error("Eval failed:", err);
    } finally {
      setIsEvaluating(false);
    }
  }, []);

  // Keyboard shortcut listener: ⌘Shift+J / Ctrl+Shift+J (plain Ctrl+J is the
  // browser's "open downloads" shortcut — don't hijack it)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key?.toLowerCase() === "j") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    // Initial fetch on mount for whole application (including admin dashboards)
    fetchStatus();
    fetchConfig();
    refreshDocuments();

    // On static deploys (GitHub Pages) there is no server and the status stub
    // never changes — polling it every 12s only burns visitor battery.
    if (isGhPages) return;

    // Heartbeat health check every 12 seconds
    const interval = setInterval(() => {
      fetchStatus();
    }, 12000);

    return () => clearInterval(interval);
  }, [fetchStatus, fetchConfig, refreshDocuments]);

  const sendMessage = useCallback(
    async (query: string) => {
      if (!query.trim()) return;

      const userMsgId = `user_${Date.now()}`;
      const assistantMsgId = `asst_${Date.now()}`;

      const userMsg: ChatMessage = {
        id: userMsgId,
        role: "user",
        content: query,
        timestamp: Date.now(),
      };

      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        isStreaming: true,
        stage: "query_understanding",
        stageMessage: "Analyzing query...",
        timestamp: Date.now(),
      };

      const currentHistory = messages
        .filter((m) => m.id !== "welcome" && m.content.trim())
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      try {
        const res = await fetch(withBasePath("/api/rag/query"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            stream: true,
            debug: true,
            history: currentHistory,
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error("Failed to connect to RAG stream");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            try {
              const event = JSON.parse(trimmed.slice(6));

              setMessages((prev) =>
                prev.map((msg) => {
                  if (msg.id !== assistantMsgId) return msg;

                  if (event.type === "status") {
                    return {
                      ...msg,
                      stage: event.stage,
                      stageMessage: event.message,
                      timings: { ...(msg.timings || {}), ...(event.timings || {}) } as PipelineTimings,
                    };
                  } else if (event.type === "delta") {
                    return {
                      ...msg,
                      content: msg.content + event.content,
                    };
                  } else if (event.type === "evidence") {
                    return {
                      ...msg,
                      evidence: event.evidence,
                    };
                  } else if (event.type === "citations") {
                    return {
                      ...msg,
                      citations: event.citations,
                    };
                  } else if (event.type === "debug") {
                    setDiagnostics(event.diagnostics);
                    return {
                      ...msg,
                      diagnostics: event.diagnostics,
                    };
                  } else if (event.type === "error") {
                    return {
                      ...msg,
                      content: event.message || "An error occurred while generating the answer.",
                      isStreaming: false,
                    };
                  } else if (event.type === "done") {
                    return {
                      ...msg,
                      isStreaming: false,
                      timings: event.timings,
                    };
                  }
                  return msg;
                })
              );
            } catch {
              // Ignore
            }
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: "Sorry, an error occurred while generating the answer. Please try again.",
                  isStreaming: false,
                }
              : msg
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Chat cleared. Ask me anything about Catalin's portfolio!",
        timestamp: Date.now(),
      },
    ]);
  }, []);

  return (
    <RAGContext.Provider
      value={{
        isOpen,
        setIsOpen,
        activeTab,
        setActiveTab,
        messages,
        sendMessage,
        clearMessages,
        selectedEvidence,
        setSelectedEvidence,
        selectedCitation,
        setSelectedCitation,
        diagnostics,
        status,
        config,
        updateConfig,
        fetchStatus,
        fetchConfig,
        documents,
        refreshDocuments,
        triggerReindex,
        evalComparison,
        runEvaluation,
        isEvaluating,
        isStreaming,
      }}
    >
      {children}
    </RAGContext.Provider>
  );
}

export function useRAG() {
  const context = useContext(RAGContext);
  if (!context) {
    throw new Error("useRAG must be used within a RAGProvider");
  }
  return context;
}
