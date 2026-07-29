"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import CalendarHeatmap from "@/components/CalendarHeatmap";
import DayDetailsModal from "@/components/DayDetailsModal";
import ExportModal from "@/components/ExportModal";
import { useHeatmap } from "@/hooks/useHeatmap";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface MoodEntry {
  date: string;
  mood_score: number;
  stress_level: number | null;
  anxiety_level: number | null;
  sleep_hours: number | null;
  water_intake: number | null;
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<MoodEntry[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "all">("30d");
  const [exportOpen, setExportOpen] = useState(false);

  const { heatmapData, selectedDayDetails, fetchDayDetails, clearDayDetails, modalLoading } = useHeatmap(user?.id);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/analytics/${user.id}`);
      if (res.ok) {
        const json = await res.json();
        const rawEntries: MoodEntry[] = json.mood_entries || [];
        rawEntries.sort((a, b) => a.date.localeCompare(b.date));
        setData(rawEntries);
        setInsights(json.insights || []);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (authLoading || loading)
    return (
      <>
        <Sidebar />
        <div style={{ marginLeft: 260 }}>
          <PageSkeleton />
        </div>
      </>
    );
  if (!user) return null;

  const filteredData = data.filter((item) => {
    if (timeframe === "all") return true;
    const itemDate = new Date(item.date);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (timeframe === "7d" ? 7 : 30));
    return itemDate >= cutoff;
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 250, padding: "32px 28px 80px", maxWidth: 1100, overflow: "auto" }}>
        <style>{`
          @media (max-width: 767px) { main { margin-left: 0 !important; padding: 16px 16px 80px !important; } }
        `}</style>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 4vw, 30px)", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              Analytics & Insights
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-tertiary)", margin: "4px 0 0" }}>
              Visualizing wellness trends, heatmap contribution grid, and mood correlations over time.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", background: "var(--bg-secondary)", borderRadius: 10, padding: 3, border: "0.5px solid var(--border-secondary)" }}>
              {(["7d", "30d", "all"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: timeframe === t ? "#22c55e" : "transparent",
                    color: timeframe === t ? "#fff" : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={() => setExportOpen(true)}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid rgba(59,130,246,0.3)",
                background: "rgba(59,130,246,0.12)",
                color: "#3b82f6",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              📥 Export Report
            </button>
          </div>
        </div>

        {/* GitHub-style Contribution Heatmap */}
        <div style={{ marginBottom: 28 }}>
          <CalendarHeatmap
            data={heatmapData}
            onDayClick={(date) => fetchDayDetails(date)}
            daysToDisplay={timeframe === "7d" ? 14 : timeframe === "30d" ? 30 : 60}
          />
        </div>

        {/* Mood Trend Area Chart */}
        <div style={{ padding: 24, borderRadius: 20, background: "var(--bg-glass)", backdropFilter: "blur(16px)", border: "1px solid var(--border-secondary)", marginBottom: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 16px" }}>
            📈 Mood Score Progression
          </h3>
          <div style={{ height: 260, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" opacity={0.5} />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={11} />
                <YAxis domain={[0, 10]} stroke="var(--text-tertiary)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--bg-primary)", borderRadius: 10, border: "1px solid var(--border-secondary)" }} />
                <Area type="monotone" dataKey="mood_score" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorMood)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day Details Breakdown Modal */}
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
      <MobileBottomNav />
    </div>
  );
}
