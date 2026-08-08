"use client";

import React, { useState } from "react";
import AndroidMobileLayout from "./AndroidMobileLayout";
import { MD3TopAppBar } from "./ui/TopAppBar";
import { MD3Card } from "./ui/Card";

export default function AndroidAnalytics() {
  const [range, setRange] = useState<"7d" | "30d">("7d");

  return (
    <AndroidMobileLayout>
      <MD3TopAppBar title="Analytics & Trends" subtitle="CBT Data & Emotional Patterns" />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Time Range Selector */}
        <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.05)", borderRadius: "100px", padding: "4px" }}>
          {(["7d", "30d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "100px",
                border: "none",
                background: range === r ? "linear-gradient(135deg, #22c55e, #16a34a)" : "transparent",
                color: range === r ? "#ffffff" : "#8b95a7",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {r === "7d" ? "Past 7 Days" : "Past 30 Days"}
            </button>
          ))}
        </div>

        {/* Summary Metric Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <MD3Card variant="filled">
            <span style={{ fontSize: "12px", color: "#8b95a7", fontWeight: 600 }}>AVG MOOD</span>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#4ade80", marginTop: "4px" }}>
              7.4 <span style={{ fontSize: "12px", color: "#8b95a7" }}>/10</span>
            </div>
            <span style={{ fontSize: "11px", color: "#22c55e" }}>+12% vs last week</span>
          </MD3Card>

          <MD3Card variant="filled">
            <span style={{ fontSize: "12px", color: "#8b95a7", fontWeight: 600 }}>AVG STRESS</span>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#f59e0b", marginTop: "4px" }}>
              3.2 <span style={{ fontSize: "12px", color: "#8b95a7" }}>/10</span>
            </div>
            <span style={{ fontSize: "11px", color: "#22c55e" }}>-18% reduction</span>
          </MD3Card>
        </div>

        {/* Mood Distribution Card */}
        <MD3Card variant="elevated">
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#e8edf5", margin: "0 0 12px 0" }}>
            Mood Breakdown ({range})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { label: "Good / Awesome (7-10)", percent: 65, color: "#22c55e" },
              { label: "Neutral / Okay (4-6)", percent: 25, color: "#3b82f6" },
              { label: "Down / Bad (1-3)", percent: 10, color: "#ef4444" },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#8b95a7", marginBottom: "4px" }}>
                  <span>{item.label}</span>
                  <span style={{ fontWeight: 700, color: "#e8edf5" }}>{item.percent}%</span>
                </div>
                <div style={{ width: "100%", height: "8px", borderRadius: "4px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  <div style={{ width: `${item.percent}%`, height: "100%", background: item.color, borderRadius: "4px" }} />
                </div>
              </div>
            ))}
          </div>
        </MD3Card>

        {/* Insight Highlights */}
        <MD3Card variant="filled" style={{ borderLeft: "4px solid #22c55e" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#e8edf5", marginBottom: "4px" }}>
            💡 MindMate Insight
          </div>
          <p style={{ fontSize: "13px", color: "#8b95a7", margin: 0, lineHeight: 1.5 }}>
            Your highest mood scores occur on days you complete morning meditation and sleep 7+ hours.
          </p>
        </MD3Card>
      </div>
    </AndroidMobileLayout>
  );
}
