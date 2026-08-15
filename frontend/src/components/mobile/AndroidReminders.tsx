"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AndroidMobileLayout from "./AndroidMobileLayout";
import { TopAppBar, MaterialCard, Button, LoadingSkeleton } from "./ui";
import toast from "react-hot-toast";
import { API_URL } from "@/lib/config";

export default function AndroidReminders() {
  const { user } = useAuth();

  const [journalEnabled, setJournalEnabled] = useState(true);
  const [journalTime, setJournalTime] = useState("20:00");
  const [meditationEnabled, setMeditationEnabled] = useState(true);
  const [meditationTime, setMeditationTime] = useState("07:00");
  const [moodEnabled, setMoodEnabled] = useState(true);
  const [moodTime, setMoodTime] = useState("21:00");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/reminders/${user.id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.reminders) {
          setJournalEnabled(!!json.reminders.journal_enabled);
          setJournalTime(json.reminders.journal_time || "20:00");
          setMeditationEnabled(!!json.reminders.meditation_enabled);
          setMeditationTime(json.reminders.meditation_time || "07:00");
          setMoodEnabled(!!json.reminders.mood_enabled);
          setMoodTime(json.reminders.mood_time || "21:00");
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/reminders/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journal_enabled: journalEnabled, journal_time: journalTime, meditation_enabled: meditationEnabled, meditation_time: meditationTime, mood_enabled: moodEnabled, mood_time: moodTime }),
      });
      if (res.ok) {
        toast.success("Reminders updated! 🔔");
        try {
          const now = new Date();
          const localDate = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0"),
          ].join("-");
          fetch(`${API_URL}/reminders/${user.id}/generate-daily`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ local_date: localDate }),
          }).catch(() => {});
        } catch { /* ignore */ }
      } else {
        toast.error("Update failed");
      }
    } catch { toast.error("Network error"); }
    setSaving(false);
  };

  if (loading) {
    return (
      <AndroidMobileLayout>
        <TopAppBar title="Reminders" />
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <LoadingSkeleton height="80px" /><LoadingSkeleton height="80px" /><LoadingSkeleton height="80px" />
        </div>
      </AndroidMobileLayout>
    );
  }

  const ReminderItem = ({ icon, label, enabled, setEnabled, time, setTime }: any) => (
    <MaterialCard variant="filled" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "24px" }}>{icon}</span>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#e8edf5" }}>{label}</div>
          <div style={{ fontSize: "12px", color: "#8b95a7" }}>Daily check-in at {time}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <input type="time" value={time} onChange={e => setTime(e.target.value)} disabled={!enabled} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#e8edf5", fontSize: "12px", padding: "4px" }} />
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} style={{ width: "20px", height: "20px", accentColor: "#22c55e" }} />
      </div>
    </MaterialCard>
  );

  return (
    <AndroidMobileLayout hasBottomNav={true}>
      <TopAppBar title="Reminder Schedules" subtitle="Daily CBT check-in notifications" />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <ReminderItem icon="😊" label="Evening Mood" enabled={moodEnabled} setEnabled={setMoodEnabled} time={moodTime} setTime={setMoodTime} />
        <ReminderItem icon="📝" label="Reflective Journal" enabled={journalEnabled} setEnabled={setJournalEnabled} time={journalTime} setTime={setJournalTime} />
        <ReminderItem icon="🧘" label="Morning Meditation" enabled={meditationEnabled} setEnabled={setMeditationEnabled} time={meditationTime} setTime={setMeditationTime} />

        <Button fullWidth loading={saving} onClick={handleSave} style={{ height: "56px", borderRadius: "16px", background: "linear-gradient(135deg, #22c55e, #16a34a)", marginTop: "12px" }}>
          Save Preferences 🔔
        </Button>
      </div>
    </AndroidMobileLayout>
  );
}
