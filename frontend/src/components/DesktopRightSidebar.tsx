"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface DesktopRightSidebarProps {
  moodEntries: any[];
  journalCount: number;
  streakDays: number;
  userLevel: number;
  userXP: number;
}

export default function DesktopRightSidebar({
  moodEntries,
  journalCount,
  streakDays,
  userLevel,
  userXP,
}: DesktopRightSidebarProps) {
  const latestMood = moodEntries[0] || { mood_emoji: "😊", mood_score: 4, label: "Calm" };
  const sleepHours = latestMood.sleep_hours || 7.5;
  const waterGlasses = 6;
  const meditationMins = 15;

  return (
    <aside
      className="custom-scrollbar"
      style={{
        width: 310,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: "0 0 40px",
      }}
    >
      {/* Overview Card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          padding: 22,
          borderRadius: 20,
          background: "var(--bg-glass)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border-secondary)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#22c55e", letterSpacing: "0.08em" }}>
              Daily Summary
            </span>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", margin: "2px 0 0", fontFamily: "var(--font-display)" }}>
              Wellness Snapshot
            </h3>
          </div>

          <span
            style={{
              padding: "4px 10px",
              borderRadius: 12,
              background: "rgba(34,197,94,0.15)",
              color: "#86efac",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            🔥 {streakDays}d Streak
          </span>
        </div>

        {/* 4 Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Mood */}
          <div
            style={{
              padding: "12px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyValue: "space-between" }}>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600 }}>Mood</span>
              <span style={{ fontSize: 18 }}>{latestMood.mood_emoji}</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              {latestMood.mood_score ? `${latestMood.mood_score}/5` : "Calm"}
            </div>
          </div>

          {/* Sleep */}
          <div
            style={{
              padding: "12px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyValue: "space-between" }}>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600 }}>Sleep</span>
              <span style={{ fontSize: 18 }}>😴</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#3b82f6" }}>
              {sleepHours} hrs
            </div>
          </div>

          {/* Water */}
          <div
            style={{
              padding: "12px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyValue: "space-between" }}>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600 }}>Water</span>
              <span style={{ fontSize: 18 }}>💧</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#06b6d4" }}>
              {waterGlasses}/8 cups
            </div>
          </div>

          {/* Meditation */}
          <div
            style={{
              padding: "12px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyValue: "space-between" }}>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600 }}>Meditation</span>
              <span style={{ fontSize: 18 }}>🧘</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#a855f7" }}>
              {meditationMins} mins
            </div>
          </div>
        </div>
      </motion.div>

      {/* Habit Completion Progress Ring */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          padding: 22,
          borderRadius: 20,
          background: "var(--bg-glass)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border-secondary)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Habit Consistency
          </h4>
          <Link href="/habits" style={{ fontSize: 12, color: "#22c55e", fontWeight: 700, textDecoration: "none" }}>
            View all →
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", width: 68, height: 68, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="68" height="68" viewBox="0 0 68 68">
              <circle cx="34" cy="34" r="28" stroke="var(--bg-secondary)" strokeWidth="6" fill="none" />
              <circle
                cx="34"
                cy="34"
                r="28"
                stroke="#22c55e"
                strokeWidth="6"
                fill="none"
                strokeDasharray={176}
                strokeDashoffset={176 - (176 * 75) / 100}
                strokeLinecap="round"
                transform="rotate(-90 34 34)"
              />
            </svg>
            <span style={{ position: "absolute", fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>
              75%
            </span>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
              3 of 4 Goals Met Today
            </div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.4 }}>
              Consistently tracking habits improves mood resilience by 34%.
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity Log */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          padding: 22,
          borderRadius: 20,
          background: "var(--bg-glass)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border-secondary)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Recent Activity
          </h4>
          <Link href="/timeline" style={{ fontSize: 12, color: "#3b82f6", fontWeight: 700, textDecoration: "none" }}>
            History →
          </Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { icon: "😊", title: "Logged Mood: Calm (4/5)", time: "2h ago", color: "#22c55e" },
            { icon: "📝", title: `Journal Entry #${journalCount || 1}`, time: "Today", color: "#f59e0b" },
            { icon: "🫁", title: "4-7-8 Breathing Exercise", time: "Yesterday", color: "#ec4899" },
          ].map((act, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <span style={{ fontSize: 16 }}>{act.icon}</span>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {act.title}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{act.time}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </aside>
  );
}
