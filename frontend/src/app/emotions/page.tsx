"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const EMOTION_COLORS: Record<string, string> = {
  happy: "#22c55e",
  sad: "#3b82f6",
  fear: "#8b5cf6",
  anger: "#ef4444",
  stress: "#f97316",
  anxiety: "#f59e0b",
  loneliness: "#ec4899",
  burnout: "#64748b",
  confidence: "#06b6d4",
  neutral: "#9ca3af",
};

export default function EmotionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [text, setText] = useState("");
  const [useAI, setUseAI] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text to analyze");
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/emotions/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, use_ai: useAI }),
      });
      if (res.ok) {
        const json = await res.json();
        setResults(json.emotions || {});
        toast.success("Emotion analysis complete!");
      } else {
        toast.error("Analysis failed");
      }
    } catch {
      toast.error("Network error");
    }
    setAnalyzing(false);
  };

  if (authLoading)
    return (
      <>
        <Sidebar />
        <div style={{ marginLeft: 260 }}>
          <PageSkeleton />
        </div>
      </>
    );
  if (!user) return null;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-primary)",
      }}
    >
      <Sidebar />
      <main
        style={{
          flex: 1,
          marginLeft: 260,
          padding: "32px 28px",
          maxWidth: 800,
          overflow: "auto",
        }}
      >
        <style>{`
          @media (max-width: 767px) { main { margin-left: 0 !important; padding: 16px !important; } }
          @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        `}</style>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 4vw, 32px)",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            Emotion Detection 💭
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Paste or write text to detect nuanced underlying emotional states
          </p>
        </div>

        {/* Input Card */}
        <div
          style={{
            padding: "24px",
            borderRadius: 20,
            background: "var(--bg-glass)",
            border: "0.5px solid var(--border-secondary)",
            marginBottom: 28,
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe your day, thoughts, or feelings..."
            style={{
              width: "100%",
              minHeight: 140,
              padding: "14px",
              borderRadius: 12,
              background: "var(--bg-secondary)",
              border: "0.5px solid var(--border-secondary)",
              color: "var(--text-primary)",
              fontSize: 14,
              lineHeight: 1.7,
              outline: "none",
              resize: "vertical",
              fontFamily: "var(--font-body)",
              marginBottom: 16,
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
              />
              Use AI Deep Analysis (Groq / Claude)
            </label>

            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              style={{
                padding: "12px 28px",
                borderRadius: 12,
                background: analyzing
                  ? "var(--bg-tertiary)"
                  : "linear-gradient(135deg, #06b6d4, #3b82f6)",
                border: "none",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                cursor: analyzing ? "default" : "pointer",
              }}
            >
              {analyzing ? "Detecting..." : "Detect Emotions ✨"}
            </button>
          </div>
        </div>

        {/* Results Card */}
        {results && (
          <div
            style={{
              padding: "24px",
              borderRadius: 20,
              background: "var(--bg-glass)",
              border: "0.5px solid var(--border-secondary)",
              animation: "popIn 0.3s ease",
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 20,
                fontFamily: "var(--font-display)",
              }}
            >
              Emotional Breakdown
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {Object.entries(results).map(([emotion, pct]) => {
                const color = EMOTION_COLORS[emotion.toLowerCase()] || "#3b82f6";
                return (
                  <div key={emotion}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: 6,
                        textTransform: "capitalize",
                      }}
                    >
                      <span>{emotion}</span>
                      <span style={{ color }}>{pct}%</span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: 8,
                        borderRadius: 4,
                        background: "var(--bg-tertiary)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: color,
                          borderRadius: 4,
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
