"use client";

import { HeatmapDay } from "@/types/heatmap";
import { motion } from "framer-motion";

interface CalendarHeatmapProps {
  data: HeatmapDay[];
  onDayClick: (date: string) => void;
  daysToDisplay?: number; // 30, 90, or 365
}

export default function CalendarHeatmap({
  data,
  onDayClick,
  daysToDisplay = 30,
}: CalendarHeatmapProps) {
  // Generate date array for the last N days
  const today = new Date();
  const daysArray = Array.from({ length: daysToDisplay }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (daysToDisplay - 1 - i));
    return d.toISOString().split("T")[0];
  });

  const scoreMap = new Map(data.map((item) => [item.date, item.score]));

  const getSquareColor = (score: number | undefined) => {
    if (score === undefined) return "var(--bg-secondary)";
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#3b82f6";
    if (score >= 40) return "#f59e0b";
    if (score > 0) return "#ef4444";
    return "var(--bg-secondary)";
  };

  return (
    <div
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#22c55e", letterSpacing: "0.08em" }}>
            Consistency Heatmap
          </span>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: "2px 0 0" }}>
            Mental Wellness Contribution Grid
          </h3>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-tertiary)" }}>
          <span>Less</span>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: "var(--bg-secondary)" }} />
          <div style={{ width: 12, height: 12, borderRadius: 3, background: "#ef4444" }} />
          <div style={{ width: 12, height: 12, borderRadius: 3, background: "#f59e0b" }} />
          <div style={{ width: 12, height: 12, borderRadius: 3, background: "#3b82f6" }} />
          <div style={{ width: 12, height: 12, borderRadius: 3, background: "#22c55e" }} />
          <span>More</span>
        </div>
      </div>

      {/* Contribution Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fill, minmax(20px, 1fr))`,
          gap: 6,
          padding: 8,
          borderRadius: 14,
          background: "var(--bg-secondary)",
        }}
      >
        {daysArray.map((dateStr) => {
          const score = scoreMap.get(dateStr);
          const color = getSquareColor(score);
          const dayFormatted = new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });

          return (
            <motion.button
              key={dateStr}
              whileHover={{ scale: 1.25, zIndex: 10 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDayClick(dateStr)}
              title={`${dayFormatted}: Wellness Score ${score !== undefined ? score : "No Log"}`}
              style={{
                width: 22,
                height: 22,
                borderRadius: 5,
                background: color,
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: score !== undefined ? `0 2px 8px ${color}40` : "none",
              }}
            />
          );
        })}
      </div>

      <div style={{ fontSize: 12, color: "var(--text-tertiary)", textAlign: "right" }}>
        💡 Click on any day to view detailed Mood, Journal, Habits & AI Chat breakdown.
      </div>
    </div>
  );
}
