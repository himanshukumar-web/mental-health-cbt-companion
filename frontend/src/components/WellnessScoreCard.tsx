"use client";

import { WellnessScore } from "@/types/persona";
import { motion } from "framer-motion";

interface WellnessScoreCardProps {
  scoreData: WellnessScore | null;
  loading?: boolean;
}

export default function WellnessScoreCard({ scoreData, loading = false }: WellnessScoreCardProps) {
  if (loading || !scoreData) {
    return (
      <div
        style={{
          padding: 24,
          borderRadius: 20,
          background: "var(--bg-glass)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border-secondary)",
          minHeight: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Calculating AI Wellness Score...</div>
      </div>
    );
  }

  const total_score = typeof scoreData.total_score === "number" ? scoreData.total_score : 78;
  const breakdown = scoreData.breakdown || {
    mood: 18,
    sleep: 16,
    stress: 15,
    journal: 10,
    habits: 10,
    meditation: 9,
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#3b82f6";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Thriving & Balanced 🌿";
    if (score >= 60) return "Good Emotional Health ✨";
    if (score >= 40) return "Moderate Wellness ⚖️";
    return "Needs Care & Self-Compassion 💙";
  };

  const scoreColor = getScoreColor(total_score);

  const METRICS = [
    { label: "Mood", score: breakdown.mood ?? 18, max: 25, color: "#22c55e" },
    { label: "Sleep", score: breakdown.sleep ?? 16, max: 20, color: "#06b6d4" },
    { label: "Stress", score: breakdown.stress ?? 15, max: 20, color: "#a855f7" },
    { label: "Journal", score: breakdown.journal ?? 10, max: 12, color: "#f59e0b" },
    { label: "Habits", score: breakdown.habits ?? 10, max: 13, color: "#ec4899" },
    { label: "Meditation", score: breakdown.meditation ?? 9, max: 10, color: "#10b981" },
  ];

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
        gap: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: scoreColor, letterSpacing: "0.08em" }}>
            AI Wellness Engine
          </span>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: "2px 0 0" }}>
            Overall Wellness Score
          </h3>
        </div>

        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: 12,
            background: `${scoreColor}20`,
            color: scoreColor,
            border: `1px solid ${scoreColor}40`,
          }}
        >
          {getScoreLabel(total_score)}
        </span>
      </div>

      {/* Main Score Display */}
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ position: "relative", width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" stroke="var(--bg-secondary)" strokeWidth="10" fill="none" />
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke={scoreColor}
              strokeWidth="10"
              fill="none"
              strokeDasharray={264}
              strokeDashoffset={264 - (264 * total_score) / 100}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div style={{ position: "absolute", textAlign: "center" }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: "var(--text-primary)" }}>{total_score}</span>
            <span style={{ fontSize: 11, color: "var(--text-tertiary)", display: "block" }}>/100</span>
          </div>
        </div>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {METRICS.map((m) => (
            <div key={m.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{m.label}</span>
                <span style={{ color: m.color, fontWeight: 700 }}>
                  {m.score}/{m.max}
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "var(--bg-secondary)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(m.score / m.max) * 100}%`,
                    background: m.color,
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
