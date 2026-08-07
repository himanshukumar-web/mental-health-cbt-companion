"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
// import AudioStreamer from "@/components/AudioStreamer";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import toast from "react-hot-toast";

import { API_URL } from "@/lib/config";

interface MeditationSession {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  description: string;
  icon: string;
  color: string;
  steps: string[];
}

const MEDITATION_LIBRARY: MeditationSession[] = [
  {
    id: "anxiety-1",
    category: "Anxiety",
    title: "Easing Anxious Thoughts",
    durationMinutes: 5,
    description: "Release tight tension in your body and soothe racing thoughts with gentle focus.",
    icon: "🌊",
    color: "#3b82f6",
    steps: [
      "Find a comfortable position and gently close your eyes.",
      "Bring attention to your breath. Feel the natural rise and fall of your chest.",
      "Notice any racing thoughts without judgment. Imagine them drifting away like clouds.",
      "Inhale peace... Exhale tension...",
      "Open your eyes slowly when you feel grounded.",
    ],
  },
  {
    id: "stress-1",
    category: "Stress",
    title: "Body Scan Relaxation",
    durationMinutes: 5,
    description: "Systematically release physical stress stored in your shoulders, neck, and jaw.",
    icon: "🧘",
    color: "#22c55e",
    steps: [
      "Sit back softly and rest your hands on your lap.",
      "Focus on your shoulders. Let them drop and relax away from your ears.",
      "Unclench your jaw and soften the muscles around your eyes.",
      "Breathe deeply into any area that still feels tight or heavy.",
      "Feel a wave of calm flowing from your head down to your toes.",
    ],
  },
  {
    id: "sleep-1",
    category: "Sleep",
    title: "Deep Night Wind-Down",
    durationMinutes: 10,
    description: "Prepare your mind for restful sleep by slowing down mental chatter.",
    icon: "🌙",
    color: "#8b5cf6",
    steps: [
      "Lie down in bed and allow your eyes to softly close.",
      "Recall one good moment from today and express silent gratitude.",
      "Let go of tomorrow's to-do list. Tonight is for rest.",
      "Take slow, deep breaths. Imagine sinking into a soft, safe cloud.",
      "Rest easy. You are safe and peaceful.",
    ],
  },
  {
    id: "focus-1",
    category: "Focus",
    title: "Single-Point Awareness",
    durationMinutes: 3,
    description: "Clear mental fog and sharpen clarity for deep work or studying.",
    icon: "🎯",
    color: "#f59e0b",
    steps: [
      "Sit up straight with your feet flat on the floor.",
      "Fix your internal focus solely on the sensation of air entering your nostrils.",
      "When your mind wanders, gently bring it back without frustration.",
      "Notice the newfound clarity in your mind.",
    ],
  },
  {
    id: "depression-1",
    category: "Depression",
    title: "Self-Compassion & Warmth",
    durationMinutes: 5,
    description: "Nurture kindness toward yourself when feeling down or emotionally heavy.",
    icon: "💛",
    color: "#ec4899",
    steps: [
      "Place one hand gently over your heart.",
      "Acknowledge that feeling low is part of being human. You are not broken.",
      "Silently whisper to yourself: 'May I be kind to myself in this moment.'",
      "Feel the physical warmth of your hand radiating comfort inward.",
    ],
  },
  {
    id: "relaxation-1",
    category: "Relaxation",
    title: "Ocean Wave Grounding",
    durationMinutes: 5,
    description: "Synchronize your breath with rhythmic ocean waves for total relaxation.",
    icon: "🏖",
    color: "#06b6d4",
    steps: [
      "Imagine standing by a tranquil shoreline under warm sunlight.",
      "Inhale as the gentle ocean wave rolls onto the sand...",
      "Exhale as the wave recedes peacefully into the sea...",
      "Repeat this ocean rhythm and let tranquility wash over you.",
    ],
  },
];

const CATEGORIES = ["All", "Anxiety", "Stress", "Sleep", "Focus", "Depression", "Relaxation"];

export default function MeditationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const handleCompleteSession = useCallback(async () => {
    if (!user || !activeSession) return;
    toast.success(`Session Completed! +150 XP Earned 🎉`, { duration: 4000 });

    try {
      await fetch(`${API_URL}/meditation/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          category: activeSession.category,
          title: activeSession.title,
          duration_minutes: activeSession.durationMinutes,
        }),
      });
    } catch {
      /* ignore */
    }
  }, [user, activeSession]);

  // Timer Countdown Logic
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      const timer = setTimeout(() => {
        setIsTimerRunning(false);
        handleCompleteSession();
      }, 0);
      return () => clearTimeout(timer);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timerSeconds, handleCompleteSession]);

  const startSession = (session: MeditationSession) => {
    setActiveSession(session);
    setTotalSeconds(session.durationMinutes * 60);
    setTimerSeconds(session.durationMinutes * 60);
    setCurrentStepIdx(0);
    setIsTimerRunning(true);
  };

  const closeSessionPlayer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerRunning(false);
    setActiveSession(null);
  };

  if (authLoading)
    return (
      <>
        <Sidebar />
        <div className="app-main-layout">
          <PageSkeleton />
        </div>
      </>
    );
  if (!user) return null;

  const filteredSessions =
    selectedCategory === "All"
      ? MEDITATION_LIBRARY
      : MEDITATION_LIBRARY.filter((s) => s.category === selectedCategory);

  const progressPct =
    totalSeconds > 0 ? ((totalSeconds - timerSeconds) / totalSeconds) * 100 : 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-primary)",
      }}
    >
      <Sidebar />
      <main className="app-main-layout" style={{ padding: "24px 20px", maxWidth: 950, overflow: "auto" }}>
        <MobileHeader title="Mindful Meditation" />
        <style>{`
          @media (max-width: 767px) { main { margin-left: 0 !important; padding: 16px !important; } }
          @keyframes pulseGlow { 0%,100%{box-shadow:0 0 20px rgba(59,130,246,0.3)} 50%{box-shadow:0 0 40px rgba(34,197,94,0.5)} }
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
            Guided Meditation Library 🧘
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Select a mindfulness session to calm your mind and earn XP
          </p>
        </div>

        {/* Category Filters */}
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 8,
            marginBottom: 24,
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "8px 16px",
                borderRadius: 12,
                border: "none",
                background:
                  selectedCategory === cat
                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                    : "var(--bg-secondary)",
                color: selectedCategory === cat ? "white" : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Meditation Session Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              style={{
                padding: "20px",
                borderRadius: 16,
                background: "var(--bg-glass)",
                border: "0.5px solid var(--border-secondary)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: `${session.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                    }}
                  >
                    {session.icon}
                  </div>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 8,
                      background: "var(--bg-tertiary)",
                      fontSize: 11,
                      fontWeight: 600,
                      color: session.color,
                    }}
                  >
                    ⏱ {session.durationMinutes} mins
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: 6,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {session.title}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    marginBottom: 16,
                  }}
                >
                  {session.description}
                </p>
              </div>

              <button
                onClick={() => startSession(session)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 10,
                  background: session.color,
                  border: "none",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Begin Session ▶
              </button>
            </div>
          ))}
        </div>

        {/* Active Session Fullscreen Player Modal */}
        {activeSession && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "var(--bg-primary)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
            }}
          >
            <button
              onClick={closeSessionPlayer}
              style={{
                position: "absolute",
                top: 24,
                right: 24,
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--bg-secondary)",
                border: "none",
                color: "var(--text-primary)",
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              ✕
            </button>

            <div style={{ textAlign: "center", maxWidth: 500 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{activeSession.icon}</div>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-display)",
                  marginBottom: 8,
                }}
              >
                {activeSession.title}
              </h2>

              {/* Progress Ring & Countdown */}
              <div
                style={{
                  position: "relative",
                  width: 180,
                  height: 180,
                  margin: "24px auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <circle
                    cx="90"
                    cy="90"
                    r="80"
                    fill="none"
                    stroke="var(--bg-tertiary)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="90"
                    cy="90"
                    r="80"
                    fill="none"
                    stroke={activeSession.color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${progressPct * 5.02} 502`}
                    transform="rotate(-90 90 90)"
                    style={{ transition: "stroke-dasharray 1s linear" }}
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    fontSize: 32,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {formatTime(timerSeconds)}
                </div>
              </div>

              {/* Guided Step Instruction */}
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: 14,
                  background: "var(--bg-glass)",
                  border: "0.5px solid var(--border-secondary)",
                  fontSize: 14,
                  color: "var(--text-primary)",
                  lineHeight: 1.6,
                  marginBottom: 24,
                  minHeight: 70,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {activeSession.steps[currentStepIdx % activeSession.steps.length]}
              </div>

              {/* Player Controls */}
              <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                <button
                  onClick={() =>
                    setCurrentStepIdx((prev) => Math.max(0, prev - 1))
                  }
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    background: "var(--bg-secondary)",
                    border: "none",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                  }}
                >
                  ◀ Prev Step
                </button>
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 10,
                    background: activeSession.color,
                    border: "none",
                    color: "white",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {isTimerRunning ? "Pause ⏸" : "Resume ▶"}
                </button>
                <button
                  onClick={() =>
                    setCurrentStepIdx(
                      (prev) => (prev + 1) % activeSession.steps.length
                    )
                  }
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    background: "var(--bg-secondary)",
                    border: "none",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                  }}
                >
                  Next Step ▶
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
