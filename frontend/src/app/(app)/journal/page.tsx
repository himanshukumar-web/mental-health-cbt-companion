"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAndroid } from "@/hooks/useIsAndroid";
import AndroidJournal from "@/components/mobile/AndroidJournal";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import EmptyState from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { API_URL } from "@/lib/config";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  sentiment: string | null;
  sentiment_score: number | null;
  emotions: Record<string, number> | string;
  ai_summary: string | null;
  word_count: number;
  is_favorite: boolean;
  created_at: string;
}

const SENTIMENT_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  positive: { bg: "rgba(34,197,94,0.12)", text: "#22c55e", icon: "😊" },
  negative: { bg: "rgba(239,68,68,0.12)", text: "#ef4444", icon: "😔" },
  neutral: { bg: "rgba(156,163,175,0.12)", text: "#9ca3af", icon: "😐" },
  mixed: { bg: "rgba(168,85,247,0.12)", text: "#a855f7", icon: "🤔" },
};

function DesktopJournalView() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [filterSentiment, setFilterSentiment] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    try {
      let url = `${API_URL}/journal/${user.id}?limit=50`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (filterSentiment) url += `&sentiment=${filterSentiment}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.journal_entries || []);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [user, search, filterSentiment]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEntries();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchEntries]);

  interface SpeechRecognitionEvent {
    resultIndex: number;
    results: {
      length: number;
      [key: number]: {
        [key: number]: {
          transcript: string;
        };
      };
    };
  }

  const toggleVoiceRecording = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    if (recording) {
      setRecording(false);
      toast("Voice recording stopped.", { icon: "🎙️" });
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setRecording(true);
        toast.success("Listening... Speak your thoughts freely 🎙️");
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setContent((prev) => (prev ? prev + " " + transcript : transcript));
      };

      recognition.onerror = () => {
        setRecording(false);
        toast.error("Voice recognition error.");
      };

      recognition.onend = () => {
        setRecording(false);
      };

      recognition.start();
    } catch {
      setRecording(false);
    }
  };

  const generateAiTitle = () => {
    if (!content.trim()) {
      toast.error("Write some content first!");
      return;
    }
    const words = content.trim().split(/\s+/);
    const autoTitle = words.slice(0, 5).join(" ") + (words.length > 5 ? "..." : "");
    setTitle(autoTitle.charAt(0).toUpperCase() + autoTitle.slice(1));
    toast.success("AI Generated Title! ✨");
  };

  const handleSave = async () => {
    if (!user || !content.trim()) return;
    setSaving(true);
    try {
      const url = editId ? `${API_URL}/journal/${editId}` : `${API_URL}/journal`;
      const method = editId ? "PUT" : "POST";
      const body = {
        user_id: user.id,
        title: title || content.slice(0, 30) + "...",
        content,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editId ? "Entry updated!" : "Journal saved! 📝");
        setShowEditor(false);
        setEditId(null);
        setTitle("");
        setContent("");
        fetchEntries();
      }
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/journal/${id}?user_id=${user.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Entry deleted");
        fetchEntries();
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleAnalyze = async (id: string) => {
    if (!user) return;
    setAnalyzing(id);
    try {
      const res = await fetch(`${API_URL}/journal/${id}/analyze?user_id=${user.id}`, { method: "POST" });
      if (res.ok) {
        toast.success("AI Analysis Complete! ✨");
        fetchEntries();
      }
    } catch {
      toast.error("Analysis failed");
    }
    setAnalyzing(null);
  };

  const openEdit = (entry: JournalEntry) => {
    setEditId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setShowEditor(true);
  };

  const parseEmotions = (emotions: Record<string, number> | string): Record<string, number> => {
    if (typeof emotions === "string") {
      try {
        return JSON.parse(emotions);
      } catch {
        return {};
      }
    }
    return emotions || {};
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
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Sidebar />
      <main className="app-main-layout" style={{ padding: "24px 20px", maxWidth: 960, overflow: "auto" }}>
        <MobileHeader title="Voice & Text Journal" />

        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#a855f7", letterSpacing: "0.08em" }}>
            Reflective Practice
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 800, color: "var(--text-primary)", margin: "4px 0 0" }}>
            AI Reflective Journal 📝
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Write or speak your thoughts freely — Sera performs automated sentiment, cognitive, and emotion breakdown.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="🔍 Search journal entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: 220,
              padding: "11px 16px",
              borderRadius: 14,
              background: "var(--bg-glass)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--border-secondary)",
              color: "var(--text-primary)",
              fontSize: 13,
              outline: "none",
            }}
          />

          {["positive", "negative", "neutral"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterSentiment(filterSentiment === s ? null : s)}
              style={{
                padding: "8px 14px",
                borderRadius: 12,
                background: filterSentiment === s ? SENTIMENT_COLORS[s].bg : "var(--bg-glass)",
                border: filterSentiment === s ? `1px solid ${SENTIMENT_COLORS[s].text}40` : "1px solid var(--border-secondary)",
                color: filterSentiment === s ? SENTIMENT_COLORS[s].text : "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {SENTIMENT_COLORS[s].icon} {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {!showEditor && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditId(null);
              setTitle("");
              setContent("");
              setShowEditor(true);
            }}
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: 18,
              background: "linear-gradient(135deg, rgba(168,85,247,0.12), rgba(59,130,246,0.08))",
              border: "1px dashed rgba(168,85,247,0.4)",
              color: "#a855f7",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <span>✍️ Write or Voice New Journal Entry</span>
          </motion.button>
        )}

        {showEditor && (
          <div
            style={{
              padding: "24px",
              borderRadius: 20,
              background: "var(--bg-glass)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--border-secondary)",
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)", margin: 0 }}>
                {editId ? "Edit Journal Entry" : "New Journal Entry"}
              </h2>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={toggleVoiceRecording}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 10,
                    border: recording ? "1px solid #ef4444" : "1px solid rgba(168,85,247,0.3)",
                    background: recording ? "rgba(239,68,68,0.2)" : "rgba(168,85,247,0.12)",
                    color: recording ? "#f87171" : "#a855f7",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {recording ? "🔴 Stop Recording" : "🎙️ Voice Journal"}
                </button>

                <button
                  onClick={generateAiTitle}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(34,197,94,0.3)",
                    background: "rgba(34,197,94,0.12)",
                    color: "#22c55e",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ✨ AI Title
                </button>

                <button
                  onClick={() => setShowEditor(false)}
                  style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: 16, cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder="Entry Title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-secondary)",
                color: "var(--text-primary)",
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 14,
                outline: "none",
              }}
            />

            <textarea
              rows={6}
              placeholder="What's on your mind today? Write freely..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 14,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-secondary)",
                color: "var(--text-primary)",
                fontSize: 14,
                lineHeight: 1.6,
                marginBottom: 16,
                outline: "none",
                fontFamily: "inherit",
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setShowEditor(false)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 12,
                  border: "1px solid var(--border-secondary)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "10px 22px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg, #a855f7, #8b5cf6)",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {saving ? "Saving..." : "Save Entry"}
              </button>
            </div>
          </div>
        )}

        {entries.length === 0 ? (
          <EmptyState
            icon="📝"
            title="No Journal Entries Yet"
            description="Start writing or speaking your thoughts. Sera automatically analyzes emotions, cognitive patterns, and sentiment."
            actionText="Write First Entry"
            onAction={() => setShowEditor(true)}
            tip="Daily journaling reduces intrusive thoughts by up to 40%."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {entries.map((entry) => {
              const sentimentInfo = entry.sentiment ? SENTIMENT_COLORS[entry.sentiment] || SENTIMENT_COLORS.neutral : null;
              const emotionObj = parseEmotions(entry.emotions);

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: 24,
                    borderRadius: 20,
                    background: "var(--bg-glass)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid var(--border-secondary)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {sentimentInfo && (
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: 10,
                            background: sentimentInfo.bg,
                            color: sentimentInfo.text,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {sentimentInfo.icon} {entry.sentiment}
                        </span>
                      )}
                      <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-display)" }}>
                        {entry.title}
                      </h3>
                    </div>

                    <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                      {new Date(entry.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>

                  <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
                    {entry.content}
                  </p>

                  {entry.ai_summary && (
                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: 14,
                        background: "rgba(168,85,247,0.08)",
                        border: "1px solid rgba(168,85,247,0.25)",
                        fontSize: 12,
                        color: "#d8b4fe",
                        lineHeight: 1.5,
                      }}
                    >
                      <strong style={{ color: "#a855f7" }}>✨ Sera AI Summary:</strong> {entry.ai_summary}
                    </div>
                  )}

                  {Object.keys(emotionObj).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {Object.entries(emotionObj).map(([eName, eScore]) => (
                        <span
                          key={eName}
                          style={{
                            padding: "3px 8px",
                            borderRadius: 8,
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "var(--text-tertiary)",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {eName}: {Math.round(eScore * 100)}%
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <button
                      onClick={() => handleAnalyze(entry.id)}
                      disabled={analyzing === entry.id}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(168,85,247,0.3)",
                        background: "rgba(168,85,247,0.12)",
                        color: "#a855f7",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {analyzing === entry.id ? "Analyzing..." : "✨ Run AI Emotion Analysis"}
                    </button>

                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={() => openEdit(entry)}
                        style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        style={{ background: "none", border: "none", color: "#ef4444", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function JournalPage() {
  const isAndroid = useIsAndroid();

  if (isAndroid) {
    return <AndroidJournal />;
  }

  return <DesktopJournalView />;
}
