"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { requestNotificationPermission, scheduleSmartReminders } from "@/utils/notifications";
import toast from "react-hot-toast";
import { useIsAndroid } from "@/hooks/useIsAndroid";
import AndroidReminders from "@/components/mobile/AndroidReminders";

import { API_URL } from "@/lib/config";

/* ── Styled toggle switch ────────────────────────────────────────────────── */

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: "relative",
        width: 44,
        height: 24,
        borderRadius: 12,
        border: "none",
        background: checked
          ? "linear-gradient(135deg, #22c55e, #16a34a)"
          : "var(--bg-tertiary)",
        cursor: "pointer",
        transition: "background 0.2s ease",
        flexShrink: 0,
        padding: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          transition: "left 0.2s ease",
        }}
      />
    </button>
  );
}

/* ── Reminder row component ──────────────────────────────────────────────── */

function ReminderRow({
  icon,
  title,
  description,
  enabled,
  onToggle,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        padding: "12px 0",
        borderBottom: "1px solid var(--border-secondary)",
      }}
    >
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
          {icon} {title}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>
          {description}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {children}
        <ToggleSwitch checked={enabled} onChange={onToggle} />
      </div>
    </div>
  );
}

/* ── Health measure reminder storage (localStorage — no backend changes) ── */

const HM_STORAGE_KEY = "healthMeasure_reminder_prefs";

function getHealthMeasurePrefs(): { enabled: boolean; time: string } {
  if (typeof window === "undefined") return { enabled: true, time: "09:00" };
  try {
    const raw = localStorage.getItem(HM_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { enabled: true, time: "09:00" };
}

function saveHealthMeasurePrefs(prefs: { enabled: boolean; time: string }) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HM_STORAGE_KEY, JSON.stringify(prefs));
  } catch { /* ignore */ }
}

/* ── Desktop view ────────────────────────────────────────────────────────── */

function DesktopRemindersView() {
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
  const [healthMeasureEnabled, setHealthMeasureEnabled] = useState(true);
  const [healthMeasureTime, setHealthMeasureTime] = useState("09:00");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  // Load health measure prefs from localStorage
  useEffect(() => {
    const prefs = getHealthMeasurePrefs();
    setHealthMeasureEnabled(prefs.enabled);
    setHealthMeasureTime(prefs.time);
  }, []);

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

    // Save health measure prefs to localStorage
    saveHealthMeasurePrefs({ enabled: healthMeasureEnabled, time: healthMeasureTime });

    // Schedule browser reminders
    scheduleSmartReminders({
      waterIntervalMinutes: waterEnabled ? waterInterval : undefined,
      healthMeasureTime: healthMeasureEnabled ? healthMeasureTime : undefined,
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

  const timeInputStyle = {
    padding: "6px 10px",
    borderRadius: 8,
    background: "var(--bg-secondary)",
    border: "0.5px solid var(--border-secondary)",
    color: "var(--text-primary)",
    fontSize: 13,
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
      <main className="app-main-layout" style={{ padding: "24px 20px", maxWidth: 800, overflow: "auto" }}>
        <MobileHeader title="Reminder Schedules" />

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
            gap: 0,
          }}
        >
          {/* Health Measure — NEW */}
          <ReminderRow
            icon="🩺"
            title="Daily Health Measure"
            description="Morning reminder to complete your daily wellness check-in"
            enabled={healthMeasureEnabled}
            onToggle={setHealthMeasureEnabled}
          >
            <input
              type="time"
              value={healthMeasureTime}
              onChange={(e) => setHealthMeasureTime(e.target.value)}
              disabled={!healthMeasureEnabled}
              style={timeInputStyle}
            />
          </ReminderRow>

          {/* Mood Checkin */}
          <ReminderRow
            icon="😊"
            title="Evening Mood Check-in"
            description="Prompt to record your daily mood and stress"
            enabled={moodEnabled}
            onToggle={setMoodEnabled}
          >
            <input
              type="time"
              value={moodTime}
              onChange={(e) => setMoodTime(e.target.value)}
              disabled={!moodEnabled}
              style={timeInputStyle}
            />
          </ReminderRow>

          {/* Journal */}
          <ReminderRow
            icon="📝"
            title="Nightly Reflection Journal"
            description="Reminder to write down your thoughts"
            enabled={journalEnabled}
            onToggle={setJournalEnabled}
          >
            <input
              type="time"
              value={journalTime}
              onChange={(e) => setJournalTime(e.target.value)}
              disabled={!journalEnabled}
              style={timeInputStyle}
            />
          </ReminderRow>

          {/* Meditation */}
          <ReminderRow
            icon="🧘"
            title="Morning Meditation"
            description="Start your morning with 5 minutes of grounding"
            enabled={meditationEnabled}
            onToggle={setMeditationEnabled}
          >
            <input
              type="time"
              value={meditationTime}
              onChange={(e) => setMeditationTime(e.target.value)}
              disabled={!meditationEnabled}
              style={timeInputStyle}
            />
          </ReminderRow>

          {/* Water */}
          <ReminderRow
            icon="💧"
            title="Hydration Interval"
            description="Periodic water intake reminder during daytime"
            enabled={waterEnabled}
            onToggle={setWaterEnabled}
          >
            <select
              value={waterInterval}
              onChange={(e) => setWaterInterval(parseInt(e.target.value))}
              disabled={!waterEnabled}
              style={timeInputStyle}
            >
              <option value={30}>Every 30 mins</option>
              <option value={60}>Every 60 mins</option>
              <option value={120}>Every 2 hours</option>
            </select>
          </ReminderRow>

          {/* Sleep */}
          <ReminderRow
            icon="🌙"
            title="Sleep Wind-down"
            description="Screen time cool-off reminder"
            enabled={sleepEnabled}
            onToggle={setSleepEnabled}
          >
            <input
              type="time"
              value={sleepTime}
              onChange={(e) => setSleepTime(e.target.value)}
              disabled={!sleepEnabled}
              style={timeInputStyle}
            />
          </ReminderRow>

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
              marginTop: 20,
            }}
          >
            {saving ? "Saving..." : "Save Reminder Schedule ✨"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default function RemindersPage() {
  const isAndroid = useIsAndroid();

  if (isAndroid) {
    return <AndroidReminders />;
  }

  return <DesktopRemindersView />;
}
