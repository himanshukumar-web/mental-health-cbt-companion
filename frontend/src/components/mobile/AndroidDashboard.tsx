"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWellnessScore } from "@/hooks/useWellnessScore";
import { usePersona } from "@/hooks/usePersona";
import { useMobileMoodData, useMobileGamification } from "@/hooks/mobile";
import { useMobileJournalData } from "@/hooks/mobile/useMobileJournalData";
import { getGreeting, formatMobileDate } from "@/utils/mobileUtils";
import AndroidMobileLayout from "./AndroidMobileLayout";
import {
  MaterialCard,
  QuickActionCard,
  MoodCard,
  PrimaryButton,
  Avatar,
  Badge,
  LoadingSkeleton,
} from "./ui";

const DAILY_QUOTES = [
  { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },
  { text: "You don't have to control your thoughts. You just have to stop letting them control you.", author: "Dan Millman" },
  { text: "Feelings are just visitors, let them come and go.", author: "Mooji" },
  { text: "Mindfulness is a way of befriending ourselves and our experience.", author: "Jon Kabat-Zinn" },
];

const QUICK_ACTIONS = [
  { icon: "🤖", title: "AI Therapy", subtitle: "Talk with Sera", href: "/chat", bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.3)" },
  { icon: "🎭", title: "Log Mood", subtitle: "Track emotions", href: "/mood", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)" },
  { icon: "📝", title: "Voice Journal", subtitle: "Daily reflection", href: "/journal", bg: "rgba(236, 72, 153, 0.15)", border: "rgba(236, 72, 153, 0.3)" },
  { icon: "🧘", title: "Meditation", subtitle: "Calm your mind", href: "/meditation", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.3)" },
  { icon: "🫁", title: "Breathing", subtitle: "De-stress fast", href: "/breathing", bg: "rgba(6, 182, 212, 0.15)", border: "rgba(6, 182, 212, 0.3)" },
  { icon: "🧠", title: "CBT Tools", subtitle: "Thought records", href: "/cbt", bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.3)" },
  { icon: "📅", title: "Appointments", subtitle: "Doctor care", href: "/appointments", bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.3)" },
  { icon: "📈", title: "Analytics", subtitle: "Wellness insights", href: "/analytics", bg: "rgba(244, 63, 94, 0.15)", border: "rgba(244, 63, 94, 0.3)" },
];

export default function AndroidDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const { latestMood, moodEntries, loading: moodLoading } = useMobileMoodData(user?.id);
  const { xp, level, loading: xpLoading } = useMobileGamification(user?.id);
  const { entries: journalEntries } = useMobileJournalData(user?.id);
  const { currentScore } = useWellnessScore(user?.id);
  const { activePersona } = usePersona(user?.id);

  const greetingInfo = getGreeting();
  const overallScore = typeof currentScore === "object" && currentScore !== null ? (currentScore as any).overall_score ?? 78 : typeof currentScore === "number" ? currentScore : 78;

  const todayDateStr = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  }, []);

  const randomQuote = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
  }, []);

  if (moodLoading || xpLoading) {
    return (
      <AndroidMobileLayout>
        <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <LoadingSkeleton height="72px" />
          <LoadingSkeleton height="180px" />
          <LoadingSkeleton height="220px" />
        </div>
      </AndroidMobileLayout>
    );
  }

  return (
    <AndroidMobileLayout hasBottomNav={true}>
      {/* ── TOP COMPACT APP BAR ─────────────────────────────────────────────── */}
      <div
        style={{
          padding: "16px 20px 14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, rgba(34, 197, 94, 0.08) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <div>
          <div style={{ fontSize: "11px", color: "#4ade80", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {todayDateStr}
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#e8edf5", margin: "2px 0 0 0", letterSpacing: "-0.02em" }}>
            {greetingInfo.text}, {user?.user_metadata?.full_name?.split(" ")[0] || "Friend"} {greetingInfo.icon}
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Notification Button */}
          <button
            onClick={() => router.push("/notifications")}
            aria-label="Notifications"
            style={{
              position: "relative",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              background: "rgba(255, 255, 255, 0.04)",
              color: "#e8edf5",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            🔔
            <span
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#22c55e",
              }}
            />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => router.push("/settings")}
            aria-label="Settings"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              background: "rgba(255, 255, 255, 0.04)",
              color: "#e8edf5",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            ⚙️
          </button>

          {/* Avatar Button */}
          <Avatar
            fallback={user?.user_metadata?.full_name ? user.user_metadata.full_name[0].toUpperCase() : "👤"}
            onClick={() => router.push("/profile")}
            size={40}
          />
        </div>
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* ── DAILY QUOTE BANNER ─────────────────────────────────────────────── */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "16px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.07)",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "18px" }}>💡</span>
          <div>
            <p style={{ fontSize: "13px", color: "#e8edf5", margin: 0, fontStyle: "italic", lineHeight: 1.4 }}>
              "{randomQuote.text}"
            </p>
            <span style={{ fontSize: "11px", color: "#8b95a7", fontWeight: 600, marginTop: "2px", display: "block" }}>
              — {randomQuote.author}
            </span>
          </div>
        </div>

        {/* ── HERO CARD (Headspace / Calm Style) ──────────────────────────────── */}
        <MaterialCard
          variant="elevated"
          style={{
            background: "linear-gradient(135deg, #132a20 0%, #0d1726 100%)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            borderRadius: "24px",
            padding: "20px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#22c55e",
                    boxShadow: "0 0 8px #22c55e",
                  }}
                />
                <span style={{ fontSize: "12px", color: "#4ade80", fontWeight: 700, letterSpacing: "0.04em" }}>
                  {activePersona?.name || "Dr. Sera"} is Online
                </span>
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.02em" }}>
                Daily Mindful Check-in
              </h2>
            </div>

            <Badge label="🔥 5 Day Streak" color="#f59e0b" bg="rgba(245, 158, 11, 0.18)" />
          </div>

          <p style={{ fontSize: "13px", color: "#8b95a7", margin: "0 0 16px 0", lineHeight: 1.5 }}>
            {latestMood
              ? `Last mood recorded: ${latestMood.mood_emoji} (${latestMood.mood_score}/10). Take a moment to reflect.`
              : "Track your emotions and start a 3-minute guided CBT exercise."}
          </p>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <PrimaryButton
              fullWidth
              onClick={() => router.push("/chat")}
              style={{
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                borderRadius: "14px",
                height: "48px",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              Start CBT Session 💬
            </PrimaryButton>
            <button
              onClick={() => router.push("/mood")}
              aria-label="Log Mood"
              style={{
                height: "48px",
                padding: "0 16px",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(255, 255, 255, 0.06)",
                color: "#e8edf5",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Log Mood 🎭
            </button>
          </div>
        </MaterialCard>

        {/* ── QUICK ACTIONS GRID ─────────────────────────────────────────────── */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#e8edf5", margin: 0 }}>
              Explore Care & Tools
            </h2>
            <span style={{ fontSize: "12px", color: "#8b95a7" }}>8 Activities</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "12px",
            }}
          >
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.title} href={action.href} style={{ textDecoration: "none" }}>
                <QuickActionCard
                  icon={action.icon}
                  title={action.title}
                  subtitle={action.subtitle}
                  bg={action.bg}
                />
              </Link>
            ))}
          </div>
        </div>

        {/* ── PROGRESS SECTION ───────────────────────────────────────────────── */}
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#e8edf5", margin: "0 0 12px 0" }}>
            Wellness & Progress
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {/* Wellness Index Card */}
            <MaterialCard variant="filled" style={{ background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.2)" }}>
              <div style={{ fontSize: "11px", color: "#8b95a7", fontWeight: 700, textTransform: "uppercase" }}>
                WELLNESS SCORE
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#4ade80", margin: "4px 0" }}>
                {overallScore} <span style={{ fontSize: "12px", color: "#8b95a7" }}>/100</span>
              </div>
              <div style={{ fontSize: "11px", color: "#e8edf5", opacity: 0.8 }}>
                Guided by {activePersona?.name || "Sera"}
              </div>
            </MaterialCard>

            {/* Level & XP Card */}
            <MaterialCard variant="filled" style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
              <div style={{ fontSize: "11px", color: "#8b95a7", fontWeight: 700, textTransform: "uppercase" }}>
                GAMIFICATION
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#fbbf24", margin: "4px 0" }}>
                Lvl {level}
              </div>
              <div style={{ fontSize: "11px", color: "#8b95a7" }}>
                {xp} XP Earned
              </div>
            </MaterialCard>
          </div>
        </div>

        {/* ── RECENT ACTIVITY SECTION ───────────────────────────────────────── */}
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#e8edf5", margin: "0 0 12px 0" }}>
            Recent Activity
          </h2>

          {latestMood ? (
            <MoodCard
              emoji={latestMood.mood_emoji || "😊"}
              score={latestMood.mood_score}
              date={formatMobileDate(latestMood.created_at)}
              notes={latestMood.notes}
              onClick={() => router.push("/mood")}
            />
          ) : journalEntries && journalEntries.length > 0 ? (
            <MaterialCard
              clickable
              variant="filled"
              onClick={() => router.push("/journal")}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div>
                <span style={{ fontSize: "12px", color: "#4ade80", fontWeight: 700 }}>RECENT JOURNAL</span>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#e8edf5", marginTop: "2px" }}>
                  {journalEntries[0].title || "Daily Reflection"}
                </div>
                <div style={{ fontSize: "12px", color: "#8b95a7", marginTop: "2px" }}>
                  {journalEntries[0].created_at ? formatMobileDate(journalEntries[0].created_at) : "Recently"}
                </div>
              </div>
              <span style={{ fontSize: "20px" }}>📝</span>
            </MaterialCard>
          ) : (
            <MaterialCard variant="filled" style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: "24px", marginBottom: "6px" }}>🌱</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#e8edf5" }}>No recent activity yet</div>
              <div style={{ fontSize: "12px", color: "#8b95a7", marginTop: "2px" }}>
                Start a chat or check in your mood to build your timeline
              </div>
            </MaterialCard>
          )}
        </div>
      </div>
    </AndroidMobileLayout>
  );
}
