import { create } from "zustand";

export interface MoodEntryState {
  id?: string;
  mood_score: number;
  mood_emoji: string;
  stress_level?: number | null;
  sleep_hours?: number | null;
  notes?: string;
  created_at?: string;
}

interface MoodStoreState {
  moodEntries: MoodEntryState[];
  latestMood: MoodEntryState | null;
  loading: boolean;
  setMoodEntries: (entries: MoodEntryState[]) => void;
  addMoodEntry: (entry: MoodEntryState) => void;
  setLoading: (loading: boolean) => void;
}

export const useMoodStore = create<MoodStoreState>((set) => ({
  moodEntries: [],
  latestMood: null,
  loading: true,
  setMoodEntries: (moodEntries) =>
    set({
      moodEntries,
      latestMood: moodEntries[0] || null,
      loading: false,
    }),
  addMoodEntry: (entry) =>
    set((state) => ({
      moodEntries: [entry, ...state.moodEntries],
      latestMood: entry,
    })),
  setLoading: (loading) => set({ loading }),
}));
