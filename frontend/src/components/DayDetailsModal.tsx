"use client";

import { DayDetails } from "@/types/heatmap";
import { motion, AnimatePresence } from "framer-motion";

interface DayDetailsModalProps {
  details: DayDetails | null;
  onClose: () => void;
  loading?: boolean;
}

export default function DayDetailsModal({ details, onClose, loading = false }: DayDetailsModalProps) {
  if (!details && !loading) return null;

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 600,
            maxHeight: "85vh",
            overflowY: "auto",
            borderRadius: 24,
            background: "var(--bg-primary)",
            border: "1px solid var(--border-secondary)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#22c55e" }}>
                Daily Activity Log
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: "2px 0 0" }}>
                {details?.date ? new Date(details.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "Day Details"}
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "1px solid var(--border-secondary)",
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)" }}>
              Loading day details...
            </div>
          ) : details ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Mood Entry */}
              <div style={{ padding: 14, borderRadius: 14, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase" }}>
                  😊 Mood Check-in
                </div>
                {details.mood ? (
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>
                    Score: {details.mood.mood_score}/10 — {details.mood.note || "No note recorded"}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4 }}>No mood check-in on this day.</div>
                )}
              </div>

              {/* Journal Entries */}
              <div style={{ padding: 14, borderRadius: 14, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase" }}>
                  📝 Journal Reflections ({details.journals.length})
                </div>
                {details.journals.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                    {details.journals.map((j, idx) => (
                      <div key={idx} style={{ fontSize: 13, color: "var(--text-primary)", background: "var(--bg-secondary)", padding: 8, borderRadius: 8 }}>
                        <strong>{j.title || "Untitled"}:</strong> {j.content}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4 }}>No journal entries on this day.</div>
                )}
              </div>

              {/* CBT Worksheets */}
              <div style={{ padding: 14, borderRadius: 14, background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#06b6d4", textTransform: "uppercase" }}>
                  🧠 CBT Reframing Worksheets ({details.cbt_worksheets.length})
                </div>
                {details.cbt_worksheets.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                    {details.cbt_worksheets.map((w, idx) => (
                      <div key={idx} style={{ fontSize: 13, color: "var(--text-primary)", background: "var(--bg-secondary)", padding: 8, borderRadius: 8 }}>
                        <strong>Trigger:</strong> {w.trigger_event || "N/A"} | <strong>Reframed:</strong> {w.rational_thought || w.alternative_thought}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4 }}>No CBT worksheets completed on this day.</div>
                )}
              </div>

              {/* Clinical Assessments */}
              <div style={{ padding: 14, borderRadius: 14, background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#a855f7", textTransform: "uppercase" }}>
                  📋 Clinical Test Results
                </div>
                <div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 4 }}>
                  {details.phq9 ? `PHQ-9 Depression: ${details.phq9.score}/27 (${details.phq9.risk_category})` : "PHQ-9: Not taken"}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>
                  {details.gad7 ? `GAD-7 Anxiety: ${details.gad7.score}/21 (${details.gad7.anxiety_level})` : "GAD-7: Not taken"}
                </div>
              </div>

              {/* Activity Summary */}
              <div style={{ padding: 12, borderRadius: 12, background: "var(--bg-secondary)", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                🤖 {details.summary}
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
