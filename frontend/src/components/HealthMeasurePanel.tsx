"use client";

import { useState } from "react";
import { useHealthMeasure, DailyCheckIn, WeeklySummary } from "@/hooks/useHealthMeasure";

interface HealthMeasurePanelProps {
  userId?: string;
  compact?: boolean;
}

/* ── Rating selector ────────────────────────────────────────────────────── */

const RATINGS = [
  { value: 1, emoji: "😢", label: "Poor" },
  { value: 2, emoji: "😟", label: "Low" },
  { value: 3, emoji: "😐", label: "Fair" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

/* ── Helper: trend display ──────────────────────────────────────────────── */

function getTrendDisplay(trend: WeeklySummary["trend"]) {
  switch (trend) {
    case "improving": return { icon: "📈", label: "Improving", color: "#22c55e" };
    case "stable": return { icon: "⚖️", label: "Stable", color: "#3b82f6" };
    case "declining": return { icon: "📉", label: "Needs attention", color: "#f59e0b" };
    default: return { icon: "📊", label: "Not enough data", color: "var(--text-tertiary)" };
  }
}

/* ── Score color ─────────────────────────────────────────────────────────── */

function getScoreColor(score: number) {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#3b82f6";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

/* ── Main component ─────────────────────────────────────────────────────── */

export default function HealthMeasurePanel({ userId, compact = false }: HealthMeasurePanelProps) {
  const {
    dailyCheckIn,
    weeklySummary,
    completeDailyCheckIn,
    loading,
    todaysDimension,
  } = useHealthMeasure(userId);

  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedRating || submitting) return;
    setSubmitting(true);
    await completeDailyCheckIn(selectedRating);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{
        padding: compact ? 16 : 24,
        borderRadius: 20,
        background: "var(--bg-glass)",
        border: "1px solid var(--border-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: compact ? 100 : 160,
      }}>
        <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Loading Health Measure...</span>
      </div>
    );
  }

  /* ── Compact mode (dashboard widget) ──────────────────────────────── */
  if (compact) {
    return (
      <div style={{
        padding: 18,
        borderRadius: 18,
        background: dailyCheckIn.completed
          ? "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04))"
          : "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.04))",
        border: dailyCheckIn.completed
          ? "1px solid rgba(34,197,94,0.3)"
          : "1px solid rgba(139,92,246,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: dailyCheckIn.completed ? "rgba(34,197,94,0.2)" : "rgba(139,92,246,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20,
          }}>
            {dailyCheckIn.completed ? "✅" : "🩺"}
          </div>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const,
              color: dailyCheckIn.completed ? "#22c55e" : "#8b5cf6",
              letterSpacing: "0.06em",
            }}>
              Daily Health Measure
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>
              {dailyCheckIn.completed
                ? `Completed — ${todaysDimension.label}`
                : `Today: ${todaysDimension.label}`
              }
            </div>
          </div>
        </div>
        <div style={{
          padding: "6px 12px",
          borderRadius: 10,
          background: dailyCheckIn.completed ? "rgba(34,197,94,0.2)" : "rgba(139,92,246,0.15)",
          color: dailyCheckIn.completed ? "#86efac" : "#c4b5fd",
          fontSize: 12,
          fontWeight: 700,
        }}>
          {dailyCheckIn.completed ? `${dailyCheckIn.rating}/5` : "Pending"}
        </div>
      </div>
    );
  }

  /* ── Full panel mode ──────────────────────────────────────────────── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Section header */}
      <div>
        <span style={{
          fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const,
          color: "#8b5cf6", letterSpacing: "0.08em",
        }}>
          Health Measure System
        </span>
        <h2 style={{
          fontSize: 20, fontWeight: 800, color: "var(--text-primary)",
          margin: "4px 0 0", fontFamily: "var(--font-display)",
        }}>
          Daily Check-in & Weekly Progress 🩺
        </h2>
      </div>

      {/* ── TODAY'S CHECK-IN CARD ───────────────────────────────────── */}
      <div style={{
        padding: 24,
        borderRadius: 20,
        background: dailyCheckIn.completed
          ? "linear-gradient(145deg, rgba(34,197,94,0.10), rgba(16,185,129,0.04))"
          : "var(--bg-glass)",
        backdropFilter: "blur(16px)",
        border: dailyCheckIn.completed
          ? "1px solid rgba(34,197,94,0.3)"
          : "1px solid var(--border-secondary)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 16,
              background: `${todaysDimension.color}20`,
              border: `1px solid ${todaysDimension.color}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, flexShrink: 0,
            }}>
              {todaysDimension.icon}
            </div>
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const,
                color: todaysDimension.color, letterSpacing: "0.06em",
              }}>
                Today&apos;s Check-in
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>
                {todaysDimension.label}
              </div>
            </div>
          </div>

          <StatusBadge checkIn={dailyCheckIn} />
        </div>

        {/* Question + Rating selector */}
        {!dailyCheckIn.completed ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
              {todaysDimension.question}
            </p>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {RATINGS.map((r) => {
                const isSelected = selectedRating === r.value;
                return (
                  <button
                    key={r.value}
                    onClick={() => setSelectedRating(r.value)}
                    style={{
                      flex: 1,
                      minWidth: 56,
                      padding: "12px 8px",
                      borderRadius: 14,
                      border: isSelected
                        ? `2px solid ${todaysDimension.color}`
                        : "1px solid var(--border-secondary)",
                      background: isSelected
                        ? `${todaysDimension.color}15`
                        : "var(--bg-secondary)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{r.emoji}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: isSelected ? todaysDimension.color : "var(--text-secondary)",
                    }}>
                      {r.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selectedRating || submitting}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 14,
                background: selectedRating
                  ? `linear-gradient(135deg, ${todaysDimension.color}, ${todaysDimension.color}cc)`
                  : "var(--bg-tertiary)",
                border: "none",
                color: selectedRating ? "white" : "var(--text-tertiary)",
                fontSize: 15,
                fontWeight: 700,
                cursor: selectedRating ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: selectedRating ? `0 4px 20px ${todaysDimension.color}40` : "none",
                transition: "all 0.2s ease",
              }}
            >
              {submitting ? "Saving..." : "Complete Today's Check-in ✓"}
            </button>
          </div>
        ) : (
          <div style={{
            padding: 16, borderRadius: 14,
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.2)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>
              {RATINGS.find((r) => r.value === dailyCheckIn.rating)?.emoji || "✅"}
            </span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#22c55e" }}>
                Check-in complete! Rated: {dailyCheckIn.rating}/5 — {RATINGS.find((r) => r.value === dailyCheckIn.rating)?.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>
                Tomorrow&apos;s dimension will rotate automatically.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── WEEKLY SUMMARY CARD ────────────────────────────────────── */}
      <WeeklySummaryCard summary={weeklySummary} />
    </div>
  );
}

/* ── Status badge sub-component ─────────────────────────────────────────── */

function StatusBadge({ checkIn }: { checkIn: DailyCheckIn }) {
  if (checkIn.completed) {
    return (
      <span style={{
        padding: "6px 14px", borderRadius: 12,
        background: "rgba(34,197,94,0.2)",
        color: "#86efac", fontSize: 12, fontWeight: 700,
        border: "1px solid rgba(34,197,94,0.3)",
      }}>
        ✅ Completed
      </span>
    );
  }
  return (
    <span style={{
      padding: "6px 14px", borderRadius: 12,
      background: "rgba(245,158,11,0.12)",
      color: "#fcd34d", fontSize: 12, fontWeight: 700,
      border: "1px solid rgba(245,158,11,0.3)",
    }}>
      ⏳ Not completed
    </span>
  );
}

/* ── Weekly summary sub-component ───────────────────────────────────────── */

function WeeklySummaryCard({ summary }: { summary: WeeklySummary | null }) {
  if (!summary) {
    return (
      <div style={{
        padding: 24, borderRadius: 20,
        background: "var(--bg-glass)",
        border: "1px solid var(--border-secondary)",
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: 120,
      }}>
        <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
          Weekly summary will appear after your first check-in.
        </span>
      </div>
    );
  }

  const trendInfo = getTrendDisplay(summary.trend);
  const completionPct = summary.totalDays > 0
    ? Math.round((summary.daysCompleted / summary.totalDays) * 100)
    : 0;

  // Generate day labels for the week
  const weekDays = [];
  const startDate = new Date(summary.weekStart + "T12:00:00");
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toLocaleDateString("en-CA");
    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
    const entry = summary.scores.find((s) => s.date === dateStr);
    const today = new Date().toLocaleDateString("en-CA");
    const isFuture = dateStr > today;
    weekDays.push({ dateStr, dayLabel, score: entry?.score ?? null, isFuture });
  }

  return (
    <div style={{
      padding: 24, borderRadius: 20,
      background: "var(--bg-glass)",
      backdropFilter: "blur(16px)",
      border: "1px solid var(--border-secondary)",
      display: "flex", flexDirection: "column", gap: 16,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const,
            color: "#06b6d4", letterSpacing: "0.06em",
          }}>
            Weekly Summary
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>
            This Week&apos;s Progress
          </div>
        </div>

        <div style={{
          padding: "6px 12px", borderRadius: 12,
          background: `${trendInfo.color}20`,
          color: trendInfo.color,
          fontSize: 12, fontWeight: 700,
          border: `1px solid ${trendInfo.color}40`,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span>{trendInfo.icon}</span>
          <span>{trendInfo.label}</span>
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div style={{
          padding: 14, borderRadius: 14,
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.2)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#22c55e" }}>
            {summary.daysCompleted}/{summary.totalDays}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
            Days Completed
          </div>
        </div>

        <div style={{
          padding: 14, borderRadius: 14,
          background: "rgba(59,130,246,0.08)",
          border: "1px solid rgba(59,130,246,0.2)",
          textAlign: "center",
        }}>
          <div style={{
            fontSize: 22, fontWeight: 900,
            color: summary.averageScore ? getScoreColor(summary.averageScore) : "var(--text-tertiary)",
          }}>
            {summary.averageScore !== null ? `${summary.averageScore}` : "—"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
            Avg Score
          </div>
        </div>

        <div style={{
          padding: 14, borderRadius: 14,
          background: "rgba(139,92,246,0.08)",
          border: "1px solid rgba(139,92,246,0.2)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#8b5cf6" }}>
            {completionPct}%
          </div>
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
            Completion
          </div>
        </div>
      </div>

      {/* Day-by-day mini chart */}
      <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
        {weekDays.map((day) => (
          <div key={day.dateStr} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", gap: 6,
          }}>
            {/* Bar */}
            <div style={{
              width: "100%", height: 48, borderRadius: 8,
              background: day.isFuture
                ? "var(--bg-secondary)"
                : day.score !== null
                  ? `${getScoreColor(day.score)}30`
                  : "rgba(255,255,255,0.04)",
              border: day.score !== null
                ? `1px solid ${getScoreColor(day.score)}50`
                : "1px solid var(--border-secondary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}>
              {day.score !== null && (
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: `${day.score}%`,
                  background: `${getScoreColor(day.score)}40`,
                  borderRadius: "0 0 7px 7px",
                }} />
              )}
              <span style={{
                fontSize: 10, fontWeight: 700, position: "relative", zIndex: 1,
                color: day.isFuture ? "var(--text-muted)" : day.score !== null ? getScoreColor(day.score) : "var(--text-tertiary)",
              }}>
                {day.isFuture ? "—" : day.score !== null ? day.score : "✗"}
              </span>
            </div>
            {/* Label */}
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: day.dateStr === new Date().toLocaleDateString("en-CA")
                ? "#22c55e"
                : "var(--text-tertiary)",
            }}>
              {day.dayLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
