"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/config";

interface QuickMoodLoggerProps {
  userId: string;
  onMoodLogged?: () => void;
}

const MOOD_OPTIONS = [
  { label: "Radiant", emoji: "😄", score: 5, color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  { label: "Calm", emoji: "😊", score: 4, color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  { label: "Okay", emoji: "😐", score: 3, color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  { label: "Stressed", emoji: "😰", score: 2, color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  { label: "Low", emoji: "😔", score: 1, color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
];

export default function QuickMoodLogger({ userId, onMoodLogged }: QuickMoodLoggerProps) {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleLogMood = async (option: typeof MOOD_OPTIONS[0]) => {
    if (submitting) return;
    setSubmitting(option.label);

    try {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const res = await fetch(`${API_URL}/mood-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          date: todayStr,
          mood_score: option.score,
          mood_emoji: option.emoji,
          stress_level: option.score <= 2 ? 4 : option.score === 3 ? 2 : 1,
          notes: `Logged via Quick Dashboard Check-in (${option.label})`,
        }),
      });

      if (res.ok) {
        setToastMessage(`Logged "${option.emoji} ${option.label}"! +15 XP 🌟`);
        onMoodLogged?.();
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch {
      /* ignore */
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div
      style={{
        padding: "22px 24px",
        borderRadius: 20,
        background: "var(--bg-glass)",
        backdropFilter: "blur(16px)",
        border: "1px solid var(--border-secondary)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#22c55e",
              letterSpacing: "0.08em",
            }}
          >
            Daily Check-In
          </span>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: "2px 0 0",
              fontFamily: "var(--font-display)",
            }}
          >
            How are you feeling right now? 🌿
          </h3>
        </div>

        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                padding: "6px 14px",
                borderRadius: 12,
                background: "rgba(34,197,94,0.2)",
                border: "1px solid rgba(34,197,94,0.4)",
                color: "#86efac",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(56px, 1fr))",
          gap: 10,
        }}
      >
        {MOOD_OPTIONS.map((opt) => {
          const isCurrent = submitting === opt.label;
          return (
            <motion.button
              key={opt.label}
              whileHover={{ scale: 1.06, translateY: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleLogMood(opt)}
              disabled={!!submitting}
              style={{
                padding: "14px 10px",
                borderRadius: 16,
                border: `1px solid ${opt.color}35`,
                background: opt.bg,
                cursor: submitting ? "default" : "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: 28, filter: isCurrent ? "brightness(1.2)" : "none" }}>
                {opt.emoji}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: opt.color,
                }}
              >
                {opt.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
