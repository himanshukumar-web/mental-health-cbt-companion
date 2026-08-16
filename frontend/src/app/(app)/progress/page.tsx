"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAndroid } from "@/hooks/useIsAndroid";
import AndroidProgress from "@/components/mobile/AndroidProgress";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import CalendarHeatmap from "@/components/CalendarHeatmap";
import type { HeatmapDay } from "@/types/heatmap";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { motion } from "framer-motion";
import { API_URL } from "@/lib/config";

function DesktopProgressView() {
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

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [xpRes, timelineRes, phqRes] = await Promise.allSettled([
          fetch(`${API_URL}/gamification/xp/${user.id}`),
          fetch(`${API_URL}/timeline/${user.id}`),
          fetch(`${API_URL}/assessments/phq9/${user.id}`),
        ]);

        if (xpRes.status === "fulfilled" && xpRes.value.ok) {
          const json = await xpRes.value.json();
          const parsedXp = typeof json.xp === "object" && json.xp !== null ? Number(json.xp.total_xp ?? json.xp.xp ?? 0) : typeof json.xp === "number" ? json.xp : 0;
          const parsedLevel = typeof json.xp === "object" && json.xp !== null ? Number(json.xp.level ?? 1) : typeof json.level === "number" ? json.level : 1;
          setTotalXP(parsedXp);
          setLevel(parsedLevel);
        }

        if (timelineRes.status === "fulfilled" && timelineRes.value.ok) {
          const json = await timelineRes.value.json();
          const events = json.timeline || json.events || [];
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
    };
    fetchData();
  }, [user]);

  if (authLoading || loading)
    return (
      <>
        <Sidebar />
        <div className="app-main-layout">
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
      <main className="app-main-layout" style={{ padding: "24px 20px", maxWidth: 960, overflow: "auto" }}>
        <MobileHeader title="Progress Hub" />

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

        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, fontFamily: "var(--font-display)" }}>
            📅 90-Day Mindful Consistency
          </h3>
          <CalendarHeatmap data={heatmapData} daysToDisplay={90} onDayClick={() => router.push("/timeline")} />
        </div>

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
    </div>
  );
}

export default function ProgressHubPage() {
  const isAndroid = useIsAndroid();

  if (isAndroid) {
    return <AndroidProgress />;
  }

  return <DesktopProgressView />;
}
