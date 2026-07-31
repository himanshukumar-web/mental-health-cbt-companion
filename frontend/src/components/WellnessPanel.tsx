"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWellnessScore } from "@/hooks/useWellnessScore";
import { useChallenges } from "@/hooks/useChallenges";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface WellnessPanelProps {
  userId?: string;
}

export default function WellnessPanel({ userId }: WellnessPanelProps) {
  const { currentScore, loading: scoreLoading } = useWellnessScore(userId);
  const { streak } = useChallenges(userId);

  const [journalCount, setJournalCount] = useState(0);
  const [cbtCount, setCbtCount] = useState(0);
  const [latestMood, setLatestMood] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    async function loadMetrics() {
      try {
        const [journalRes, cbtRes, moodRes] = await Promise.all([
          fetch(`${API_URL}/journal/${userId}`),
          fetch(`${API_URL}/cbt-worksheets/${userId}`),
          fetch(`${API_URL}/mood-entries/${userId}`),
        ]);
        if (journalRes.ok) setJournalCount(((await journalRes.json()).journal_entries || []).length);
        if (cbtRes.ok) setCbtCount(((await cbtRes.json()).worksheets || []).length);
        if (moodRes.ok) {
          const moods = (await moodRes.json()).mood_entries || [];
          if (moods.length > 0) setLatestMood(moods[0].mood_score);
        }
      } catch {
        /* ignore */
      }
    }
    loadMetrics();
  }, [userId]);

  const totalScore = currentScore?.total_score ?? 78;

  return (
    <aside
      className="custom-scrollbar wellness-panel-root"
      style={{
        width: 280,
        height: "100%",
        background: "rgba(11, 15, 26, 0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderLeft: "1px solid var(--border-secondary)",
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      <style>{`
        @media (max-width: 1200px) {
          .wellness-panel-root { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#22c55e", letterSpacing: "0.08em" }}>
          Personal Dashboard
        </span>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", margin: "2px 0 0", fontFamily: "var(--font-display)" }}>
          Wellness Summary 🌿
        </h3>
      </div>

      {/* Wellness Score Card */}
      <div
        style={{
          padding: 16,
          borderRadius: 16,
          background: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(6,182,212,0.08))",
          border: "1px solid rgba(34,197,94,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", textTransform: "uppercase" }}>AI Wellness Score</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "var(--text-primary)", marginTop: 2 }}>{totalScore}/100</div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 2 }}>Updated today</div>
        </div>

        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: `conic-gradient(#22c55e ${totalScore}%, rgba(255,255,255,0.1) 0)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "var(--bg-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 800,
              color: "#22c55e",
            }}
          >
            {totalScore}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {/* Streak */}
        <div style={{ padding: 12, borderRadius: 14, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <div style={{ fontSize: 18 }}>🔥</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#f59e0b", marginTop: 4 }}>{streak.current_streak} Days</div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>Active Streak</div>
        </div>

        {/* Mood */}
        <div style={{ padding: 12, borderRadius: 14, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
          <div style={{ fontSize: 18 }}>😊</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#3b82f6", marginTop: 4 }}>{latestMood ? `${latestMood}/10` : "Logged"}</div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>Today's Mood</div>
        </div>

        {/* Journals */}
        <div style={{ padding: 12, borderRadius: 14, background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
          <div style={{ fontSize: 18 }}>📝</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#a855f7", marginTop: 4 }}>{journalCount}</div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>Journals Written</div>
        </div>

        {/* CBT */}
        <div style={{ padding: 12, borderRadius: 14, background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
          <div style={{ fontSize: 18 }}>🧠</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#06b6d4", marginTop: 4 }}>{cbtCount}</div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>CBT Exercises</div>
        </div>
      </div>

      {/* Quick Shortcuts */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Quick Actions</div>

        <Link
          href="/mood"
          style={{
            padding: "9px 12px",
            borderRadius: 12,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-secondary)",
            color: "var(--text-primary)",
            fontSize: 12,
            fontWeight: 600,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>😊</span>
          <span>Log Mood Check-in</span>
        </Link>

        <Link
          href="/journal"
          style={{
            padding: "9px 12px",
            borderRadius: 12,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-secondary)",
            color: "var(--text-primary)",
            fontSize: 12,
            fontWeight: 600,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>📝</span>
          <span>New Journal Entry</span>
        </Link>

        <Link
          href="/breathing"
          style={{
            padding: "9px 12px",
            borderRadius: 12,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-secondary)",
            color: "var(--text-primary)",
            fontSize: 12,
            fontWeight: 600,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>🫁</span>
          <span>5-Min Grounding Session</span>
        </Link>
      </div>
    </aside>
  );
}
