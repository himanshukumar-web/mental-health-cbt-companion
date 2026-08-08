"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAndroid } from "@/hooks/useIsAndroid";
import AndroidDashboard from "@/components/mobile/AndroidDashboard";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import WellnessScoreCard from "@/components/WellnessScoreCard";
import InsightChartCard from "@/components/InsightChartCard";
import PersonaSelector from "@/components/PersonaSelector";
import PatientNotificationBell from "@/components/PatientNotificationBell";
import QuickMoodLogger from "@/components/QuickMoodLogger";
import DesktopRightSidebar from "@/components/DesktopRightSidebar";
import { useWellnessScore } from "@/hooks/useWellnessScore";
import { usePersona } from "@/hooks/usePersona";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import Link from "next/link";
import { PersonalizedInsight } from "@/types/persona";
import { motion } from "framer-motion";
import { API_URL } from "@/lib/config";

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

const QUICK_ACTIONS = [
  { icon: "🤖", title: "Talk with AI", prompt: "I need CBT guidance for my thoughts today.", color: "#22c55e", bg: "rgba(34,197,94,0.12)", href: "/chat" },
  { icon: "📝", title: "Journal", href: "/journal", color: "#ec4899", bg: "rgba(236,72,153,0.12)" },
  { icon: "🧘", title: "Meditate", href: "/meditation", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  { icon: "🎭", title: "Mood Check", href: "/mood", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  { icon: "🫁", title: "Breathing", href: "/breathing", color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  { icon: "📅", title: "Appointments", href: "/appointments", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
];

const MINDFUL_QUOTES = [
  { text: "You don't have to control your thoughts. You just have to stop letting them control you.", author: "Dan Millman" },
  { text: "Peace begins when expectation ends.", author: "Sri Sri Ravi Shankar" },
  { text: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.", author: "Thich Nhat Hanh" },
  { text: "Small steps every day lead to profound emotional healing.", author: "Sera CBT" },
];

function DesktopDashboardView() {
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();

  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [journalCount, setJournalCount] = useState(0);
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [streakDays, setStreakDays] = useState(1);
  const [insights, setInsights] = useState<PersonalizedInsight[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

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
      const results = await Promise.allSettled([
        fetch(`${API_URL}/mood-entries/${user.id}`),
        fetch(`${API_URL}/journal/${user.id}`),
        fetch(`${API_URL}/cbt-worksheets/${user.id}`),
        fetch(`${API_URL}/gamification/xp/${user.id}`),
        fetch(`${API_URL}/insights/${user.id}`),
        fetch(`${API_URL}/appointments/user/${user.id}`),
      ]);

      const [moodRes, journalRes, cbtRes, xpRes, insightsRes, apptRes] = results;

      if (moodRes.status === "fulfilled" && moodRes.value.ok) {
        const json = await moodRes.value.json();
        const entries: MoodEntry[] = json.mood_entries || [];
        setMoodEntries(entries);
        if (entries.length > 0) setStreakDays(Math.min(entries.length, 7));
      }
      if (journalRes.status === "fulfilled" && journalRes.value.ok) {
        const json = await journalRes.value.json();
        const jList = json.journal_entries || [];
        setJournalCount(jList.length);
        if (jList.length > 0) setHabitsDone((prev) => ({ ...prev, journal: true }));
      }
      if (xpRes.status === "fulfilled" && xpRes.value.ok) {
        const json = await xpRes.value.json();
        const parsedXp = typeof json.xp === "object" && json.xp !== null ? Number(json.xp.total_xp ?? json.xp.xp ?? 0) : typeof json.xp === "number" ? json.xp : 0;
        const parsedLevel = typeof json.xp === "object" && json.xp !== null ? Number(json.xp.level ?? 1) : typeof json.level === "number" ? json.level : 1;
        setUserXP(parsedXp);
        setUserLevel(parsedLevel);
      }
      if (insightsRes.status === "fulfilled" && insightsRes.value.ok) {
        const json = await insightsRes.value.json();
        setInsights(json.insights || []);
      }
      if (apptRes.status === "fulfilled" && apptRes.value.ok) {
        const json = await apptRes.value.json();
        setAppointments(json.appointments || []);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
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

      <div
        className="app-main-layout"
        style={{
          display: "flex",
          gap: 24,
          maxWidth: 1380,
          overflow: "auto",
        }}
      >
        <style>{`
          @media (max-width: 1100px) { .desktop-right-sidebar-container { display: none !important; } }
        `}</style>

        <main style={{ flex: 1, minWidth: 0 }}>
          <MobileHeader title="Dashboard" />
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
                }}
              >
                🏆 Lvl {userLevel} ({userXP} XP)
              </Link>

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

              <PatientNotificationBell userId={user.id} />
            </div>
          </div>

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
                  &quot;{quote.text}&quot;
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

          {userRole === "admin" ? (
            <div
              style={{
                padding: "18px 22px",
                borderRadius: 18,
                background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))",
                border: "1px solid rgba(245,158,11,0.3)",
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: "rgba(245,158,11,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                  }}
                >
                  🩺
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-display)" }}>
                    Doctor Portal — Patient Appointments
                  </h4>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 0" }}>
                    Patients book appointments with you. View and manage patient appointments directly in your doctor dashboard.
                  </p>
                </div>
              </div>
              <Link
                href="/admin?tab=appointments"
                style={{
                  padding: "10px 18px",
                  borderRadius: 14,
                  background: "#f59e0b",
                  color: "#000",
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 4px 16px rgba(245,158,11,0.3)",
                }}
              >
                <span>View Patient Appointments</span>
                <span>→</span>
              </Link>
            </div>
          ) : (
            upcomingAppt && (
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: 18,
                  background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.04))",
                  border: "1px solid rgba(59,130,246,0.3)",
                  marginBottom: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#3b82f6", letterSpacing: "0.06em" }}>
                    Upcoming Appointment
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>
                    📅 {upcomingAppt.date} at {upcomingAppt.time_slot}
                  </div>
                </div>
                <Link
                  href="/appointments/my"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 12,
                    background: "rgba(59,130,246,0.2)",
                    color: "#60a5fa",
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  View Details →
                </Link>
              </div>
            )
          )}

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12, fontFamily: "var(--font-display)" }}>
              Quick Wellness Actions ⚡
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
              {QUICK_ACTIONS.map((qa, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.03, translateY: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    if (qa.href) router.push(qa.href);
                    else if (qa.prompt) router.push(`/chat?prompt=${encodeURIComponent(qa.prompt)}`);
                  }}
                  style={{
                    padding: "16px 14px",
                    borderRadius: 16,
                    background: qa.bg,
                    border: `1px solid ${qa.color}35`,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    transition: "all 0.2s ease",
                  }}
                >
                  <span style={{ fontSize: 24 }}>{qa.icon}</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                    {qa.title}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <QuickMoodLogger
              userId={user.id}
              onMoodLogged={() => {
                fetchData();
                refetchScore();
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
              gap: 20,
              marginBottom: 24,
            }}
          >
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
                    🟢 Active
                  </span>
                </div>

                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                  &quot;{activePersona.description}&quot;
                </p>
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
                }}
              >
                <span>Start Session with {activePersona.name}</span>
                <span>→</span>
              </Link>
            </div>

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
                      Mindful Goals ({completedHabitsCount}/{totalHabitsCount})
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
                    {habitPercentage}%
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { key: "meditation", icon: "🧘", label: "5-min Meditation", path: "/meditation" },
                    { key: "journal", icon: "📝", label: "Reflective Journal Entry", path: "/journal" },
                    { key: "breathing", icon: "🫁", label: "Deep Breathing Session", path: "/breathing" },
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
                        }}
                      >
                        <div
                          onClick={() => toggleHabit(item.key)}
                          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: 1 }}
                        >
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 6,
                              border: isChecked ? "none" : "2px solid var(--text-tertiary)",
                              background: isChecked ? "#22c55e" : "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: 11,
                              fontWeight: 800,
                            }}
                          >
                            {isChecked && "✓"}
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: isChecked ? "var(--text-primary)" : "var(--text-secondary)",
                              textDecoration: isChecked ? "line-through" : "none",
                            }}
                          >
                            {item.icon} {item.label}
                          </span>
                        </div>
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
                  marginTop: 12,
                }}
              >
                Manage All Habits →
              </Link>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <WellnessScoreCard scoreData={currentScore} loading={scoreLoading} />
          </div>

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

          <div style={{ marginBottom: 24 }}>
            <InsightChartCard insights={insights} />
          </div>
        </main>

        <div className="desktop-right-sidebar-container">
          <DesktopRightSidebar
            moodEntries={moodEntries}
            journalCount={journalCount}
            streakDays={streakDays}
            userLevel={userLevel}
            userXP={userXP}
          />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const isAndroid = useIsAndroid();

  if (isAndroid) {
    return <AndroidDashboard />;
  }

  return <DesktopDashboardView />;
}
