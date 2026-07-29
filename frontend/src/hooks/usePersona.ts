"use client";

import { useState, useEffect, useCallback } from "react";
import { Persona } from "@/types/persona";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const DEFAULT_PERSONAS: Persona[] = [
  {
    id: "cbt",
    name: "Sera",
    title: "CBT Therapist",
    avatar: "🌿",
    color: "#22c55e",
    description: "Structured cognitive behavioral therapy, thought reframing, and cognitive distortion identification.",
    prompt: "",
  },
  {
    id: "compassionate",
    name: "Luna",
    title: "Compassionate Listener",
    avatar: "💜",
    color: "#a855f7",
    description: "Deep emotional validation, warm empathy, safe non-judgmental space, and heart-felt active listening.",
    prompt: "",
  },
  {
    id: "motivational",
    name: "Axel",
    title: "Motivational Coach",
    avatar: "⚡",
    color: "#f59e0b",
    description: "High-energy inspiration, action planning, goal breakdown, momentum building, and positive accountability.",
    prompt: "",
  },
  {
    id: "mindfulness",
    name: "Zen",
    title: "Mindfulness Guide",
    avatar: "🧘",
    color: "#06b6d4",
    description: "Grounding exercises, present moment awareness, meditation techniques, and calm breathing guidance.",
    prompt: "",
  },
  {
    id: "stress",
    name: "Kai",
    title: "Stress & Burnout Coach",
    avatar: "🛡️",
    color: "#6366f1",
    description: "Burnout prevention, boundary setting, workload pacing, somatic relaxation, and stress mitigation.",
    prompt: "",
  },
  {
    id: "study",
    name: "Maya",
    title: "Study & Academic Coach",
    avatar: "🎓",
    color: "#10b981",
    description: "Exam anxiety relief, study focus techniques (Pomodoro), time management, and student mental balance.",
    prompt: "",
  },
];

export function usePersona(userId?: string) {
  const [personas, setPersonas] = useState<Persona[]>(DEFAULT_PERSONAS);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("cbt");
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPersonasAndPreference = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/personas`);
      if (res.ok) {
        const data = await res.json();
        if (data.personas && data.personas.length > 0) {
          setPersonas(data.personas);
        }
      }

      if (userId) {
        const prefRes = await fetch(`${API_URL}/users/${userId}/persona-preference`);
        if (prefRes.ok) {
          const prefData = await prefRes.json();
          if (prefData.persona_id) {
            setSelectedPersonaId(prefData.persona_id);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching personas:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPersonasAndPreference();
  }, [fetchPersonasAndPreference]);

  const selectPersona = async (personaId: string) => {
    setSelectedPersonaId(personaId);
    if (!userId) return;

    try {
      await fetch(`${API_URL}/users/${userId}/persona-preference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona_id: personaId }),
      });
    } catch (err) {
      console.error("Error updating persona preference:", err);
    }
  };

  const activePersona = personas.find((p) => p.id === selectedPersonaId) || DEFAULT_PERSONAS[0];

  return {
    personas,
    activePersona,
    selectedPersonaId,
    selectPersona,
    loading,
  };
}
