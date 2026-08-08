"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AndroidMobileLayout from "./AndroidMobileLayout";
import { TopAppBar, MaterialCard, Button } from "./ui";
import toast from "react-hot-toast";
import { API_URL } from "@/lib/config";

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
    desc: "Used by Navy SEALs to reduce stress instantly and sharpen focus.",
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
    desc: "Tranquilizer for the nervous system that helps soothe anxiety.",
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
    name: "5-5 Coherence",
    desc: "Harmonizes heart rate and restores emotional equilibrium.",
    icon: "🫁",
    color: "#22c55e",
    phases: [
      { name: "Inhale", duration: 5 },
      { name: "Exhale", duration: 5 },
    ],
  },
];

export default function AndroidBreathing() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeTech, setActiveTech] = useState<BreathingTechnique>(BREATHING_TECHNIQUES[0]);
  const [isActive, setIsActive] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [secondsInPhase, setSecondsInPhase] = useState(0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSecondsInPhase((prevSec) => {
          const currentPhaseDuration = activeTech.phases[phaseIdx].duration;
          if (prevSec + 1 >= currentPhaseDuration) {
            const nextIdx = (phaseIdx + 1) % activeTech.phases.length;
            setPhaseIdx(nextIdx);
            if (nextIdx === 0) setCyclesCompleted((c) => c + 1);
            return 0;
          }
          return prevSec + 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, phaseIdx, activeTech]);

  const toggleExercise = () => {
    if (!isActive) {
      setPhaseIdx(0);
      setSecondsInPhase(0);
      setCyclesCompleted(0);
    }
    setIsActive(!isActive);
  };

  const handleFinish = async () => {
    setIsActive(false);
    if (!user || cyclesCompleted === 0) return;
    toast.success(`Completed ${cyclesCompleted} cycles! +100 XP`);

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
    } catch { /* ignore */ }
  };

  const currentPhase = activeTech.phases[phaseIdx];
  const isExpanding = currentPhase.name === "Inhale";
  const isContracting = currentPhase.name === "Exhale";

  return (
    <AndroidMobileLayout hasBottomNav={true}>
      <TopAppBar title="Guided Breathing" subtitle="Regulate your nervous system" showBack={true} />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Technique Selector Horizontal Scroll */}
        <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px" }}>
          {BREATHING_TECHNIQUES.map((tech) => (
            <button
              key={tech.id}
              onClick={() => { setIsActive(false); setActiveTech(tech); }}
              style={{
                flexShrink: 0,
                padding: "10px 16px",
                borderRadius: "14px",
                border: activeTech.id === tech.id ? `2px solid ${tech.color}` : "1px solid rgba(255,255,255,0.1)",
                background: activeTech.id === tech.id ? `${tech.color}15` : "rgba(255,255,255,0.04)",
                color: activeTech.id === tech.id ? "#ffffff" : "#8b95a7",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {tech.icon} {tech.name}
            </button>
          ))}
        </div>

        {/* Breathing Animation Card */}
        <MaterialCard
          variant="elevated"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "40px 20px",
            background: "linear-gradient(180deg, rgba(17, 24, 39, 0.4) 0%, rgba(11, 15, 26, 0.8) 100%)",
          }}
        >
          <div
            style={{
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              border: `4px solid ${activeTech.color}`,
              background: `radial-gradient(circle, ${activeTech.color}30 0%, transparent 70%)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "32px",
              transform: isActive ? (isExpanding ? "scale(1.25)" : isContracting ? "scale(0.85)" : "scale(1.25)") : "scale(1)",
              transition: isActive ? `transform ${currentPhase.duration}s cubic-bezier(0.4, 0, 0.2, 1)` : "transform 0.5s ease",
              boxShadow: `0 0 30px ${activeTech.color}30`,
            }}
          >
            <span style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff" }}>
              {isActive ? currentPhase.name : "Ready"}
            </span>
            {isActive && (
              <span style={{ fontSize: "24px", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                {currentPhase.duration - secondsInPhase}s
              </span>
            )}
          </div>

          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#e8edf5", margin: "0 0 4px 0" }}>
              {activeTech.name}
            </h3>
            <p style={{ fontSize: "13px", color: "#8b95a7", margin: 0 }}>
              Cycles Completed: <strong style={{ color: activeTech.color }}>{cyclesCompleted}</strong>
            </p>
          </div>

          <div style={{ display: "flex", width: "100%", gap: "12px" }}>
            <Button
              fullWidth
              variant={isActive ? "outlined" : "filled"}
              onClick={toggleExercise}
              style={{
                height: "52px",
                borderRadius: "16px",
                borderColor: isActive ? "rgba(239, 68, 68, 0.4)" : "transparent",
                color: isActive ? "#fca5a5" : "#ffffff",
                background: isActive ? "rgba(239, 68, 68, 0.1)" : activeTech.color,
              }}
            >
              {isActive ? "Pause Exercise ⏸" : "Start Exercise ▶"}
            </Button>

            {cyclesCompleted > 0 && !isActive && (
              <Button
                fullWidth
                onClick={handleFinish}
                style={{ height: "52px", borderRadius: "16px", background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
              >
                Finish & Save 🎉
              </Button>
            )}
          </div>
        </MaterialCard>

        <MaterialCard variant="filled">
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#e8edf5", marginBottom: "6px" }}>Benefits</h4>
          <p style={{ fontSize: "13px", color: "#8b95a7", margin: 0, lineHeight: 1.5 }}>
            {activeTech.desc} Regular practice can lower cortisol levels and improve heart rate variability (HRV).
          </p>
        </MaterialCard>
      </div>
    </AndroidMobileLayout>
  );
}
