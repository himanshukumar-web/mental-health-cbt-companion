"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface MoodEntry {
  mood_score: number;
  mood_emoji: string;
  stress_level: number | null;
  sleep_hours: number | null;
  water_intake: number | null;
  exercise_done: boolean;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [journalCount, setJournalCount] = useState(0);
  const [cbtCount, setCbtCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [moodRes, journalRes, cbtRes] = await Promise.all([
        fetch(`${API_URL}/mood-entries/${user.id}`),
        fetch(`${API_URL}/journal/${user.id}`),
        fetch(`${API_URL}/cbt-worksheets/${user.id}`),
      ]);

      if (moodRes.ok) {
        const json = await moodRes.json();
        const today = new Date().toISOString().split("T")[0];
        const match = (json.mood_entries || []).find((e: { date: string }) => e.date === today);
        setTodayMood(match || null);
      }

      if (journalRes.ok) {
        const json = await journalRes.json();
        setJournalCount((json.journal_entries || []).length);
      }

      if (cbtRes.ok) {
        const json = await cbtRes.json();
        setCbtCount((json.worksheets || []).length);
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
          marginLeft: 260,
          padding: "32px 28px",
          maxWidth: 1000,
          overflow: "auto",
        }}
      >
        <style>{`
          @media (max-width: 767px) { main { margin-left: 0 !important; padding: 16px !important; } }
          @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        `}</style>

        {/* Welcome Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 4vw, 32px)",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            Welcome back, {displayName}! 👋
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Here is a snapshot of your mental wellness journey today.
          </p>
        </div>

        {/* Hero Quick Start Card */}
        <div
          style={{
            padding: "24px 28px",
            borderRadius: 20,
            background:
              "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(6,182,212,0.08))",
            border: "1px solid rgba(34,197,94,0.25)",
            marginBottom: 28,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                marginBottom: 4,
              }}
            >
              Need someone to talk to?
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Sera is ready for a warm, compassionate CBT chat session.
            </div>
          </div>
          <Link
            href="/chat"
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(34,197,94,0.3)",
            }}
          >
            Start AI Therapy Session 💬
          </Link>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              padding: "20px",
              borderRadius: 16,
              background: "var(--bg-glass)",
              border: "0.5px solid var(--border-secondary)",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>
              {todayMood ? todayMood.mood_emoji : "❓"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              Today&apos;s Mood
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginTop: 2,
              }}
            >
              {todayMood ? `${todayMood.mood_score} / 5` : "Not logged yet"}
            </div>
            <Link
              href="/mood"
              style={{
                fontSize: 12,
                color: "#22c55e",
                textDecoration: "none",
                marginTop: 8,
                display: "inline-block",
              }}
            >
              {todayMood ? "Update mood →" : "Log mood now →"}
            </Link>
          </div>

          <div
            style={{
              padding: "20px",
              borderRadius: 16,
              background: "var(--bg-glass)",
              border: "0.5px solid var(--border-secondary)",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>📝</div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              Journal Entries
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#a855f7",
                marginTop: 2,
              }}
            >
              {journalCount} Entries
            </div>
            <Link
              href="/journal"
              style={{
                fontSize: 12,
                color: "#a855f7",
                textDecoration: "none",
                marginTop: 8,
                display: "inline-block",
              }}
            >
              Write in journal →
            </Link>
          </div>

          <div
            style={{
              padding: "20px",
              borderRadius: 16,
              background: "var(--bg-glass)",
              border: "0.5px solid var(--border-secondary)",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>🧠</div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              CBT Worksheets
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#3b82f6",
                marginTop: 2,
              }}
            >
              {cbtCount} Restructured
            </div>
            <Link
              href="/cbt"
              style={{
                fontSize: 12,
                color: "#3b82f6",
                textDecoration: "none",
                marginTop: 8,
                display: "inline-block",
              }}
            >
              Open CBT tools →
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--text-primary)",
            fontFamily: "var(--font-display)",
            marginBottom: 16,
          }}
        >
          Explore Wellness Modules
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {[
            {
              title: "Habit Tracker",
              desc: "Build consistency with daily mindfulness habits.",
              icon: "✅",
              path: "/habits",
              color: "#22c55e",
            },
            {
              title: "Wellness Analytics",
              desc: "Deep dive into your stress and mood correlations.",
              icon: "📊",
              path: "/analytics",
              color: "#3b82f6",
            },
            {
              title: "Emotion Detector",
              desc: "Analyze hidden emotional tones in your writing.",
              icon: "💭",
              path: "/emotions",
              color: "#06b6d4",
            },
            {
              title: "Appointments",
              desc: "Book direct therapy sessions with specialist doctors.",
              icon: "📅",
              path: "/appointments",
              color: "#f59e0b",
            },
          ].map((item, idx) => (
            <Link
              key={idx}
              href={item.path}
              style={{
                padding: "20px",
                borderRadius: 16,
                background: "var(--bg-glass)",
                border: "0.5px solid var(--border-secondary)",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 4,
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                {item.desc}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
