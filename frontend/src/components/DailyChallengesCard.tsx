"use client";

import { DailyChallenge, UserStreak } from "@/types/heatmap";
import { motion } from "framer-motion";

interface DailyChallengesCardProps {
  challenges: DailyChallenge[];
  streak: UserStreak;
  onCompleteChallenge: (challengeId: string) => void;
  loading?: boolean;
}

export default function DailyChallengesCard({
  challenges,
  streak,
  onCompleteChallenge,
  loading = false,
}: DailyChallengesCardProps) {
  if (loading) {
    return (
      <div
        style={{
          padding: 24,
          borderRadius: 20,
          background: "var(--bg-glass)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border-secondary)",
          textAlign: "center",
          color: "var(--text-tertiary)",
          fontSize: 13,
        }}
      >
        Loading Daily Challenges...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        padding: 24,
        borderRadius: 20,
        background: "var(--bg-glass)",
        backdropFilter: "blur(16px)",
        border: "1px solid var(--border-secondary)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        width: "100%",
      }}
    >
      {/* Header & Streak Counter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#f59e0b", letterSpacing: "0.08em" }}>
            Gamification Engine
          </span>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: "2px 0 0" }}>
            Daily Challenges & Streaks
          </h3>
        </div>

        <div
          style={{
            padding: "8px 14px",
            borderRadius: 14,
            background: "rgba(245,158,11,0.12)",
            border: "1px solid rgba(245,158,11,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 20 }}>🔥</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#f59e0b" }}>
              {typeof streak?.current_streak === "number" ? streak.current_streak : 0} Day Streak
            </div>
            <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>
              Best: {typeof streak?.longest_streak === "number" ? streak.longest_streak : 0} days
            </div>
          </div>
        </div>
      </div>

      {/* Challenges List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {challenges.map((c) => {
          const isDone = c.completed;
          return (
            <div
              key={c.id}
              style={{
                padding: "12px 16px",
                borderRadius: 14,
                border: isDone ? "1px solid rgba(34,197,94,0.3)" : "1px solid var(--border-secondary)",
                background: isDone ? "rgba(34,197,94,0.08)" : "var(--bg-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: isDone ? "#22c55e" : "var(--text-primary)" }}>
                    {c.title}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 6,
                      background: "rgba(245,158,11,0.15)",
                      color: "#f59e0b",
                    }}
                  >
                    +{c.reward_xp} XP
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
                  Progress: {c.current} / {c.target}
                </div>
              </div>

              <button
                disabled={isDone}
                onClick={() => onCompleteChallenge(c.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: isDone ? "rgba(34,197,94,0.2)" : "linear-gradient(135deg, #f59e0b, #ea580c)",
                  color: isDone ? "#22c55e" : "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isDone ? "default" : "pointer",
                }}
              >
                {isDone ? "✓ Claimed" : "Claim XP"}
              </button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
