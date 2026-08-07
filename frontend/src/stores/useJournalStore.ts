import { create } from "zustand";

export interface JournalEntryState {
  id?: string;
  title: string;
  content: string;
  created_at?: string;
}

interface JournalStoreState {
  entries: JournalEntryState[];
  searchQuery: string;
  loading: boolean;
  setEntries: (entries: JournalEntryState[]) => void;
  addEntry: (entry: JournalEntryState) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useJournalStore = create<JournalStoreState>((set) => ({
  entries: [],
  searchQuery: "",
  loading: true,
  setEntries: (entries) => set({ entries, loading: false }),
  addEntry: (entry) => set((state) => ({ entries: [entry, ...state.entries] })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setLoading: (loading) => set({ loading }),
}));
