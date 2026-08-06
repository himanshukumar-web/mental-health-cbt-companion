"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import TimelineFeed from "@/components/TimelineFeed";
import CalendarHeatmap from "@/components/CalendarHeatmap";
import DayDetailsModal from "@/components/DayDetailsModal";
import ExportModal from "@/components/ExportModal";
import { useTimeline } from "@/hooks/useTimeline";
import { useHeatmap } from "@/hooks/useHeatmap";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";

export default function TimelinePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [exportOpen, setExportOpen] = useState<boolean>(false);
  const [daysCount, setDaysCount] = useState<number>(90);

  const { timeline, loading: timelineLoading } = useTimeline(user?.id, category, search);
  const { heatmapData, selectedDayDetails, fetchDayDetails, clearDayDetails, modalLoading } = useHeatmap(user?.id);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <><Sidebar /><div className="app-main-layout"><PageSkeleton /></div></>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Sidebar />

      <main className="app-main-layout" style={{ padding: "24px 20px", maxWidth: 1120, overflow: "auto" }}>
        <MobileHeader title="Timeline & Heatmap" />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#22c55e", letterSpacing: "0.08em" }}>
              Mental Health Journey
            </span>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", margin: "4px 0 0", fontFamily: "var(--font-display)" }}>
              Contribution Heatmap & Timeline 📜
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "4px 0 0" }}>
              Visual GitHub-style calendar heatmap. Click any day to inspect Mood, Journal, Habits, and AI Therapy logs.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ display: "flex", background: "var(--bg-secondary)", borderRadius: 12, padding: 3, border: "1px solid var(--border-secondary)" }}>
              {[30, 90, 180].map((d) => (
                <button
                  key={d}
                  onClick={() => setDaysCount(d)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: daysCount === d ? "#22c55e" : "transparent",
                    color: daysCount === d ? "#fff" : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {d} Days
                </button>
              ))}
            </div>

            <button
              onClick={() => setExportOpen(true)}
              style={{
                padding: "8px 14px",
                borderRadius: 12,
                border: "1px solid rgba(59,130,246,0.3)",
                background: "rgba(59,130,246,0.12)",
                color: "#3b82f6",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              📥 Export Summary
            </button>
          </div>
        </div>

        {/* GitHub-style Contribution Heatmap */}
        <div style={{ marginBottom: 28 }}>
          <CalendarHeatmap
            data={heatmapData}
            onDayClick={(date) => fetchDayDetails(date)}
            daysToDisplay={daysCount}
          />
        </div>

        {/* Timeline Feed */}
        <TimelineFeed
          items={timeline}
          loading={timelineLoading}
          onFilterChange={(cat) => setCategory(cat)}
          onSearchChange={(q) => setSearch(q)}
          onOpenExport={() => setExportOpen(true)}
        />

        {/* Day Details Modal */}
        <DayDetailsModal
          details={selectedDayDetails}
          onClose={clearDayDetails}
          loading={modalLoading}
        />

        {/* Export Modal */}
        <ExportModal
          isOpen={exportOpen}
          onClose={() => setExportOpen(false)}
          userId={user.id}
        />
      </main>
    </div>
  );
}
