import { create } from "zustand";

export interface PersonaItem {
  id: string;
  name: string;
  avatar: string;
  description: string;
}

const DEFAULT_PERSONAS: PersonaItem[] = [
  { id: "sera-cbt", name: "Dr. MindMate", avatar: "🌿", description: "Empathetic CBT Guide" },
  { id: "marcus-mindful", name: "Marcus", avatar: "🧘", description: "Mindfulness & Breathing Coach" },
  { id: "elena-journal", name: "Elena", avatar: "📝", description: "Reflective Journaling Mentor" },
];

interface AIStoreState {
  activePersona: PersonaItem;
  personas: PersonaItem[];
  isGenerating: boolean;
  selectPersona: (id: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
}

export const useAIStore = create<AIStoreState>((set) => ({
  activePersona: DEFAULT_PERSONAS[0],
  personas: DEFAULT_PERSONAS,
  isGenerating: false,
  selectPersona: (id) =>
    set((state) => {
      const found = state.personas.find((p) => p.id === id);
      return found ? { activePersona: found } : state;
    }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
}));
