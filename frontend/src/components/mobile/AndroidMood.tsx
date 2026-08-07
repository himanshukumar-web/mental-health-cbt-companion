"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMobileMoodData } from "@/hooks/mobile";
import { formatMobileDate } from "@/utils/mobileUtils";
import AndroidMobileLayout from "./AndroidMobileLayout";
import {
  TopAppBar,
  MaterialCard,
  PrimaryButton,
  TextField,
  LoadingSkeleton,
  MoodCard,
} from "./ui";

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
  const { moodEntries, loading, addMoodEntry } = useMobileMoodData(user?.id);

  const [selectedScore, setSelectedScore] = useState<number>(7);
  const [stressLevel, setStressLevel] = useState<number>(3);
  const [sleepHours, setSleepHours] = useState<string>("7.5");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const handleSaveMood = async () => {
    const moodObj = MOOD_EMOJIS.find((m) => m.score === selectedScore) || MOOD_EMOJIS[6];
    setSaving(true);
    const success = await addMoodEntry({
      mood_score: selectedScore,
      mood_emoji: moodObj.emoji,
      stress_level: stressLevel,
      sleep_hours: parseFloat(sleepHours) || 7,
      notes: notes.trim(),
    });
    if (success) {
      setNotes("");
    }
    setSaving(false);
  };

  const selectedEmojiObj = MOOD_EMOJIS.find((m) => m.score === selectedScore) || MOOD_EMOJIS[6];

  if (loading) {
    return (
      <AndroidMobileLayout>
        <TopAppBar title="Mood Check-in" subtitle="Track your daily emotional status" />
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <LoadingSkeleton height="160px" />
          <LoadingSkeleton height="200px" />
        </div>
      </AndroidMobileLayout>
    );
  }

  return (
    <AndroidMobileLayout>
      <TopAppBar title="Mood Check-in" subtitle="Track your daily emotional status" />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Active Selected Mood Display */}
        <MaterialCard variant="elevated" style={{ textAlign: "center", padding: "24px 16px" }}>
          <div style={{ fontSize: "56px", marginBottom: "8px" }}>{selectedEmojiObj.emoji}</div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#e8edf5" }}>
            {selectedEmojiObj.label} ({selectedScore}/10)
          </div>
          <p style={{ fontSize: "13px", color: "#8b95a7", margin: "4px 0 20px 0" }}>
            Tap an emoji below to select your current mood score
          </p>

          {/* Emoji Grid Selector */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
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
        </MaterialCard>

        {/* Stress & Sleep Inputs */}
        <MaterialCard variant="filled" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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

          <TextField
            label="Sleep Duration (Hours)"
            type="number"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
            leadingIcon="😴"
          />

          <TextField
            label="Journal / Context Notes (Optional)"
            type="text"
            placeholder="What triggered this mood?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            leadingIcon="📝"
          />

          <PrimaryButton fullWidth loading={saving} onClick={handleSaveMood}>
            Save Mood Entry
          </PrimaryButton>
        </MaterialCard>

        {/* Recent History */}
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#e8edf5", marginBottom: "12px" }}>
            Recent History
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {moodEntries.slice(0, 5).map((entry, idx) => (
              <MoodCard
                key={entry.id || idx}
                emoji={entry.mood_emoji || "😊"}
                score={entry.mood_score}
                notes={entry.notes}
                date={formatMobileDate(entry.created_at)}
              />
            ))}
          </div>
        </div>
      </div>
    </AndroidMobileLayout>
  );
}
