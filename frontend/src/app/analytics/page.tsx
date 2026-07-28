"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
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
        // Sort ascending by date for charts
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

  // Filter data based on timeframe
  const filteredData = data.filter((item) => {
    if (timeframe === "all") return true;
    const itemDate = new Date(item.date).getTime();
    const now = new Date().getTime();
    const days = timeframe === "7d" ? 7 : 30;
    return now - itemDate <= days * 24 * 60 * 60 * 1000;
  });

  const chartData = filteredData.map((d) => ({
    ...d,
    formattedDate: new Date(d.date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  const avgMood =
    chartData.length > 0
      ? (
          chartData.reduce((acc, curr) => acc + curr.mood_score, 0) /
          chartData.length
        ).toFixed(1)
      : "N/A";

  const avgSleep =
    chartData.length > 0
      ? (
          chartData.reduce((acc, curr) => acc + (curr.sleep_hours || 0), 0) /
          chartData.length
        ).toFixed(1)
      : "N/A";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-primary)",
      }}
    >
      <Sidebar />
      <main
        style={{
          flex: 1,
          marginLeft: 260,
          padding: "32px 28px",
          maxWidth: 1000,
          overflow: "auto",
        }}
      >
        <style>{`
          @media (max-width: 767px) { main { margin-left: 0 !important; padding: 16px !important; } }
        `}</style>

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(24px, 4vw, 32px)",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 6,
              }}
            >
              Wellness Analytics 📊
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              Discover patterns in your mood, sleep, stress, and habits
            </p>
          </div>

          <div
            style={{
              display: "flex",
              background: "var(--bg-secondary)",
              padding: 4,
              borderRadius: 12,
              border: "0.5px solid var(--border-secondary)",
            }}
          >
            {(["7d", "30d", "all"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "none",
                  background:
                    timeframe === t ? "var(--bg-tertiary)" : "transparent",
                  color:
                    timeframe === t
                      ? "var(--text-primary)"
                      : "var(--text-tertiary)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t === "7d" ? "7 Days" : t === "30d" ? "30 Days" : "All Time"}
              </button>
            ))}
          </div>
        </div>

        {/* AI Insights Banner */}
        {insights.length > 0 && (
          <div
            style={{
              padding: "20px 24px",
              borderRadius: 16,
              background:
                "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(6,182,212,0.06))",
              border: "1px solid rgba(34,197,94,0.2)",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#22c55e",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              🤖 Sera AI Mood Insights
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 12,
              }}
            >
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: 13,
                    color: "var(--text-primary)",
                    lineHeight: 1.6,
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "var(--bg-glass)",
                    border: "0.5px solid var(--border-secondary)",
                  }}
                >
                  {insight}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              padding: "18px 20px",
              borderRadius: 16,
              background: "var(--bg-glass)",
              border: "0.5px solid var(--border-secondary)",
            }}
          >
            <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              Average Mood
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginTop: 4,
              }}
            >
              {avgMood} <span style={{ fontSize: 14 }}>/ 5</span>
            </div>
          </div>
          <div
            style={{
              padding: "18px 20px",
              borderRadius: 16,
              background: "var(--bg-glass)",
              border: "0.5px solid var(--border-secondary)",
            }}
          >
            <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              Average Sleep
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#8b5cf6",
                marginTop: 4,
              }}
            >
              {avgSleep} <span style={{ fontSize: 14 }}>hrs</span>
            </div>
          </div>
          <div
            style={{
              padding: "18px 20px",
              borderRadius: 16,
              background: "var(--bg-glass)",
              border: "0.5px solid var(--border-secondary)",
            }}
          >
            <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              Tracked Days
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#3b82f6",
                marginTop: 4,
              }}
            >
              {chartData.length}
            </div>
          </div>
        </div>

        {/* Mood & Sleep Charts Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: 24,
            marginBottom: 28,
          }}
        >
          {/* Mood Trend Chart */}
          <div
            style={{
              padding: "20px",
              borderRadius: 16,
              background: "var(--bg-glass)",
              border: "0.5px solid var(--border-secondary)",
            }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 16,
              }}
            >
              Mood Trend
            </h3>
            <div style={{ width: "100%", height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="formattedDate" stroke="var(--text-tertiary)" fontSize={11} />
                  <YAxis domain={[1, 5]} stroke="var(--text-tertiary)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-primary)",
                      borderColor: "var(--border-secondary)",
                      borderRadius: 10,
                      color: "var(--text-primary)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mood_score"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#moodGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stress & Anxiety Comparison */}
          <div
            style={{
              padding: "20px",
              borderRadius: 16,
              background: "var(--bg-glass)",
              border: "0.5px solid var(--border-secondary)",
            }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 16,
              }}
            >
              Stress vs Anxiety
            </h3>
            <div style={{ width: "100%", height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="formattedDate" stroke="var(--text-tertiary)" fontSize={11} />
                  <YAxis domain={[0, 10]} stroke="var(--text-tertiary)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-primary)",
                      borderColor: "var(--border-secondary)",
                      borderRadius: 10,
                      color: "var(--text-primary)",
                    }}
                  />
                  <Line type="monotone" dataKey="stress_level" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="anxiety_level" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sleep Hours Bar Chart */}
        <div
          style={{
            padding: "20px",
            borderRadius: 16,
            background: "var(--bg-glass)",
            border: "0.5px solid var(--border-secondary)",
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 16,
            }}
          >
            Sleep Duration (Hours)
          </h3>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="formattedDate" stroke="var(--text-tertiary)" fontSize={11} />
                <YAxis domain={[0, 12]} stroke="var(--text-tertiary)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-primary)",
                    borderColor: "var(--border-secondary)",
                    borderRadius: 10,
                    color: "var(--text-primary)",
                  }}
                />
                <Bar dataKey="sleep_hours" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
