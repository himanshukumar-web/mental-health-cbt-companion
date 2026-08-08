"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AndroidMobileLayout from "./AndroidMobileLayout";
import { TopAppBar, MaterialCard, Button, LoadingSkeleton } from "./ui";
import toast from "react-hot-toast";
import { API_URL } from "@/lib/config";

const EMOTION_COLORS: Record<string, string> = {
  happy: "#22c55e", sad: "#3b82f6", fear: "#8b5cf6", anger: "#ef4444", stress: "#f97316",
  anxiety: "#f59e0b", loneliness: "#ec4899", burnout: "#64748b", confidence: "#06b6d4", neutral: "#9ca3af",
};

export default function AndroidEmotions() {
  const { user } = useAuth();
  const router = useRouter();

  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<Record<string, number> | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) { toast.error("Please enter some text"); return; }
    setAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/emotions/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, use_ai: true }),
      });
      if (res.ok) {
        const json = await res.json();
        setResults(json.emotions || {});
        toast.success("AI Emotion Analysis Complete!");
      } else toast.error("Analysis failed");
    } catch { toast.error("Network error"); }
    setAnalyzing(false);
  };

  return (
    <AndroidMobileLayout hasBottomNav={true}>
      <TopAppBar title="Emotion Detection" subtitle="Deep AI sentiment analysis" />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <MaterialCard variant="elevated">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Describe how you're feeling right now..."
            style={{ width: "100%", minHeight: "150px", padding: "14px", borderRadius: "16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8edf5", fontSize: "15px", lineHeight: 1.6, resize: "none", outline: "none", marginBottom: "16px" }}
          />
          <Button fullWidth loading={analyzing} onClick={handleAnalyze}>Analyze Emotional State ✨</Button>
        </MaterialCard>

        {results && (
          <MaterialCard variant="filled" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#e8edf5", margin: 0 }}>Emotional Breakdown</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {Object.entries(results).map(([emotion, pct]) => {
                const color = EMOTION_COLORS[emotion.toLowerCase()] || "#3b82f6";
                return (
                  <div key={emotion}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 700, color: "#e8edf5", marginBottom: "4px", textTransform: "capitalize" }}>
                      <span>{emotion}</span>
                      <span style={{ color }}>{pct}%</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", borderRadius: "4px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "4px", transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </MaterialCard>
        )}
      </div>
    </AndroidMobileLayout>
  );
}
