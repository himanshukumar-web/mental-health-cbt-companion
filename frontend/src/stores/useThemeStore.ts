import { create } from "zustand";

interface ThemeStoreState {
  theme: "dark" | "light";
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  setTheme: (theme: "dark" | "light") => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const useThemeStore = create<ThemeStoreState>((set) => ({
  theme: "dark",
  hapticsEnabled: true,
  notificationsEnabled: true,
  setTheme: (theme) => set({ theme }),
  setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
}));
