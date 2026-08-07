import { create } from "zustand";

export interface UserProfileData {
  id?: string;
  display_name?: string;
  email?: string;
  role?: "user" | "admin";
  avatar_url?: string;
  wellness_goals?: string;
}

interface ProfileStoreState {
  profile: UserProfileData | null;
  userRole: "user" | "admin";
  loading: boolean;
  setProfile: (profile: UserProfileData | null) => void;
  setUserRole: (role: "user" | "admin") => void;
  setLoading: (loading: boolean) => void;
}

export const useProfileStore = create<ProfileStoreState>((set) => ({
  profile: null,
  userRole: "user",
  loading: true,
  setProfile: (profile) =>
    set({
      profile,
      userRole: profile?.role || "user",
      loading: false,
    }),
  setUserRole: (userRole) => set({ userRole }),
  setLoading: (loading) => set({ loading }),
}));
