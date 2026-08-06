"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface MoodEntry {
  id: string;
  date: string;
  mood_score: number;
  mood_emoji: string;
  stress_level: number | null;
  anxiety_level: number | null;
  energy_level: number | null;
  sleep_hours: number | null;
  water_intake: number | null;
  exercise_done: boolean;
  meditation_done: boolean;
  notes: string;
}

const MOOD_OPTIONS = [
  { score: 1, emoji: "😢", label: "Awful", color: "#ef4444" },
  { score: 2, emoji: "😟", label: "Bad", color: "#f97316" },
  { score: 3, emoji: "😐", label: "Okay", color: "#eab308" },
  { score: 4, emoji: "🙂", label: "Good", color: "#22c55e" },
  { score: 5, emoji: "😄", label: "Great", color: "#06b6d4" },
];

export default function MoodTrackerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MoodEntry | null>(null);

  // Form state
  const [moodScore, setMoodScore] = useState(3);
  const [stressLevel, setStressLevel] = useState(5);
  const [anxietyLevel, setAnxietyLevel] = useState(5);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [sleepHours, setSleepHours] = useState(7);
  const [waterIntake, setWaterIntake] = useState(4);
  const [exerciseDone, setExerciseDone] = useState(false);
  const [meditationDone, setMeditationDone] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/mood-entries/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.mood_entries || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEntries();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchEntries]);

  const today = new Date().toISOString().split("T")[0];
  const todayEntry = entries.find(e => e.date === today);

  const resetForm = () => {
    setMoodScore(3); setStressLevel(5); setAnxietyLevel(5);
    setEnergyLevel(5); setSleepHours(7); setWaterIntake(4);
    setExerciseDone(false); setMeditationDone(false); setNotes("");
    setEditingEntry(null);
  };

  const openEditForm = (entry: MoodEntry) => {
    setEditingEntry(entry);
    setMoodScore(entry.mood_score);
    setStressLevel(entry.stress_level ?? 5);
    setAnxietyLevel(entry.anxiety_level ?? 5);
    setEnergyLevel(entry.energy_level ?? 5);
    setSleepHours(entry.sleep_hours ?? 7);
    setWaterIntake(entry.water_intake ?? 4);
    setExerciseDone(!!entry.exercise_done);
    setMeditationDone(!!entry.meditation_done);
    setNotes(entry.notes || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const mood = MOOD_OPTIONS.find(m => m.score === moodScore);
      const res = await fetch(`${API_URL}/mood-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          date: editingEntry?.date || today,
          mood_score: moodScore,
          mood_emoji: mood?.emoji || "😐",
          stress_level: stressLevel,
          anxiety_level: anxietyLevel,
          energy_level: energyLevel,
          sleep_hours: sleepHours,
          water_intake: waterIntake,
          exercise_done: exerciseDone,
          meditation_done: meditationDone,
          notes,
        }),
      });
      if (res.ok) {
        toast.success(editingEntry ? "Entry updated!" : "Mood logged! 🎉");
        resetForm();
        setShowForm(false);
        fetchEntries();
      } else {
        toast.error("Failed to save entry");
      }
    } catch {
      toast.error("Connection error");
    }
    setSaving(false);
  };

  const handleDelete = async (entry: MoodEntry) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/mood-entries/${entry.id}?user_id=${user.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Entry deleted");
        fetchEntries();
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (authLoading || loading) return <><Sidebar /><div className="app-main-layout"><PageSkeleton /></div></>;
  if (!user) return null;

  const selectedMood = MOOD_OPTIONS.find(m => m.score === moodScore);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Sidebar />
      <main className="app-main-layout" style={{
        padding: "24px 20px",
        maxWidth: 900, overflow: "auto",
      }}>
        <MobileHeader title="Mood Tracker" />
        <style>{`
          @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
          @keyframes popIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        `}</style>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(24px, 4vw, 32px)",
            fontWeight: 700, color: "var(--text-primary)", marginBottom: 6,
          }}>
            Mood Tracker 😊
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Track your daily mood, sleep, and wellness habits
          </p>
        </div>

        {/* Today&apos;s Quick Status */}
        {todayEntry && !showForm && (
          <div style={{
            padding: "20px 24px", borderRadius: 16,
            background: "var(--bg-glass)", border: "0.5px solid var(--border-secondary)",
            marginBottom: 24, display: "flex", alignItems: "center", gap: 16,
            flexWrap: "wrap",
          }}>
            <div style={{ fontSize: 40 }}>{todayEntry.mood_emoji}</div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
                Today&apos;s Check-in
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                Mood: {MOOD_OPTIONS[todayEntry.mood_score - 1]?.label} •
                Stress: {todayEntry.stress_level}/10 •
                Sleep: {todayEntry.sleep_hours}h
              </div>
            </div>
            <button
              onClick={() => openEditForm(todayEntry)}
              style={{
                padding: "8px 18px", borderRadius: 10,
                background: "var(--bg-tertiary)", border: "0.5px solid var(--border-secondary)",
                color: "var(--text-secondary)", fontSize: 13, fontWeight: 500,
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              Edit
            </button>
          </div>
        )}

        {/* New Entry Button */}
        {!showForm && (
          <button
            id="new-mood-entry"
            onClick={() => { resetForm(); setShowForm(true); }}
            style={{
              width: "100%", padding: "18px", borderRadius: 14,
              background: "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(6,182,212,0.08))",
              border: "1px dashed rgba(34,197,94,0.3)",
              color: "#22c55e", fontSize: 14, fontWeight: 600,
              cursor: "pointer", marginBottom: 28,
              transition: "all 0.2s",
            }}
          >
            {todayEntry ? "✏️ Update Today's Entry" : "✨ Log Today's Mood"}
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div style={{
            padding: "28px 24px", borderRadius: 20,
            background: "var(--bg-glass)", border: "0.5px solid var(--border-secondary)",
            backdropFilter: "blur(12px)", marginBottom: 28,
            animation: "popIn 0.3s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{
                fontSize: 18, fontWeight: 700, color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
              }}>
                {editingEntry ? "Edit Entry" : "How are you feeling today?"}
              </h2>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "var(--bg-tertiary)", border: "none",
                  color: "var(--text-secondary)", cursor: "pointer", fontSize: 16,
                }}
              >✕</button>
            </div>

            {/* Mood Picker */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "block" }}>
                Mood
              </label>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                {MOOD_OPTIONS.map(mood => (
                  <button
                    key={mood.score}
                    onClick={() => setMoodScore(mood.score)}
                    style={{
                      width: 64, height: 80, borderRadius: 14,
                      background: moodScore === mood.score ? `${mood.color}15` : "var(--bg-secondary)",
                      border: moodScore === mood.score ? `2px solid ${mood.color}` : "1px solid var(--border-secondary)",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 6,
                      cursor: "pointer", transition: "all 0.2s",
                      transform: moodScore === mood.score ? "scale(1.1)" : "scale(1)",
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{mood.emoji}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 600,
                      color: moodScore === mood.score ? mood.color : "var(--text-tertiary)",
                    }}>{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <SliderInput label="Stress Level" value={stressLevel} onChange={setStressLevel} max={10} color="#ef4444" icon="🔥" />
              <SliderInput label="Anxiety Level" value={anxietyLevel} onChange={setAnxietyLevel} max={10} color="#f59e0b" icon="😰" />
              <SliderInput label="Energy Level" value={energyLevel} onChange={setEnergyLevel} max={10} color="#22c55e" icon="⚡" />
              <SliderInput label="Sleep Hours" value={sleepHours} onChange={setSleepHours} max={12} step={0.5} color="#8b5cf6" icon="🌙" />
              <SliderInput label="Water (glasses)" value={waterIntake} onChange={setWaterIntake} max={15} color="#3b82f6" icon="💧" />
            </div>

            {/* Toggles */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              <ToggleChip label="Exercise" emoji="🏃" active={exerciseDone} onToggle={() => setExerciseDone(!exerciseDone)} />
              <ToggleChip label="Meditation" emoji="🧘" active={meditationDone} onToggle={() => setMeditationDone(!meditationDone)} />
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "block" }}>
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="What's on your mind today?"
                style={{
                  width: "100%", minHeight: 80, padding: "12px 14px",
                  borderRadius: 12, background: "var(--bg-secondary)",
                  border: "0.5px solid var(--border-secondary)",
                  color: "var(--text-primary)", fontSize: 13,
                  resize: "vertical", fontFamily: "var(--font-body)",
                  outline: "none",
                }}
              />
            </div>

            {/* Save Button */}
            <button
              id="save-mood"
              onClick={handleSave}
              disabled={saving}
              style={{
                width: "100%", padding: "14px", borderRadius: 12,
                background: saving ? "var(--bg-tertiary)" : `linear-gradient(135deg, ${selectedMood?.color || "#22c55e"}, ${selectedMood?.color || "#22c55e"}dd)`,
                border: "none", color: "white",
                fontSize: 14, fontWeight: 600, cursor: saving ? "default" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {saving ? "Saving..." : editingEntry ? "Update Entry" : "Save Mood Entry ✨"}
            </button>
          </div>
        )}

        {/* History */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{
            fontSize: 16, fontWeight: 700, color: "var(--text-primary)",
            fontFamily: "var(--font-display)", marginBottom: 16,
          }}>
            Recent Entries
          </h2>
          {entries.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "48px 24px",
              color: "var(--text-tertiary)", fontSize: 14,
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
              No mood entries yet. Start tracking today!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {entries.slice(0, 30).map((entry, i) => (
                <div
                  key={entry.id}
                  style={{
                    padding: "16px 20px", borderRadius: 14,
                    background: "var(--bg-glass)",
                    border: entry.date === today ? "1px solid rgba(34,197,94,0.3)" : "0.5px solid var(--border-secondary)",
                    display: "flex", alignItems: "center", gap: 14,
                    animation: `popIn 0.3s ease ${i * 0.05}s both`,
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                  onClick={() => openEditForm(entry)}
                >
                  <div style={{
                    fontSize: 28, width: 44, height: 44, borderRadius: 12,
                    background: `${MOOD_OPTIONS[entry.mood_score - 1]?.color}15`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {entry.mood_emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                      {entry.date === today ? "Today" : new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      <span style={{ fontWeight: 400, color: "var(--text-tertiary)", marginLeft: 8, fontSize: 12 }}>
                        {MOOD_OPTIONS[entry.mood_score - 1]?.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {entry.stress_level !== null && <span>🔥 {entry.stress_level}/10</span>}
                      {entry.sleep_hours !== null && <span>🌙 {entry.sleep_hours}h</span>}
                      {entry.water_intake !== null && <span>💧 {entry.water_intake}</span>}
                      {entry.exercise_done && <span>🏃</span>}
                      {entry.meditation_done && <span>🧘</span>}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(entry); }}
                    style={{
                      padding: "6px 10px", borderRadius: 8,
                      background: "rgba(239,68,68,0.08)", border: "none",
                      color: "#fca5a5", fontSize: 12, cursor: "pointer",
                    }}
                  >🗑</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SliderInput({ label, value, onChange, max, step = 1, color, icon }: {
  label: string; value: number; onChange: (v: number) => void;
  max: number; step?: number; color: string; icon: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>
          {icon} {label}
        </label>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
      </div>
      <input
        type="range" min={0} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          width: "100%", height: 6, borderRadius: 3,
          appearance: "none", background: `linear-gradient(to right, ${color} ${(value / max) * 100}%, var(--bg-tertiary) ${(value / max) * 100}%)`,
          cursor: "pointer",
          accentColor: color,
        }}
      />
    </div>
  );
}

function ToggleChip({ label, emoji, active, onToggle }: {
  label: string; emoji: string; active: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        padding: "10px 18px", borderRadius: 12,
        background: active ? "rgba(34,197,94,0.12)" : "var(--bg-secondary)",
        border: active ? "1px solid rgba(34,197,94,0.3)" : "0.5px solid var(--border-secondary)",
        color: active ? "#22c55e" : "var(--text-secondary)",
        fontSize: 13, fontWeight: 500, cursor: "pointer",
        transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6,
      }}
    >
      {emoji} {label} {active && "✓"}
    </button>
  );
}
