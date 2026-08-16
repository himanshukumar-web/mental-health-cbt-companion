"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export interface RightSidebarActivity {
  icon: string;
  title: string;
  time: string;
  color: string;
}

export interface DesktopRightSidebarProps {
  moodEntries?: unknown[];
  journalCount?: number;
  streakDays?: number;
  userLevel?: number;
  userXP?: number;
  todayMood?: {
    mood_score?: number;
    mood_emoji?: string;
    label?: string;
  } | null;
  todaySleep?: number | null;
  todayWater?: number | null;
  todayMeditation?: number | boolean | null;
  completedHabitsCount?: number;
  totalHabitsCount?: number;
  habitPercentage?: number;
  recentActivities?: RightSidebarActivity[];
}

export default function DesktopRightSidebar({
  streakDays = 1,
  todayMood = null,
  todaySleep = null,
  todayWater = null,
  todayMeditation = null,
  completedHabitsCount = 0,
  totalHabitsCount = 4,
  habitPercentage = 0,
  recentActivities = [],
}: DesktopRightSidebarProps) {
  const safePercentage = Math.min(100, Math.max(0, Math.round(habitPercentage)));
  const circumference = 176;
  const strokeOffset = circumference - (circumference * safePercentage) / 100;

  return (
    <aside
      className="custom-scrollbar"
      style={{
        width: 320,
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600 }}>Mood</span>
              <span style={{ fontSize: 18 }}>{todayMood?.mood_emoji || "—"}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: todayMood ? "var(--text-primary)" : "var(--text-secondary)" }}>
              {todayMood ? (todayMood.mood_score ? `${todayMood.mood_score}/5` : todayMood.label || "Logged") : "Not logged"}
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600 }}>Sleep</span>
              <span style={{ fontSize: 18 }}>😴</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: todaySleep !== null && todaySleep !== undefined ? "#3b82f6" : "var(--text-secondary)" }}>
              {todaySleep !== null && todaySleep !== undefined ? `${todaySleep} hrs` : "Not logged"}
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600 }}>Water</span>
              <span style={{ fontSize: 18 }}>💧</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: todayWater !== null && todayWater !== undefined ? "#06b6d4" : "var(--text-secondary)" }}>
              {todayWater !== null && todayWater !== undefined ? `${todayWater}/8 cups` : "Not logged"}
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600 }}>Meditation</span>
              <span style={{ fontSize: 18 }}>🧘</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: todayMeditation ? "#a855f7" : "var(--text-secondary)" }}>
              {todayMeditation ? (typeof todayMeditation === "number" ? `${todayMeditation} mins` : "Done today") : "Not logged"}
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
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                transform="rotate(-90 34 34)"
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <span style={{ position: "absolute", fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>
              {safePercentage}%
            </span>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 700 }}>
              {totalHabitsCount > 0
                ? `${completedHabitsCount} of ${totalHabitsCount} Goals Met Today`
                : "No Active Habits Tracked"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.4 }}>
              {safePercentage === 100
                ? "All daily mindful goals achieved today! 🌟"
                : safePercentage > 0
                ? "Great progress! Keep building your healthy daily habits."
                : "Start today's habits to build emotional resilience."}
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

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recentActivities.length > 0 ? (
            recentActivities.map((act, i) => (
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
            ))
          ) : (
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", fontStyle: "italic", padding: "8px 0" }}>
              No recent activity recorded yet.
            </div>
          )}
        </div>
      </motion.div>
    </aside>
  );
}
