import type { Metadata } from "next";
import { RAGAdminDashboard } from "@/components/rag/admin/rag-admin-dashboard";
import { TriangleWorld } from "@/components/triangle-world";

export const metadata: Metadata = {
  title: "RAG Operations & Telemetry Admin",
  description: "Developer console for portfolio RAG pipeline DAG, benchmarks, knowledge base, and model controls.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RAGAdminPage() {
  return (
    <>
      <TriangleWorld />
      <div className="relative z-10">
        <RAGAdminDashboard />
      </div>
    </>
  );
}
