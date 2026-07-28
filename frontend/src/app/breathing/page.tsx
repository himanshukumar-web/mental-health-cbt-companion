"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface BreathingTechnique {
  id: string;
  name: string;
  desc: string;
  phases: { name: string; duration: number }[];
  color: string;
  icon: string;
}

const BREATHING_TECHNIQUES: BreathingTechnique[] = [
  {
    id: "box",
    name: "4-4-4-4 Box Breathing",
    desc: "Used by Navy SEALs to reduce stress instantly and sharpen focus under pressure.",
    icon: "📦",
    color: "#3b82f6",
    phases: [
      { name: "Inhale", duration: 4 },
      { name: "Hold", duration: 4 },
      { name: "Exhale", duration: 4 },
      { name: "Hold", duration: 4 },
    ],
  },
  {
    id: "478",
    name: "4-7-8 Breathing",
    desc: "Natural tranquilizer for the nervous system that helps soothe anxiety and prepare for sleep.",
    icon: "🌙",
    color: "#8b5cf6",
    phases: [
      { name: "Inhale", duration: 4 },
      { name: "Hold", duration: 7 },
      { name: "Exhale", duration: 8 },
    ],
  },
  {
    id: "deep",
    name: "5-5 Deep Coherence Breathing",
    desc: "Harmonizes heart rate variability (HRV) and restores emotional equilibrium.",
    icon: "🫁",
    color: "#22c55e",
    phases: [
      { name: "Inhale", duration: 5 },
      { name: "Exhale", duration: 5 },
    ],
  },
];

export default function BreathingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTech, setActiveTech] = useState<BreathingTechnique>(BREATHING_TECHNIQUES[0]);
  const [isActive, setIsActive] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [secondsInPhase, setSecondsInPhase] = useState(0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  // Breathing Cycle Engine
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSecondsInPhase((prevSec) => {
          const currentPhaseDuration = activeTech.phases[phaseIdx].duration;
          if (prevSec + 1 >= currentPhaseDuration) {
            // Move to next phase
            const nextIdx = (phaseIdx + 1) % activeTech.phases.length;
            setPhaseIdx(nextIdx);
            if (nextIdx === 0) {
              setCyclesCompleted((c) => c + 1);
            }
            return 0;
          }
          return prevSec + 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, phaseIdx, activeTech]);

  const toggleExercise = () => {
    if (isActive) {
      setIsActive(false);
    } else {
      setPhaseIdx(0);
      setSecondsInPhase(0);
      setCyclesCompleted(0);
      setIsActive(true);
    }
  };

  const handleFinish = async () => {
    setIsActive(false);
    if (!user || cyclesCompleted === 0) return;
    toast.success(`Completed ${cyclesCompleted} cycles of ${activeTech.name}! +100 XP Earned 🎉`);

    try {
      await fetch(`${API_URL}/meditation/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          category: "Breathing",
          title: activeTech.name,
          duration_minutes: Math.max(1, Math.round((cyclesCompleted * 15) / 60)),
        }),
      });
    } catch {
      /* ignore */
    }
  };

  if (authLoading)
    return (
      <>
        <Sidebar />
        <div style={{ marginLeft: 260 }}>
          <PageSkeleton />
        </div>
      </>
    );
  if (!user) return null;

  const currentPhase = activeTech.phases[phaseIdx];
  const isExpanding = currentPhase.name === "Inhale";
  const isContracting = currentPhase.name === "Exhale";

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
          maxWidth: 900,
          overflow: "auto",
        }}
      >
        <style>{`
          @media (max-width: 767px) { main { margin-left: 0 !important; padding: 16px !important; } }
          @keyframes expandCircle { from { transform: scale(1); } to { transform: scale(1.4); } }
          @keyframes contractCircle { from { transform: scale(1.4); } to { transform: scale(1); } }
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
            Guided Breathing Exercises 🫁
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Regulate your nervous system with evidence-based breathing patterns
          </p>
        </div>

        {/* Technique Selector Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {BREATHING_TECHNIQUES.map((tech) => (
            <button
              key={tech.id}
              onClick={() => {
                setIsActive(false);
                setActiveTech(tech);
              }}
              style={{
                padding: "20px",
                borderRadius: 16,
                background:
                  activeTech.id === tech.id
                    ? `${tech.color}15`
                    : "var(--bg-glass)",
                border:
                  activeTech.id === tech.id
                    ? `2px solid ${tech.color}`
                    : "0.5px solid var(--border-secondary)",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 24 }}>{tech.icon}</span>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {tech.name}
                </div>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                {tech.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Animated Breathing Circle Card */}
        <div
          style={{
            padding: "40px 24px",
            borderRadius: 24,
            background: "var(--bg-glass)",
            border: "0.5px solid var(--border-secondary)",
            textAlign: "center",
            maxWidth: 600,
            margin: "0 auto",
          }}
        >
          {/* Expanding / Contracting SVG Circle */}
          <div
            style={{
              position: "relative",
              width: 220,
              height: 220,
              margin: "0 auto 36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${activeTech.color}40 0%, ${activeTech.color}10 70%)`,
                border: `3px solid ${activeTech.color}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                transform: isActive
                  ? isExpanding
                    ? "scale(1.35)"
                    : isContracting
                    ? "scale(1)"
                    : "scale(1.35)"
                  : "scale(1)",
                transition: isActive
                  ? `transform ${currentPhase.duration}s cubic-bezier(0.4, 0, 0.2, 1)`
                  : "transform 0.5s ease",
                boxShadow: `0 0 40px ${activeTech.color}40`,
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "white",
                  marginBottom: 2,
                }}
              >
                {isActive ? currentPhase.name : "Ready"}
              </div>
              {isActive && (
                <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>
                  {currentPhase.duration - secondsInPhase}s
                </div>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 32,
              marginBottom: 32,
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                Cycles Done
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: activeTech.color,
                }}
              >
                {cyclesCompleted}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                Current Technique
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginTop: 4,
                }}
              >
                {activeTech.name}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <button
              onClick={toggleExercise}
              style={{
                padding: "14px 36px",
                borderRadius: 14,
                background: isActive
                  ? "rgba(239,68,68,0.15)"
                  : activeTech.color,
                border: isActive
                  ? "1px solid rgba(239,68,68,0.4)"
                  : "none",
                color: isActive ? "#fca5a5" : "white",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: isActive
                  ? "none"
                  : `0 4px 20px ${activeTech.color}40`,
              }}
            >
              {isActive ? "Pause ⏸" : "Start Exercise ▶"}
            </button>

            {cyclesCompleted > 0 && !isActive && (
              <button
                onClick={handleFinish}
                style={{
                  padding: "14px 24px",
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  border: "none",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Finish & Claim XP 🎉
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
