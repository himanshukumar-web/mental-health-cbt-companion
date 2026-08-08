"use client";

import { useState, useEffect, useCallback } from "react";
import { Persona } from "@/types/persona";
import { getApiUrl } from "@/lib/config";

const API_URL = getApiUrl();

const DEFAULT_PERSONAS: Persona[] = [
  {
    id: "cbt",
    name: "MindMate",
    title: "CBT Therapist",
    avatar: "🌿",
    color: "#22c55e",
    description: "Structured cognitive behavioral therapy, thought reframing, and cognitive distortion identification.",
    prompt: "",
    greeting: "Hi, I'm MindMate — your CBT companion. 🌿 This is a safe space to talk through whatever's on your mind. I use evidence-based CBT techniques to help you reframe unhelpful thoughts. How are you feeling today?",
  },
  {
    id: "compassionate",
    name: "Luna",
    title: "Compassionate Listener",
    avatar: "💜",
    color: "#a855f7",
    description: "Deep emotional validation, warm empathy, safe non-judgmental space, and heart-felt active listening.",
    prompt: "",
    greeting: "Hi, I'm Luna — your compassionate listener. 💜 I'm here to listen to you with open arms and deep empathy, without any judgment. Whatever is in your heart today, I'm right here to hear you.",
  },
  {
    id: "motivational",
    name: "Axel",
    title: "Motivational Coach",
    avatar: "⚡",
    color: "#f59e0b",
    description: "High-energy inspiration, action planning, goal breakdown, momentum building, and positive accountability.",
    prompt: "",
    greeting: "Hey there! I'm Axel — your motivational coach! ⚡ Ready to turn challenges into momentum? Tell me what goal or hurdle you're facing today, and let's tackle it together!",
  },
  {
    id: "mindfulness",
    name: "Zen",
    title: "Mindfulness Guide",
    avatar: "🧘",
    color: "#06b6d4",
    description: "Grounding exercises, present moment awareness, meditation techniques, and calm breathing guidance.",
    prompt: "",
    greeting: "Welcome. I'm Zen — your peaceful mindfulness guide. 🧘 Take a deep breath in... and release. I am here to help you find calm, ground yourself in the present moment, and restore your inner peace.",
  },
  {
    id: "stress",
    name: "Kai",
    title: "Stress & Burnout Coach",
    avatar: "🛡️",
    color: "#6366f1",
    description: "Burnout prevention, boundary setting, workload pacing, somatic relaxation, and stress mitigation.",
    prompt: "",
    greeting: "Hello, I'm Kai — your stress & burnout coach. 🛡️ If you're feeling overwhelmed, exhausted, or stretched thin, let's protect your energy and create manageable steps for peace of mind.",
  },
  {
    id: "study",
    name: "Maya",
    title: "Study & Academic Coach",
    avatar: "🎓",
    color: "#10b981",
    description: "Exam anxiety relief, study focus techniques (Pomodoro), time management, and student mental balance.",
    prompt: "",
    greeting: "Hi! I'm Maya — your study & academic wellness coach. 🎓 Facing exam stress, homework overload, or focus troubles? Let's break down your tasks and make study sessions stress-free!",
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
    const timer = setTimeout(() => {
      fetchPersonasAndPreference();
    }, 0);
    return () => clearTimeout(timer);
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
