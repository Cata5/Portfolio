import type { Metadata } from "next";
import { AdminConsole } from "@/components/admin/admin-console";

export const metadata: Metadata = {
  title: "Console - Admin",
  description:
    "Operations console for the portfolio: RAG pipeline, retrieval index, page structure and deployment.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="hero-grid pointer-events-none absolute inset-0 -z-10 opacity-30"
      />
      <AdminConsole />
    </div>
  );
}
