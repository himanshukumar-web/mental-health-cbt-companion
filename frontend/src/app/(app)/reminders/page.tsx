"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { requestNotificationPermission, scheduleSmartReminders } from "@/utils/notifications";
import toast from "react-hot-toast";

import { API_URL } from "@/lib/config";

export default function RemindersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [journalEnabled, setJournalEnabled] = useState(true);
  const [journalTime, setJournalTime] = useState("20:00");
  const [meditationEnabled, setMeditationEnabled] = useState(true);
  const [meditationTime, setMeditationTime] = useState("07:00");
  const [waterEnabled, setWaterEnabled] = useState(true);
  const [waterInterval, setWaterInterval] = useState(60);
  const [sleepEnabled, setSleepEnabled] = useState(true);
  const [sleepTime, setSleepTime] = useState("22:30");
  const [moodEnabled, setMoodEnabled] = useState(true);
  const [moodTime, setMoodTime] = useState("21:00");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

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
          setWaterEnabled(!!json.reminders.water_enabled);
          setWaterInterval(json.reminders.water_interval || 60);
          setSleepEnabled(!!json.reminders.sleep_enabled);
          setSleepTime(json.reminders.sleep_time || "22:30");
          setMoodEnabled(!!json.reminders.mood_enabled);
          setMoodTime(json.reminders.mood_time || "21:00");
        }
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReminders();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchReminders]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await requestNotificationPermission();
    scheduleSmartReminders({
      waterIntervalMinutes: waterEnabled ? waterInterval : undefined,
    });
    try {
      const res = await fetch(`${API_URL}/reminders/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journal_enabled: journalEnabled,
          journal_time: journalTime,
          meditation_enabled: meditationEnabled,
          meditation_time: meditationTime,
          water_enabled: waterEnabled,
          water_interval: waterInterval,
          sleep_enabled: sleepEnabled,
          sleep_time: sleepTime,
          mood_enabled: moodEnabled,
          mood_time: moodTime,
        }),
      });

      if (res.ok) {
        toast.success("Reminder schedule saved! 🔔");
      } else {
        toast.error("Failed to save schedule");
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  };

  if (authLoading || loading)
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
            Reminder Schedules 🔔
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Configure automated daily check-ins for habits and mood tracking
          </p>
        </div>

        <div
          style={{
            padding: "24px",
            borderRadius: 20,
            background: "var(--bg-glass)",
            border: "0.5px solid var(--border-secondary)",
            marginBottom: 28,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Mood Checkin */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                😊 Evening Mood Check-in
              </div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                Prompt to record your daily mood and stress
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="time"
                value={moodTime}
                onChange={(e) => setMoodTime(e.target.value)}
                disabled={!moodEnabled}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  background: "var(--bg-secondary)",
                  border: "0.5px solid var(--border-secondary)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                }}
              />
              <input
                type="checkbox"
                checked={moodEnabled}
                onChange={(e) => setMoodEnabled(e.target.checked)}
              />
            </div>
          </div>

          {/* Journal */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                📝 Nightly Reflection Journal
              </div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                Reminder to write down your thoughts
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="time"
                value={journalTime}
                onChange={(e) => setJournalTime(e.target.value)}
                disabled={!journalEnabled}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  background: "var(--bg-secondary)",
                  border: "0.5px solid var(--border-secondary)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                }}
              />
              <input
                type="checkbox"
                checked={journalEnabled}
                onChange={(e) => setJournalEnabled(e.target.checked)}
              />
            </div>
          </div>

          {/* Meditation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                🧘 Morning Meditation
              </div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                Start your morning with 5 minutes of grounding
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="time"
                value={meditationTime}
                onChange={(e) => setMeditationTime(e.target.value)}
                disabled={!meditationEnabled}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  background: "var(--bg-secondary)",
                  border: "0.5px solid var(--border-secondary)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                }}
              />
              <input
                type="checkbox"
                checked={meditationEnabled}
                onChange={(e) => setMeditationEnabled(e.target.checked)}
              />
            </div>
          </div>

          {/* Water */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                💧 Hydration Interval
              </div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                Periodic water intake reminder during daytime
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <select
                value={waterInterval}
                onChange={(e) => setWaterInterval(parseInt(e.target.value))}
                disabled={!waterEnabled}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  background: "var(--bg-secondary)",
                  border: "0.5px solid var(--border-secondary)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                }}
              >
                <option value={30}>Every 30 mins</option>
                <option value={60}>Every 60 mins</option>
                <option value={120}>Every 2 hours</option>
              </select>
              <input
                type="checkbox"
                checked={waterEnabled}
                onChange={(e) => setWaterEnabled(e.target.checked)}
              />
            </div>
          </div>

          {/* Sleep */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                🌙 Sleep Wind-down
              </div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                Screen time cool-off reminder
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                disabled={!sleepEnabled}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  background: "var(--bg-secondary)",
                  border: "0.5px solid var(--border-secondary)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                }}
              />
              <input
                type="checkbox"
                checked={sleepEnabled}
                onChange={(e) => setSleepEnabled(e.target.checked)}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 12,
              background: saving
                ? "var(--bg-tertiary)"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
              border: "none",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? "default" : "pointer",
              marginTop: 12,
            }}
          >
            {saving ? "Saving..." : "Save Reminder Schedule ✨"}
          </button>
        </div>
      </main>
    </div>
  );
}
