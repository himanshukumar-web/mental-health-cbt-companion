"use client";

import { PersonalizedInsight } from "@/types/persona";
import { motion } from "framer-motion";

interface InsightChartCardProps {
  insights: PersonalizedInsight[];
  loading?: boolean;
}

export default function InsightChartCard({ insights, loading = false }: InsightChartCardProps) {
  if (loading) {
    return (
      <div
        style={{
          padding: 20,
          borderRadius: 16,
          background: "var(--bg-glass)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--border-secondary)",
          textAlign: "center",
          color: "var(--text-tertiary)",
          fontSize: 13,
        }}
      >
        Analyzing patterns & generating personalized insights...
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
        💡 Personalized AI Insights
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        {insights.map((insight) => (
          <motion.div
            key={insight.id}
            whileHover={{ y: -2 }}
            style={{
              padding: 16,
              borderRadius: 16,
              background: "var(--bg-glass)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--border-secondary)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24, padding: 6, borderRadius: 10, background: "var(--bg-secondary)" }}>
                {insight.icon}
              </span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{insight.title}</div>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
              {insight.description}
            </p>

            <div
              style={{
                marginTop: 4,
                padding: "8px 10px",
                borderRadius: 10,
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)",
                fontSize: 12,
                color: "#22c55e",
                fontWeight: 600,
              }}
            >
              💡 Recommendation: {insight.recommendation}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
