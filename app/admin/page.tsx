import type { Metadata } from "next";
import { MainAdminDashboard } from "@/components/admin/admin-dashboard";
import { TriangleWorld } from "@/components/triangle-world";

export const metadata: Metadata = {
  title: "Portfolio Control Center — Admin Console",
  description: "Unified admin dashboard to configure projects, skills, ML experiments, copy, and AI telemetry across the portfolio.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <>
      <TriangleWorld />
      <div className="relative z-10">
        <MainAdminDashboard />
      </div>
    </>
  );
}
