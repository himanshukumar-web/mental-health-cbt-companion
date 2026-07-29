"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import WellnessScoreCard from "@/components/WellnessScoreCard";
import InsightChartCard from "@/components/InsightChartCard";
import PersonaSelector from "@/components/PersonaSelector";
import PatientNotificationBell from "@/components/PatientNotificationBell";
import QuickMoodLogger from "@/components/QuickMoodLogger";
import { useWellnessScore } from "@/hooks/useWellnessScore";
import { usePersona } from "@/hooks/usePersona";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import Link from "next/link";
import { PersonalizedInsight } from "@/types/persona";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface MoodEntry {
  date: string;
  mood_score: number;
  mood_emoji: string;
  stress_level: number | null;
  sleep_hours: number | null;
}

interface Appointment {
  id: string;
  doctor_id: string;
  doctor_name?: string;
  patient_name: string;
  date: string;
  time_slot: string;
  status: string;
  notes: string;
}

const MINDFUL_QUOTES = [
  { text: "You don't have to control your thoughts. You just have to stop letting them control you.", author: "Dan Millman" },
  { text: "Peace begins when expectation ends.", author: "Sri Sri Ravi Shankar" },
  { text: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.", author: "Thich Nhat Hanh" },
  { text: "Small steps every day lead to profound emotional healing.", author: "Sera CBT" },
];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [journalCount, setJournalCount] = useState(0);
  const [cbtCount, setCbtCount] = useState(0);
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [streakDays, setStreakDays] = useState(1);
  const [insights, setInsights] = useState<PersonalizedInsight[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Daily Mindful Goals state
  const [habitsDone, setHabitsDone] = useState<{ [key: string]: boolean }>({
    meditation: false,
    journal: false,
    breathing: false,
    water: true,
  });

  const [quoteIndex, setQuoteIndex] = useState(0);

  const { currentScore, loading: scoreLoading, refetch: refetchScore } = useWellnessScore(user?.id);
  const { personas, activePersona, selectPersona, selectedPersonaId } = usePersona(user?.id);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  // Determine time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good Morning", icon: "🌅" };
    if (hour < 17) return { text: "Good Afternoon", icon: "☀️" };
    if (hour < 21) return { text: "Good Evening", icon: "🌙" };
    return { text: "Good Night", icon: "✨" };
  };

  const greeting = getGreeting();

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [moodRes, journalRes, cbtRes, xpRes, insightsRes, apptRes] = await Promise.all([
        fetch(`${API_URL}/mood-entries/${user.id}`),
        fetch(`${API_URL}/journal/${user.id}`),
        fetch(`${API_URL}/cbt-worksheets/${user.id}`),
        fetch(`${API_URL}/gamification/xp/${user.id}`),
        fetch(`${API_URL}/insights/${user.id}`),
        fetch(`${API_URL}/appointments/patient/${user.id}`),
      ]);

      if (moodRes.ok) {
        const json = await moodRes.json();
        const entries: MoodEntry[] = json.mood_entries || [];
        setMoodEntries(entries);
        if (entries.length > 0) {
          setStreakDays(Math.min(entries.length, 7));
        }
      }
      if (journalRes.ok) {
        const json = await journalRes.json();
        const jList = json.journal_entries || [];
        setJournalCount(jList.length);
        if (jList.length > 0) {
          setHabitsDone((prev) => ({ ...prev, journal: true }));
        }
      }
      if (cbtRes.ok) {
        const json = await cbtRes.json();
        setCbtCount((json.worksheets || []).length);
      }
      if (xpRes.ok) {
        const json = await xpRes.json();
        setUserXP(json.xp?.total_xp || 0);
        setUserLevel(json.xp?.level || 1);
      }
      if (insightsRes.ok) {
        const json = await insightsRes.json();
        setInsights(json.insights || []);
      }
      if (apptRes.ok) {
        const json = await apptRes.json();
        setAppointments(json.appointments || []);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleHabit = (key: string) => {
    setHabitsDone((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (authLoading || loading)
    return (
      <>
        <Sidebar />
        <div style={{ marginLeft: 250 }}>
          <PageSkeleton />
        </div>
      </>
    );
  if (!user) return null;

  const displayName = user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "Friend";
  const quote = MINDFUL_QUOTES[quoteIndex];

  const completedHabitsCount = Object.values(habitsDone).filter(Boolean).length;
  const totalHabitsCount = Object.keys(habitsDone).length;
  const habitPercentage = Math.round((completedHabitsCount / totalHabitsCount) * 100);

  const upcomingAppt = appointments.find((a) => a.status === "confirmed" || a.status === "pending");

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
          marginLeft: 250,
          padding: "28px 24px 80px",
          maxWidth: 1120,
          overflow: "auto",
        }}
      >
        <style>{`
          @media (max-width: 767px) { main { margin-left: 0 !important; padding: 16px 14px 80px !important; } }
          @keyframes pulseGlow { 0%,100%{box-shadow: 0 0 15px rgba(34,197,94,0.2);} 50%{box-shadow: 0 0 30px rgba(34,197,94,0.45);} }
        `}</style>

        {/* Header & Patient Quick Nav Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 24 }}>{greeting.icon}</span>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(24px, 4vw, 32px)",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                {greeting.text}, {displayName}!
              </h1>
            </div>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
              Your personal AI therapy & mental wellness dashboard
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {/* XP & Level Badge */}
            <Link
              href="/achievements"
              style={{
                padding: "8px 14px",
                borderRadius: 14,
                background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))",
                border: "1px solid rgba(245,158,11,0.3)",
                color: "#f59e0b",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s",
              }}
            >
              🏆 Lvl {userLevel} ({userXP} XP)
            </Link>

            {/* Streak Badge */}
            <div
              style={{
                padding: "8px 14px",
                borderRadius: 14,
                background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#f87171",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              🔥 {streakDays}-Day Streak
            </div>

            {/* Patient Notifications */}
            <PatientNotificationBell userId={user.id} />
          </div>
        </div>

        {/* Daily Mindfulness Quote Banner */}
        <div
          style={{
            padding: "16px 20px",
            borderRadius: 18,
            background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(6,182,212,0.05))",
            border: "1px solid rgba(34,197,94,0.2)",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
            <span style={{ fontSize: 22, color: "#22c55e" }}>💡</span>
            <div>
              <div style={{ fontSize: 13, color: "var(--text-primary)", fontStyle: "italic", fontWeight: 500 }}>
                "{quote.text}"
              </div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
                — {quote.author}
              </div>
            </div>
          </div>
          <button
            onClick={() => setQuoteIndex((prev) => (prev + 1) % MINDFUL_QUOTES.length)}
            style={{
              background: "none",
              border: "none",
              color: "#22c55e",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ↻ Next
          </button>
        </div>

        {/* 1-Tap Quick Mood Check-In Widget */}
        <div style={{ marginBottom: 24 }}>
          <QuickMoodLogger
            userId={user.id}
            onMoodLogged={() => {
              fetchData();
              refetchScore();
            }}
          />
        </div>

        {/* Main 2-Column Hero Grid: AI Therapy Companion + Habits Checklist */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
            gap: 20,
            marginBottom: 24,
          }}
        >
          {/* AI Therapy Companion Launch Card */}
          <div
            style={{
              padding: 24,
              borderRadius: 20,
              background: "linear-gradient(145deg, rgba(34,197,94,0.12), rgba(16,185,129,0.04))",
              border: "1px solid rgba(34,197,94,0.3)",
              backdropFilter: "blur(16px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: "linear-gradient(135deg, #22c55e, #16a34a)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      boxShadow: "0 4px 16px rgba(34,197,94,0.3)",
                    }}
                  >
                    💬
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#22c55e", letterSpacing: "0.06em" }}>
                      Active Companion
                    </span>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                      {activePersona.name} ({activePersona.title})
                    </h3>
                  </div>
                </div>

                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 12,
                    background: "rgba(34,197,94,0.2)",
                    color: "#86efac",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  🟢 Online & Ready
                </span>
              </div>

              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                "{activePersona.description}"
              </p>

              {/* Starter Prompts */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {[
                  "I'm feeling overwhelmed today 🌊",
                  "Help me reframe a negative thought 🧠",
                  "5-minute grounding exercise 🧘",
                ].map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => router.push(`/chat?prompt=${encodeURIComponent(promptText)}`)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "var(--text-secondary)",
                      fontSize: 12,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                    }}
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>

            <Link
              href="/chat"
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 14,
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "white",
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 20px rgba(34,197,94,0.35)",
                transition: "all 0.2s",
              }}
            >
              <span>Start Therapy Session with {activePersona.name}</span>
              <span>→</span>
            </Link>
          </div>

          {/* Daily Mindful Goals / Habits Checklist */}
          <div
            style={{
              padding: 24,
              borderRadius: 20,
              background: "var(--bg-glass)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--border-secondary)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#3b82f6", letterSpacing: "0.08em" }}>
                    Daily Routine
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: "2px 0 0" }}>
                    Mindful Habits ({completedHabitsCount}/{totalHabitsCount})
                  </h3>
                </div>

                <div
                  style={{
                    padding: "4px 10px",
                    borderRadius: 12,
                    background: "rgba(59,130,246,0.15)",
                    color: "#60a5fa",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {habitPercentage}% Completed
                </div>
              </div>

              {/* Habit Checklist */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                {[
                  { key: "meditation", icon: "🧘", label: "5-min Meditation", path: "/meditation" },
                  { key: "journal", icon: "📝", label: "Reflective Journal Entry", path: "/journal" },
                  { key: "breathing", icon: "🫁", label: "Deep Breathing Session", path: "/breathing" },
                  { key: "water", icon: "💧", label: "Hydration Check (2L Water)", path: "/habits" },
                ].map((item) => {
                  const isChecked = habitsDone[item.key];
                  return (
                    <div
                      key={item.key}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 14,
                        background: isChecked ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                        border: isChecked ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(255,255,255,0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.2s",
                      }}
                    >
                      <div
                        onClick={() => toggleHabit(item.key)}
                        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: 1 }}
                      >
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            border: isChecked ? "none" : "2px solid var(--text-tertiary)",
                            background: isChecked ? "#22c55e" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {isChecked && "✓"}
                        </div>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: isChecked ? "var(--text-primary)" : "var(--text-secondary)",
                            textDecoration: isChecked ? "line-through" : "none",
                          }}
                        >
                          {item.icon} {item.label}
                        </span>
                      </div>

                      <Link
                        href={item.path}
                        style={{
                          fontSize: 12,
                          color: "#3b82f6",
                          textDecoration: "none",
                          fontWeight: 600,
                        }}
                      >
                        Open →
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            <Link
              href="/habits"
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                textDecoration: "none",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              View Full Habits Tracker & Streaks →
            </Link>
          </div>
        </div>

        {/* Upcoming Doctor Consultations Banner (If any) */}
        {upcomingAppt && (
          <div
            style={{
              padding: "18px 24px",
              borderRadius: 20,
              background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(59,130,246,0.06))",
              border: "1px solid rgba(245,158,11,0.3)",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                }}
              >
                🩺
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#f59e0b", letterSpacing: "0.06em" }}>
                  Upcoming Doctor Consultation
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
                  {upcomingAppt.doctor_name || "Doctor Appointment"} — {upcomingAppt.date} at {upcomingAppt.time_slot}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                  Status: <strong style={{ color: upcomingAppt.status === "confirmed" ? "#22c55e" : "#f59e0b" }}>{upcomingAppt.status.toUpperCase()}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Link
                href="/appointments/my?tab=chat"
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  background: "#3b82f6",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                💬 Chat with Doctor
              </Link>
              <Link
                href="/appointments/my"
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.08)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Manage
              </Link>
            </div>
          </div>
        )}

        {/* AI Wellness Score Engine Card */}
        <div style={{ marginBottom: 24 }}>
          <WellnessScoreCard scoreData={currentScore} loading={scoreLoading} />
        </div>

        {/* Therapeutic Persona Switcher */}
        <div
          style={{
            padding: 20,
            borderRadius: 20,
            background: "var(--bg-glass)",
            backdropFilter: "blur(16px)",
            border: "1px solid var(--border-secondary)",
            marginBottom: 24,
          }}
        >
          <PersonaSelector
            personas={personas}
            activePersonaId={selectedPersonaId}
            onSelectPersona={selectPersona}
            compact={false}
          />
        </div>

        {/* Personalized AI Insights Chart */}
        <div style={{ marginBottom: 24 }}>
          <InsightChartCard insights={insights} />
        </div>

        {/* Quick Tools & AI Features Grid */}
        <div style={{ marginBottom: 12 }}>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: 14,
              fontFamily: "var(--font-display)",
            }}
          >
            Therapeutic Tools & Care Hub 🛠️
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <Link
              href="/chat"
              style={{
                padding: 20,
                borderRadius: 18,
                background: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.03))",
                border: "1px solid rgba(34,197,94,0.3)",
                textDecoration: "none",
                color: "var(--text-primary)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "transform 0.2s ease, boxShadow 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 28 }}>💬</span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: "rgba(34,197,94,0.2)", color: "#22c55e", fontWeight: 700 }}>
                  Active
                </span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>AI CBT Therapy Chat</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                24/7 CBT-guided therapy sessions with dual safety agent monitoring.
              </div>
            </Link>

            <Link
              href="/journal"
              style={{
                padding: 20,
                borderRadius: 18,
                background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.03))",
                border: "1px solid rgba(245,158,11,0.3)",
                textDecoration: "none",
                color: "var(--text-primary)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "transform 0.2s ease, boxShadow 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 28 }}>📝</span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: "rgba(245,158,11,0.2)", color: "#f59e0b", fontWeight: 700 }}>
                  {journalCount} Entries
                </span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Reflective Journal</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Write your thoughts freely; get instant AI emotional & cognitive breakdown.
              </div>
            </Link>

            <Link
              href="/cbt"
              style={{
                padding: 20,
                borderRadius: 18,
                background: "linear-gradient(135deg, rgba(6,182,212,0.12), rgba(6,182,212,0.03))",
                border: "1px solid rgba(6,182,212,0.3)",
                textDecoration: "none",
                color: "var(--text-primary)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "transform 0.2s ease, boxShadow 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 28 }}>🧠</span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: "rgba(6,182,212,0.2)", color: "#06b6d4", fontWeight: 700 }}>
                  {cbtCount} Saved
                </span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>CBT Thought Records</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Identify automatic thought distortions and build balanced perspectives.
              </div>
            </Link>

            <Link
              href="/assessments"
              style={{
                padding: 20,
                borderRadius: 18,
                background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.03))",
                border: "1px solid rgba(139,92,246,0.3)",
                textDecoration: "none",
                color: "var(--text-primary)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "transform 0.2s ease, boxShadow 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 28 }}>📊</span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: "rgba(139,92,246,0.2)", color: "#8b5cf6", fontWeight: 700 }}>
                  Clinical Tests
                </span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>PHQ-9 & GAD-7 Screening</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Standard clinical questionnaires for tracking depression and anxiety levels.
              </div>
            </Link>

            <Link
              href="/breathing"
              style={{
                padding: 20,
                borderRadius: 18,
                background: "linear-gradient(135deg, rgba(236,72,153,0.12), rgba(236,72,153,0.03))",
                border: "1px solid rgba(236,72,153,0.3)",
                textDecoration: "none",
                color: "var(--text-primary)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "transform 0.2s ease, boxShadow 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 28 }}>🫁</span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: "rgba(236,72,153,0.2)", color: "#ec4899", fontWeight: 700 }}>
                  Grounding
                </span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Breathing & Meditation</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Guided 4-7-8 box breathing and mindfulness sessions for instant calm.
              </div>
            </Link>

            <Link
              href="/appointments"
              style={{
                padding: 20,
                borderRadius: 18,
                background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.03))",
                border: "1px solid rgba(59,130,246,0.3)",
                textDecoration: "none",
                color: "var(--text-primary)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "transform 0.2s ease, boxShadow 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 28 }}>📅</span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: "rgba(59,130,246,0.2)", color: "#3b82f6", fontWeight: 700 }}>
                  Human Doctors
                </span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Book Specialist Consultation</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Connect with verified clinical therapists and schedule online sessions.
              </div>
            </Link>
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
