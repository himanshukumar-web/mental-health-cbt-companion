import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

interface AuthStoreState {
  user: User | null;
  userRole: "user" | "admin" | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setUserRole: (role: "user" | "admin" | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  userRole: null,
  loading: true,
  setUser: (user) => set({ user }),
  setUserRole: (userRole) => set({ userRole }),
  setLoading: (loading) => set({ loading }),
  clearAuth: () => set({ user: null, userRole: null, loading: false }),
}));
