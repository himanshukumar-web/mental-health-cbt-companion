"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AndroidMobileLayout from "./AndroidMobileLayout";
import { MD3TopAppBar } from "./ui/TopAppBar";
import { MD3Card } from "./ui/Card";
import { MD3Button } from "./ui/Button";
import { MD3Input } from "./ui/Input";
import { MD3LoadingState } from "./ui/FeedbackStates";
import { API_URL } from "@/lib/config";
import toast from "react-hot-toast";

const MOOD_EMOJIS = [
  { score: 1, emoji: "😭", label: "Terrible" },
  { score: 2, emoji: "😢", label: "Bad" },
  { score: 3, emoji: "😔", label: "Down" },
  { score: 4, emoji: "🙁", label: "Uncertain" },
  { score: 5, emoji: "😐", label: "Neutral" },
  { score: 6, emoji: "🙂", label: "Okay" },
  { score: 7, emoji: "😊", label: "Good" },
  { score: 8, emoji: "😃", label: "Great" },
  { score: 9, emoji: "🌟", label: "Awesome" },
  { score: 10, emoji: "🥳", label: "Ecstatic" },
];

export default function AndroidMood() {
  const { user } = useAuth();
  const [selectedScore, setSelectedScore] = useState<number>(7);
  const [stressLevel, setStressLevel] = useState<number>(3);
  const [sleepHours, setSleepHours] = useState<string>("7.5");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchMoodHistory();
  }, [user]);

  const fetchMoodHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/mood-entries/${user?.id}`);
      if (res.ok) {
        const json = await res.json();
        setHistory(json.mood_entries || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveMood = async () => {
    if (!user) return;
    const moodObj = MOOD_EMOJIS.find((m) => m.score === selectedScore) || MOOD_EMOJIS[6];
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/mood-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          mood_score: selectedScore,
          mood_emoji: moodObj.emoji,
          stress_level: stressLevel,
          sleep_hours: parseFloat(sleepHours) || 7,
          notes: notes.trim(),
        }),
      });

      if (res.ok) {
        toast.success("Mood logged successfully!");
        setNotes("");
        fetchMoodHistory();
      } else {
        toast.error("Failed to log mood.");
      }
    } catch (err) {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const selectedEmojiObj = MOOD_EMOJIS.find((m) => m.score === selectedScore) || MOOD_EMOJIS[6];

  return (
    <AndroidMobileLayout>
      <MD3TopAppBar title="Mood Check-in" subtitle="Track your daily emotional status" />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Active Selected Mood Display */}
        <MD3Card variant="elevated" style={{ textAlign: "center", padding: "24px 16px" }}>
          <div style={{ fontSize: "56px", marginBottom: "8px" }}>{selectedEmojiObj.emoji}</div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#e8edf5" }}>
            {selectedEmojiObj.label} ({selectedScore}/10)
          </div>
          <p style={{ fontSize: "13px", color: "#8b95a7", margin: "4px 0 20px 0" }}>
            Tap an emoji below to select your current mood score
          </p>

          {/* Emoji Grid Selector */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "8px",
            }}
          >
            {MOOD_EMOJIS.map((m) => (
              <button
                key={m.score}
                onClick={() => setSelectedScore(m.score)}
                style={{
                  padding: "10px 4px",
                  borderRadius: "14px",
                  border: selectedScore === m.score ? "2px solid #22c55e" : "1px solid rgba(255, 255, 255, 0.08)",
                  background: selectedScore === m.score ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.04)",
                  fontSize: "22px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        </MD3Card>

        {/* Stress & Sleep Inputs */}
        <MD3Card variant="filled" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#e8edf5" }}>Stress Level (1-10)</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#f59e0b" }}>{stressLevel}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={stressLevel}
              onChange={(e) => setStressLevel(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#f59e0b" }}
            />
          </div>

          <MD3Input
            label="Sleep Duration (Hours)"
            type="number"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
            leadingIcon="😴"
          />

          <MD3Input
            label="Journal / Context Notes (Optional)"
            type="text"
            placeholder="What triggered this mood?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            leadingIcon="📝"
          />

          <MD3Button fullWidth loading={loading} onClick={handleSaveMood}>
            Save Mood Entry
          </MD3Button>
        </MD3Card>

        {/* Recent History */}
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#e8edf5", marginBottom: "12px" }}>
            Recent History
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {history.slice(0, 5).map((entry, idx) => (
              <MD3Card key={idx} variant="filled" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>{entry.mood_emoji || "😊"}</span>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#e8edf5" }}>
                      Score {entry.mood_score}/10
                    </div>
                    {entry.notes && (
                      <div style={{ fontSize: "12px", color: "#8b95a7", marginTop: "2px" }}>{entry.notes}</div>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: "11px", color: "#8b95a7" }}>
                  {new Date(entry.created_at || Date.now()).toLocaleDateString()}
                </span>
              </MD3Card>
            ))}
          </div>
        </div>
      </div>
    </AndroidMobileLayout>
  );
}
