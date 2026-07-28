"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
  positive: { bg: "rgba(34,197,94,0.1)", text: "#22c55e", icon: "😊" },
  negative: { bg: "rgba(239,68,68,0.1)", text: "#ef4444", icon: "😔" },
  neutral: { bg: "rgba(156,163,175,0.1)", text: "#9ca3af", icon: "😐" },
  mixed: { bg: "rgba(168,85,247,0.1)", text: "#a855f7", icon: "🤔" },
};

export default function JournalPage() {
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
    } catch { /* ignore */ }
    setLoading(false);
  }, [user, search, filterSentiment]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleSave = async () => {
    if (!user || !content.trim()) return;
    setSaving(true);
    try {
      const url = editId ? `${API_URL}/journal/${editId}` : `${API_URL}/journal`;
      const method = editId ? "PUT" : "POST";
      const body = editId
        ? { user_id: user.id, title, content }
        : { user_id: user.id, title, content };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(editId ? "Entry updated!" : "Journal saved! 📝");
        setShowEditor(false); setEditId(null); setTitle(""); setContent("");
        fetchEntries();
      }
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/journal/${id}?user_id=${user.id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Deleted"); fetchEntries(); }
    } catch { toast.error("Failed"); }
  };

  const handleAnalyze = async (id: string) => {
    if (!user) return;
    setAnalyzing(id);
    try {
      const res = await fetch(`${API_URL}/journal/${id}/analyze?user_id=${user.id}`, { method: "POST" });
      if (res.ok) {
        toast.success("Analysis complete! ✨");
        fetchEntries();
      }
    } catch { toast.error("Analysis failed"); }
    setAnalyzing(null);
  };

  const openEdit = (entry: JournalEntry) => {
    setEditId(entry.id); setTitle(entry.title); setContent(entry.content);
    setShowEditor(true);
  };

  const parseEmotions = (emotions: Record<string, number> | string): Record<string, number> => {
    if (typeof emotions === "string") {
      try { return JSON.parse(emotions); } catch { return {}; }
    }
    return emotions || {};
  };

  if (authLoading || loading) return <><Sidebar /><div style={{ marginLeft: 260 }}><PageSkeleton /></div></>;
  if (!user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 260, padding: "32px 28px", maxWidth: 900, overflow: "auto" }}>
        <style>{`
          @media (max-width: 767px) { main { margin-left: 0 !important; padding: 16px !important; } }
          @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
          @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        `}</style>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
            AI Journal 📝
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Write your thoughts — Sera will analyze sentiment and emotions
          </p>
        </div>

        {/* Search & Filter */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <input
            type="text" placeholder="Search entries..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 10,
              background: "var(--bg-secondary)", border: "0.5px solid var(--border-secondary)",
              color: "var(--text-primary)", fontSize: 13, outline: "none",
              fontFamily: "var(--font-body)",
            }}
          />
          {["positive", "negative", "neutral"].map(s => (
            <button
              key={s}
              onClick={() => setFilterSentiment(filterSentiment === s ? null : s)}
              style={{
                padding: "8px 14px", borderRadius: 10,
                background: filterSentiment === s ? SENTIMENT_COLORS[s].bg : "var(--bg-secondary)",
                border: filterSentiment === s ? `1px solid ${SENTIMENT_COLORS[s].text}40` : "0.5px solid var(--border-secondary)",
                color: filterSentiment === s ? SENTIMENT_COLORS[s].text : "var(--text-secondary)",
                fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}
            >
              {SENTIMENT_COLORS[s].icon} {s}
            </button>
          ))}
        </div>

        {/* New Entry Button */}
        {!showEditor && (
          <button
            id="new-journal-entry"
            onClick={() => { setEditId(null); setTitle(""); setContent(""); setShowEditor(true); }}
            style={{
              width: "100%", padding: "18px", borderRadius: 14,
              background: "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(59,130,246,0.08))",
              border: "1px dashed rgba(168,85,247,0.3)",
              color: "#a855f7", fontSize: 14, fontWeight: 600,
              cursor: "pointer", marginBottom: 24,
            }}
          >
            ✍️ Write New Entry
          </button>
        )}

        {/* Editor */}
        {showEditor && (
          <div style={{
            padding: "24px", borderRadius: 20,
            background: "var(--bg-glass)", border: "0.5px solid var(--border-secondary)",
            marginBottom: 24, animation: "popIn 0.3s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                {editId ? "Edit Entry" : "New Journal Entry"}
              </h2>
              <button onClick={() => setShowEditor(false)} style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-tertiary)", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <input
              type="text" placeholder="Entry title (optional)" value={title}
              onChange={e => setTitle(e.target.value)}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                background: "var(--bg-secondary)", border: "0.5px solid var(--border-secondary)",
                color: "var(--text-primary)", fontSize: 14, marginBottom: 12,
                outline: "none", fontFamily: "var(--font-body)",
              }}
            />
            <textarea
              value={content} onChange={e => setContent(e.target.value)}
              placeholder="What's on your mind? Write freely..."
              style={{
                width: "100%", minHeight: 180, padding: "14px",
                borderRadius: 12, background: "var(--bg-secondary)",
                border: "0.5px solid var(--border-secondary)",
                color: "var(--text-primary)", fontSize: 14, lineHeight: 1.8,
                resize: "vertical", fontFamily: "var(--font-body)", outline: "none",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                {content.split(/\s+/).filter(Boolean).length} words
              </span>
              <button
                onClick={handleSave} disabled={saving || !content.trim()}
                style={{
                  padding: "12px 28px", borderRadius: 12,
                  background: saving ? "var(--bg-tertiary)" : "linear-gradient(135deg, #a855f7, #8b5cf6)",
                  border: "none", color: "white", fontSize: 14, fontWeight: 600,
                  cursor: saving ? "default" : "pointer",
                }}
              >
                {saving ? "Saving..." : editId ? "Update" : "Save Entry ✨"}
              </button>
            </div>
          </div>
        )}

        {/* Entries List */}
        {entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-tertiary)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
            {search || filterSentiment ? "No entries match your filter." : "Your journal is empty. Start writing!"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {entries.map((entry, i) => {
              const emotions = parseEmotions(entry.emotions);
              const sentimentInfo = SENTIMENT_COLORS[entry.sentiment || "neutral"];
              return (
                <div
                  key={entry.id}
                  style={{
                    padding: "20px", borderRadius: 16,
                    background: "var(--bg-glass)", border: "0.5px solid var(--border-secondary)",
                    animation: `popIn 0.3s ease ${i * 0.04}s both`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                        {entry.title || "Untitled Entry"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                        {new Date(entry.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        {" • "}{entry.word_count} words
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {entry.sentiment && (
                        <span style={{
                          padding: "4px 10px", borderRadius: 8,
                          background: sentimentInfo?.bg, color: sentimentInfo?.text,
                          fontSize: 11, fontWeight: 600,
                        }}>
                          {sentimentInfo?.icon} {entry.sentiment}
                        </span>
                      )}
                    </div>
                  </div>

                  <p style={{
                    fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7,
                    marginBottom: 12, overflow: "hidden",
                    display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const,
                  }}>
                    {entry.content}
                  </p>

                  {/* Emotion badges */}
                  {Object.keys(emotions).length > 0 && emotions["neutral"] === undefined && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                      {Object.entries(emotions).slice(0, 4).map(([name, pct]) => (
                        <span key={name} style={{
                          padding: "3px 8px", borderRadius: 6,
                          background: "var(--bg-secondary)", fontSize: 11,
                          color: "var(--text-secondary)",
                        }}>
                          {name} {typeof pct === 'number' ? `${Math.round(pct)}%` : ''}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* AI Summary */}
                  {entry.ai_summary && (
                    <div style={{
                      padding: "10px 14px", borderRadius: 10,
                      background: "rgba(168,85,247,0.06)",
                      border: "0.5px solid rgba(168,85,247,0.15)",
                      fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6,
                      marginBottom: 12,
                    }}>
                      🤖 {entry.ai_summary}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => openEdit(entry)} style={{ padding: "6px 12px", borderRadius: 8, background: "var(--bg-tertiary)", border: "none", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}>
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleAnalyze(entry.id)}
                      disabled={analyzing === entry.id}
                      style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(168,85,247,0.08)", border: "none", color: "#a855f7", fontSize: 12, cursor: analyzing === entry.id ? "default" : "pointer" }}
                    >
                      {analyzing === entry.id ? "Analyzing..." : "🧠 AI Analyze"}
                    </button>
                    <button onClick={() => handleDelete(entry.id)} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "none", color: "#fca5a5", fontSize: 12, cursor: "pointer", marginLeft: "auto" }}>
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
