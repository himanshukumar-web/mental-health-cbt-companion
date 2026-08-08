"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AndroidMobileLayout from "./AndroidMobileLayout";
import { TopAppBar, MaterialCard, Button, Chip, LoadingSkeleton, Dialog } from "./ui";
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
  { id: "anxiety-1", category: "Anxiety", title: "Easing Anxious Thoughts", durationMinutes: 5, description: "Release tension and soothe racing thoughts with gentle focus.", icon: "🌊", color: "#3b82f6", steps: ["Find a comfortable position.", "Bring attention to your breath.", "Notice thoughts without judgment.", "Inhale peace... Exhale tension.", "Open your eyes when ready."] },
  { id: "stress-1", category: "Stress", title: "Body Scan Relaxation", durationMinutes: 5, description: "Systematically release physical stress from your body.", icon: "🧘", color: "#22c55e", steps: ["Sit back softly.", "Focus on your shoulders.", "Unclench your jaw.", "Breathe into tight areas.", "Feel a wave of calm."] },
  { id: "sleep-1", category: "Sleep", title: "Deep Night Wind-Down", durationMinutes: 10, description: "Prepare your mind for restful sleep by slowing chatter.", icon: "🌙", color: "#8b5cf6", steps: ["Lie down in bed.", "Recall a good moment.", "Let go of to-do lists.", "Take slow, deep breaths.", "Rest easy. You are safe."] },
  { id: "focus-1", category: "Focus", title: "Single-Point Awareness", durationMinutes: 3, description: "Clear mental fog and sharpen clarity for work.", icon: "🎯", color: "#f59e0b", steps: ["Sit up straight.", "Focus on air in nostrils.", "Bring mind back if it wanders.", "Notice the clarity."] },
];

const CATEGORIES = ["All", "Anxiety", "Stress", "Sleep", "Focus"];

export default function AndroidMeditation() {
  const { user } = useAuth();
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCompleteSession = useCallback(async () => {
    if (!user || !activeSession) return;
    toast.success(`Session Completed! +150 XP`);
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
    } catch { /* ignore */ }
  }, [user, activeSession]);

  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => setTimerSeconds((prev) => prev - 1), 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsTimerRunning(false);
      handleCompleteSession();
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerRunning, timerSeconds, handleCompleteSession]);

  const startSession = (session: MeditationSession) => {
    setActiveSession(session);
    setTotalSeconds(session.durationMinutes * 60);
    setTimerSeconds(session.durationMinutes * 60);
    setCurrentStepIdx(0);
    setIsTimerRunning(true);
  };

  const filteredSessions = selectedCategory === "All" ? MEDITATION_LIBRARY : MEDITATION_LIBRARY.filter(s => s.category === selectedCategory);
  const progressPct = totalSeconds > 0 ? ((totalSeconds - timerSeconds) / totalSeconds) * 100 : 0;
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <AndroidMobileLayout hasBottomNav={true}>
      <TopAppBar title="Mindfulness Library" subtitle="Guided meditation sessions" />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Categories */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          {CATEGORIES.map(cat => (
            <Chip key={cat} label={cat} selected={selectedCategory === cat} onClick={() => setSelectedCategory(cat)} />
          ))}
        </div>

        {/* Library Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {filteredSessions.map(session => (
            <MaterialCard
              key={session.id}
              variant="elevated"
              onClick={() => startSession(session)}
              style={{ display: "flex", flexDirection: "column", gap: "10px", minHeight: "160px" }}
            >
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: `${session.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                {session.icon}
              </div>
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#e8edf5", margin: 0 }}>{session.title}</h3>
                <span style={{ fontSize: "11px", color: session.color, fontWeight: 700 }}>{session.durationMinutes} MINS</span>
              </div>
              <p style={{ fontSize: "11px", color: "#8b95a7", margin: 0, lineHeight: 1.4 }}>{session.description}</p>
            </MaterialCard>
          ))}
        </div>
      </div>

      {/* Active Session Player Drawer/Modal */}
      {activeSession && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "#0b0f1a", display: "flex", flexDirection: "column", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => { setIsTimerRunning(false); setActiveSession(null); }} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "12px", width: "40px", height: "40px", color: "#e8edf5" }}>✕</button>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>{activeSession.icon}</div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#e8edf5", margin: "0 0 8px 0" }}>{activeSession.title}</h2>
            <span style={{ fontSize: "14px", color: activeSession.color, fontWeight: 700, textTransform: "uppercase" }}>{activeSession.category} Session</span>

            <div style={{ position: "relative", width: "200px", height: "200px", margin: "32px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="100" cy="100" r="90" fill="none" stroke={activeSession.color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${progressPct * 5.65} 565`} transform="rotate(-90 100 100)" style={{ transition: "stroke-dasharray 1s linear" }} />
              </svg>
              <span style={{ position: "absolute", fontSize: "36px", fontWeight: 800, color: "#ffffff" }}>{formatTime(timerSeconds)}</span>
            </div>

            <MaterialCard variant="filled" style={{ width: "100%", maxWidth: "340px", marginBottom: "32px" }}>
              <p style={{ fontSize: "15px", fontWeight: 600, color: "#e8edf5", margin: 0 }}>{activeSession.steps[currentStepIdx % activeSession.steps.length]}</p>
            </MaterialCard>

            <div style={{ display: "flex", gap: "16px", width: "100%", maxWidth: "340px" }}>
              <Button fullWidth variant="outlined" onClick={() => setIsTimerRunning(!isTimerRunning)}>{isTimerRunning ? "Pause" : "Resume"}</Button>
              <Button fullWidth onClick={() => setCurrentStepIdx(i => (i + 1) % activeSession.steps.length)}>Next Step</Button>
            </div>
          </div>
        </div>
      )}
    </AndroidMobileLayout>
  );
}
