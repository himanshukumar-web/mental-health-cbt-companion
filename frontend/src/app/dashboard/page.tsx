"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface MoodEntry {
  date: string;
  mood_score: number;
  mood_emoji: string;
  stress_level: number | null;
  sleep_hours: number | null;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [journalCount, setJournalCount] = useState(0);
  const [cbtCount, setCbtCount] = useState(0);
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [meditationMins, setMeditationMins] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [moodRes, journalRes, cbtRes, xpRes] = await Promise.all([
        fetch(`${API_URL}/mood-entries/${user.id}`),
        fetch(`${API_URL}/journal/${user.id}`),
        fetch(`${API_URL}/cbt-worksheets/${user.id}`),
        fetch(`${API_URL}/gamification/xp/${user.id}`),
      ]);

      if (moodRes.ok) {
        const json = await moodRes.json();
        setMoodEntries(json.mood_entries || []);
      }
      if (journalRes.ok) {
        const json = await journalRes.json();
        setJournalCount((json.journal_entries || []).length);
      }
      if (cbtRes.ok) {
        const json = await cbtRes.json();
        setCbtCount((json.worksheets || []).length);
      }
      if (xpRes.ok) {
        const json = await xpRes.json();
        setUserXP(json.xp?.total_xp || 0);
        setUserLevel(json.xp?.level || 1);
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

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Friend";
  const today = new Date().toISOString().split("T")[0];
  const todayMood = moodEntries.find((e) => e.date === today);

  // Compute 30-Day Heatmap Dates
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  });

  const moodMap = new Map(moodEntries.map((m) => [m.date, m.mood_score]));

  // Calculate Scores (0-100)
  const recentMoods = moodEntries.slice(0, 14);
  const avgMood = recentMoods.length > 0
    ? recentMoods.reduce((a, b) => a + b.mood_score, 0) / recentMoods.length
    : 3.5;
  const avgSleep = recentMoods.length > 0
    ? recentMoods.reduce((a, b) => a + (b.sleep_hours || 7), 0) / recentMoods.length
    : 7.5;
  const avgStress = recentMoods.length > 0
    ? recentMoods.reduce((a, b) => a + (b.stress_level || 4), 0) / recentMoods.length
    : 4;

  const wellnessScore = Math.min(100, Math.round((avgMood / 5) * 40 + (avgSleep / 8) * 30 + (10 - avgStress) * 3));
  const stressScore = Math.round(avgStress * 10);
  const sleepScore = Math.min(100, Math.round((avgSleep / 8) * 100));
  const productivityScore = Math.min(100, Math.round(wellnessScore * 0.95));

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
          maxWidth: 1050,
          overflow: "auto",
        }}
      >
        <style>{`
          @media (max-width: 767px) { main { margin-left: 0 !important; padding: 16px !important; } }
          @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        `}</style>

        {/* Welcome & Level Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
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
              Wellness Dashboard V2 🌿
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              Welcome back, {displayName}! Here is your holistic mental wellness overview.
            </p>
          </div>

          <Link
            href="/achievements"
            style={{
              padding: "10px 18px",
              borderRadius: 14,
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.3)",
              color: "#f59e0b",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            🏆 Level {userLevel} ({userXP} XP)
          </Link>
        </div>

        {/* AI Wellness Score Card */}
        <div
          style={{
            padding: "24px 28px",
            borderRadius: 20,
            background:
              "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(6,182,212,0.1))",
            border: "1px solid rgba(34,197,94,0.3)",
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
              AI Holistic Wellness Index
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              {wellnessScore} <span style={{ fontSize: 18, color: "var(--text-tertiary)" }}>/ 100</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
              Calculated from your recent mood consistency, stress, and sleep metrics.
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <ScoreMini label="Sleep" score={`${sleepScore}%`} color="#8b5cf6" />
            <ScoreMini label="Stress" score={`${stressScore}/100`} color="#ef4444" />
            <ScoreMini label="Productivity" score={`${productivityScore}%`} color="#3b82f6" />
          </div>
        </div>

        {/* 30-Day Mood Heatmap */}
        <div
          style={{
            padding: "20px 24px",
            borderRadius: 20,
            background: "var(--bg-glass)",
            border: "0.5px solid var(--border-secondary)",
            marginBottom: 28,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              30-Day Mood Heatmap 🗓
            </h2>
            <Link href="/mood" style={{ fontSize: 12, color: "#22c55e", textDecoration: "none" }}>
              View Mood Log →
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(26px, 1fr))", gap: 6 }}>
            {last30Days.map((dateStr) => {
              const score = moodMap.get(dateStr);
              let color = "var(--bg-tertiary)";
              if (score === 5) color = "#06b6d4";
              else if (score === 4) color = "#22c55e";
              else if (score === 3) color = "#eab308";
              else if (score === 2) color = "#f97316";
              else if (score === 1) color = "#ef4444";

              return (
                <div
                  key={dateStr}
                  title={`${dateStr}: ${score ? `Mood ${score}/5` : "Not logged"}`}
                  style={{
                    height: 28,
                    borderRadius: 6,
                    background: color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: score ? "white" : "transparent",
                    transition: "all 0.2s",
                  }}
                >
                  {new Date(dateStr + "T00:00:00").getDate()}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Launch Modules Grid */}
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)", marginBottom: 16 }}>
          Quick Access Modules
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {[
            { title: "AI Therapy", icon: "💬", path: "/chat", desc: "Dual-agent CBT support", color: "#22c55e" },
            { title: "Guided Meditation", icon: "🧘", path: "/meditation", desc: "6 Mindfulness categories", color: "#8b5cf6" },
            { title: "Guided Breathing", icon: "🫁", path: "/breathing", desc: "Box & 4-7-8 Breathing", color: "#3b82f6" },
            { title: "CBT Restructuring", icon: "🧠", path: "/cbt", desc: "Reframe negative thoughts", color: "#06b6d4" },
            { title: "AI Journal", icon: "📝", path: "/journal", desc: `${journalCount} entries recorded`, color: "#a855f7" },
            { title: "Habit Tracker", icon: "✅", path: "/habits", desc: "Daily streak tracking", color: "#f59e0b" },
          ].map((mod, idx) => (
            <Link
              key={idx}
              href={mod.path}
              style={{
                padding: "20px",
                borderRadius: 16,
                background: "var(--bg-glass)",
                border: "0.5px solid var(--border-secondary)",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{mod.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                {mod.title}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                {mod.desc}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

function ScoreMini({ label, score, color }: { label: string; score: string; color: string }) {
  return (
    <div
      style={{
        padding: "12px 18px",
        borderRadius: 14,
        background: "var(--bg-glass)",
        border: "0.5px solid var(--border-secondary)",
        minWidth: 100,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{score}</div>
    </div>
  );
}
