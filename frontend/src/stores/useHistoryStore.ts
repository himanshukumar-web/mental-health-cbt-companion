import { create } from "zustand";

export interface TimelineItem {
  id: string;
  category: "mood" | "journal" | "cbt" | "meditation";
  title: string;
  description: string;
  timestamp: string;
  emoji?: string;
}

interface HistoryStoreState {
  timelineEvents: TimelineItem[];
  filterCategory: string;
  loading: boolean;
  setTimelineEvents: (events: TimelineItem[]) => void;
  setFilterCategory: (category: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useHistoryStore = create<HistoryStoreState>((set) => ({
  timelineEvents: [],
  filterCategory: "all",
  loading: true,
  setTimelineEvents: (timelineEvents) => set({ timelineEvents, loading: false }),
  setFilterCategory: (filterCategory) => set({ filterCategory }),
  setLoading: (loading) => set({ loading }),
}));
