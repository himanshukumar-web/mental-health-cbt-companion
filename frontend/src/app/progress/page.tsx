"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import CalendarHeatmap from "@/components/CalendarHeatmap";
import type { HeatmapDay } from "@/types/heatmap";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ProgressHubPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [totalXP, setTotalXP] = useState(0);
  const [level, setLevel] = useState(1);
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);
  const [phq9Score, setPhq9Score] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [xpRes, timelineRes, phqRes] = await Promise.allSettled([
        fetch(`${API_URL}/gamification/xp/${user.id}`),
        fetch(`${API_URL}/timeline/${user.id}`),
        fetch(`${API_URL}/phq9/${user.id}`),
      ]);

      if (xpRes.status === "fulfilled" && xpRes.value.ok) {
        const json = await xpRes.value.json();
        setTotalXP(json.xp?.total_xp || 0);
        setLevel(json.xp?.level || 1);
      }

      if (timelineRes.status === "fulfilled" && timelineRes.value.ok) {
        const json = await timelineRes.value.json();
        const events = json.events || [];
        const counts: { [date: string]: number } = {};
        events.forEach((ev: { timestamp?: string; date?: string }) => {
          const d = (ev.timestamp || ev.date || "").split("T")[0];
          if (d) counts[d] = (counts[d] || 0) + 1;
        });
        const list: HeatmapDay[] = Object.keys(counts).map((date) => ({
          date,
          score: Math.min(counts[date] * 25, 100),
        }));
        setHeatmapData(list);
      }

      if (phqRes.status === "fulfilled" && phqRes.value.ok) {
        const json = await phqRes.value.json();
        if (json.assessments && json.assessments.length > 0) {
          setPhq9Score(json.assessments[0].score);
        }
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
        <div style={{ marginLeft: 250 }}>
          <PageSkeleton />
        </div>
      </>
    );

  if (!user) return null;

  const MODULES = [
    {
      id: "analytics",
      title: "Correlation Analytics",
      subtitle: "Charts for mood, sleep & stress",
      icon: "📊",
      href: "/analytics",
      color: "#3b82f6",
      badge: "Recharts",
    },
    {
      id: "timeline",
      title: "Activity Heatmap & Logs",
      subtitle: "90-day mental wellness timeline",
      icon: "📜",
      href: "/timeline",
      color: "#22c55e",
      badge: "Heatmap",
    },
    {
      id: "achievements",
      title: "Achievements & Quests",
      subtitle: `Level ${level} • ${totalXP} XP earned`,
      icon: "🏆",
      href: "/achievements",
      color: "#f59e0b",
      badge: `${totalXP} XP`,
    },
    {
      id: "assessments",
      title: "Clinical Tests",
      subtitle: phq9Score !== null ? `PHQ-9 Score: ${phq9Score}/27` : "PHQ-9 & GAD-7 assessments",
      icon: "📋",
      href: "/assessments",
      color: "#a855f7",
      badge: phq9Score !== null ? `Score: ${phq9Score}` : "Clinical",
    },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 250, padding: "28px 24px 100px", maxWidth: 960, overflow: "auto" }}>
        <style>{`
          @media (max-width: 767px) { main { margin-left: 0 !important; padding: 20px 16px 100px !important; } }
        `}</style>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#3b82f6", letterSpacing: "0.08em" }}>
            Progress & Insights Hub
          </span>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", margin: "4px 0 0", fontFamily: "var(--font-display)" }}>
            Your Mental Growth 📊
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Track analytics, timeline activity, XP level progress, and clinical assessments.
          </p>
        </div>

        {/* Quick Stats Overview Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: 20,
            borderRadius: 20,
            background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(168,85,247,0.1))",
            border: "1px solid rgba(59,130,246,0.3)",
            marginBottom: 24,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>Total XP</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b" }}>{totalXP} XP</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>Level</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#3b82f6" }}>Lvl {level}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>PHQ-9 Score</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: phq9Score !== null ? "#a855f7" : "var(--text-secondary)" }}>
              {phq9Score !== null ? `${phq9Score} / 27` : "Not taken"}
            </div>
          </div>
        </motion.div>

        {/* Activity Heatmap Overview */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, fontFamily: "var(--font-display)" }}>
            📅 90-Day Mindful Consistency
          </h3>
          <CalendarHeatmap data={heatmapData} />
        </div>

        {/* Module Hub Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-display)" }}>
            ⚡ Progress Modules
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 14 }}>
            {MODULES.map((mod) => (
              <Link key={mod.id} href={mod.href} style={{ textDecoration: "none" }}>
                <motion.div
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: 18,
                    borderRadius: 20,
                    background: "var(--bg-glass)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid var(--border-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      background: `${mod.color}20`,
                      border: `1px solid ${mod.color}50`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      flexShrink: 0,
                    }}
                  >
                    {mod.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {mod.title}
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 8,
                          background: `${mod.color}20`,
                          color: mod.color,
                        }}
                      >
                        {mod.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{mod.subtitle}</div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
