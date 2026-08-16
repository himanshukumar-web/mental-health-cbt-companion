"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import toast from "react-hot-toast";
import { useIsAndroid } from "@/hooks/useIsAndroid";
import AndroidCBT from "@/components/mobile/AndroidCBT";
import { API_URL } from "@/lib/config";

interface CBTWorksheet {
  id: string;
  situation: string;
  automatic_thought: string;
  emotion: string;
  emotion_intensity: number | null;
  thinking_errors: string[] | string;
  alternative_thought: string | null;
  action_plan: string | null;
  ai_generated: boolean;
  created_at: string;
}

function DesktopCBTView() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [worksheets, setWorksheets] = useState<CBTWorksheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [situation, setSituation] = useState("");
  const [thought, setThought] = useState("");
  const [emotion, setEmotion] = useState("");
  const [intensity, setIntensity] = useState(70);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchWorksheets = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/cbt-worksheets/${user.id}`);
      if (res.ok) {
        const json = await res.json();
        setWorksheets(json.worksheets || []);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWorksheets();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchWorksheets]);

  const handleGenerate = async () => {
    if (!user || !situation.trim() || !thought.trim() || !emotion.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/cbt-worksheets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          situation,
          automatic_thought: thought,
          emotion,
          emotion_intensity: intensity,
          ai_generate: true,
        }),
      });

      if (res.ok) {
        toast.success("Worksheet generated with AI! 🧠");
        setSituation("");
        setThought("");
        setEmotion("");
        setShowForm(false);
        fetchWorksheets();
      } else {
        toast.error("Failed to generate worksheet");
      }
    } catch {
      toast.error("Network error");
    }
    setGenerating(false);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/cbt-worksheets/${id}?user_id=${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Worksheet deleted");
        fetchWorksheets();
      }
    } catch {
      toast.error("Delete failed");
    }
  };

  const parseErrors = (errors: string[] | string): string[] => {
    if (typeof errors === "string") {
      try {
        return JSON.parse(errors);
      } catch {
        return [];
      }
    }
    return errors || [];
  };

  if (authLoading || loading)
    return (
      <>
        <Sidebar />
        <div className="app-main-layout">
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
      <main className="app-main-layout" style={{ padding: "24px 20px", maxWidth: 900, overflow: "auto" }}>
        <MobileHeader title="CBT Worksheets" />
        <style>{`
          @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        `}</style>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 4vw, 32px)",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            CBT Cognitive Restructuring 🧠
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Challenge unhelpful automatic thoughts and construct balanced perspectives
          </p>
        </div>

        {/* Create Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: 14,
              background:
                "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(168,85,247,0.08))",
              border: "1px dashed rgba(34,197,94,0.3)",
              color: "#22c55e",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: 28,
            }}
          >
            🧠 Create New CBT Worksheet
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div
            style={{
              padding: "24px",
              borderRadius: 20,
              background: "var(--bg-glass)",
              border: "0.5px solid var(--border-secondary)",
              marginBottom: 28,
              animation: "popIn 0.3s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-display)",
                }}
              >
                Thought Challenging Form
              </h2>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--bg-tertiary)",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                1. Situation (What happened?)
              </label>
              <input
                type="text"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="e.g., Sent a text to my friend and they didn't reply for 3 hours."
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 10,
                  background: "var(--bg-secondary)",
                  border: "0.5px solid var(--border-secondary)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                2. Automatic Thought (What went through your mind?)
              </label>
              <textarea
                value={thought}
                onChange={(e) => setThought(e.target.value)}
                placeholder="e.g., They are ignoring me because they are mad at me and don't care about our friendship."
                style={{
                  width: "100%",
                  minHeight: 70,
                  padding: "12px",
                  borderRadius: 10,
                  background: "var(--bg-secondary)",
                  border: "0.5px solid var(--border-secondary)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 24,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-tertiary)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  3. Emotion Felt
                </label>
                <input
                  type="text"
                  value={emotion}
                  onChange={(e) => setEmotion(e.target.value)}
                  placeholder="e.g., Anxious, Rejected"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 10,
                    background: "var(--bg-secondary)",
                    border: "0.5px solid var(--border-secondary)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-tertiary)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Intensity (0-100%): {intensity}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={intensity}
                  onChange={(e) => setIntensity(parseInt(e.target.value))}
                  style={{ width: "100%", marginTop: 10 }}
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 12,
                background: generating
                  ? "var(--bg-tertiary)"
                  : "linear-gradient(135deg, #22c55e, #16a34a)",
                border: "none",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                cursor: generating ? "default" : "pointer",
              }}
            >
              {generating ? "AI Restructuring Thoughts..." : "Generate Balanced Alternative ✨"}
            </button>
          </div>
        )}

        {/* Worksheets List */}
        {worksheets.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 24px",
              color: "var(--text-tertiary)",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🧘</div>
            No CBT worksheets created yet. Try restructuring your first thought!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {worksheets.map((ws, i) => {
              const errs = parseErrors(ws.thinking_errors);
              return (
                <div
                  key={ws.id}
                  style={{
                    padding: "20px 24px",
                    borderRadius: 16,
                    background: "var(--bg-glass)",
                    border: "0.5px solid var(--border-secondary)",
                    animation: `popIn 0.3s ease ${i * 0.05}s both`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        Situation: {ws.situation}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-tertiary)",
                          marginTop: 2,
                        }}
                      >
                        Emotion: {ws.emotion} ({ws.emotion_intensity}%) •{" "}
                        {new Date(ws.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(ws.id)}
                      style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "none",
                        color: "#fca5a5",
                        borderRadius: 8,
                        padding: "6px 10px",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      🗑
                    </button>
                  </div>

                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: "rgba(239,68,68,0.05)",
                      border: "0.5px solid rgba(239,68,68,0.15)",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#fca5a5",
                        marginBottom: 4,
                      }}
                    >
                      AUTOMATIC THOUGHT
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
                      {ws.automatic_thought}
                    </div>
                  </div>

                  {errs.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        marginBottom: 12,
                      }}
                    >
                      {errs.map((err, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: "rgba(245,158,11,0.1)",
                            color: "#f59e0b",
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          ⚠️ {err}
                        </span>
                      ))}
                    </div>
                  )}

                  {ws.alternative_thought && (
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: "rgba(34,197,94,0.05)",
                        border: "0.5px solid rgba(34,197,94,0.15)",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#86efac",
                          marginBottom: 4,
                        }}
                      >
                        BALANCED ALTERNATIVE
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
                        {ws.alternative_thought}
                      </div>
                    </div>
                  )}

                  {ws.action_plan && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        lineHeight: 1.6,
                        whiteSpace: "pre-line",
                      }}
                    >
                      💡 <strong>Action Plan:</strong> {ws.action_plan}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function CBTPage() {
  const isAndroid = useIsAndroid();

  if (isAndroid) {
    return <AndroidCBT />;
  }

  return <DesktopCBTView />;
}
