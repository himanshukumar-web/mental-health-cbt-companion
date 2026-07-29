"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import WellnessScoreCard from "@/components/WellnessScoreCard";
import InsightChartCard from "@/components/InsightChartCard";
import PersonaSelector from "@/components/PersonaSelector";
import { useWellnessScore } from "@/hooks/useWellnessScore";
import { usePersona } from "@/hooks/usePersona";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import Link from "next/link";
import { PersonalizedInsight } from "@/types/persona";

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
  const [insights, setInsights] = useState<PersonalizedInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const { currentScore, loading: scoreLoading } = useWellnessScore(user?.id);
  const { personas, activePersona, selectPersona, selectedPersonaId } = usePersona(user?.id);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [moodRes, journalRes, cbtRes, xpRes, insightsRes] = await Promise.all([
        fetch(`${API_URL}/mood-entries/${user.id}`),
        fetch(`${API_URL}/journal/${user.id}`),
        fetch(`${API_URL}/cbt-worksheets/${user.id}`),
        fetch(`${API_URL}/gamification/xp/${user.id}`),
        fetch(`${API_URL}/insights/${user.id}`),
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
      if (insightsRes.ok) {
        const json = await insightsRes.json();
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

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Friend";

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
          marginLeft: 250,
          padding: "32px 28px 80px",
          maxWidth: 1080,
          overflow: "auto",
        }}
      >
        <style>{`
          @media (max-width: 767px) { main { margin-left: 0 !important; padding: 16px 16px 80px !important; } }
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
                fontSize: "clamp(24px, 4vw, 30px)",
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: 4,
              }}
            >
              Mental Wellness Dashboard V2 🌿
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              Welcome back, {displayName}! Your personalized AI therapy summary.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/timeline"
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.3)",
                color: "#22c55e",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              📜 Timeline
            </Link>

            <Link
              href="/assessments"
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                background: "rgba(59,130,246,0.12)",
                border: "1px solid rgba(59,130,246,0.3)",
                color: "#3b82f6",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              📋 Clinical Tests
            </Link>

            <Link
              href="/achievements"
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.3)",
                color: "#f59e0b",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              🏆 Lvl {userLevel} ({userXP} XP)
            </Link>
          </div>
        </div>

        {/* AI Wellness Score Card */}
        <div style={{ marginBottom: 24 }}>
          <WellnessScoreCard scoreData={currentScore} loading={scoreLoading} />
        </div>

        {/* Persona Switcher Section */}
        <div
          style={{
            padding: 20,
            borderRadius: 20,
            background: "var(--bg-glass)",
            backdropFilter: "blur(16px)",
            border: "1px solid var(--border-secondary)",
            marginBottom: 24,
          }}
        >
          <PersonaSelector
            personas={personas}
            activePersonaId={selectedPersonaId}
            onSelectPersona={selectPersona}
            compact={false}
          />
        </div>

        {/* Dynamic Personalized Insights */}
        <div style={{ marginBottom: 24 }}>
          <InsightChartCard insights={insights} />
        </div>

        {/* Quick Tools & Shortcuts Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
          <Link
            href="/chat"
            style={{
              padding: 20,
              borderRadius: 16,
              background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))",
              border: "1px solid rgba(34,197,94,0.3)",
              textDecoration: "none",
              color: "var(--text-primary)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 24 }}>💬</span>
            <div style={{ fontSize: 16, fontWeight: 700 }}>AI Therapy Session</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Talk with your selected persona ({activePersona.name} - {activePersona.title}).
            </div>
          </Link>

          <Link
            href="/assessments"
            style={{
              padding: 20,
              borderRadius: 16,
              background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))",
              border: "1px solid rgba(139,92,246,0.3)",
              textDecoration: "none",
              color: "var(--text-primary)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 24 }}>📊</span>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Clinical PHQ-9 & GAD-7</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Evaluate depression and anxiety scores over time.
            </div>
          </Link>

          <Link
            href="/journal"
            style={{
              padding: 20,
              borderRadius: 16,
              background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))",
              border: "1px solid rgba(245,158,11,0.3)",
              textDecoration: "none",
              color: "var(--text-primary)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 24 }}>📝</span>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Reflective Journal ({journalCount})</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Express thoughts and receive AI emotional breakdown.
            </div>
          </Link>

          <Link
            href="/cbt"
            style={{
              padding: 20,
              borderRadius: 16,
              background: "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))",
              border: "1px solid rgba(6,182,212,0.3)",
              textDecoration: "none",
              color: "var(--text-primary)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 24 }}>🧠</span>
            <div style={{ fontSize: 16, fontWeight: 700 }}>CBT Worksheets ({cbtCount})</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Reframe negative automatic thoughts into balanced logic.
            </div>
          </Link>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
