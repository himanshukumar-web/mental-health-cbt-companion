"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

// ── Supabase singleton ────────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = "user" | "admin" | null;
export type AppTheme = "default" | "light" | "dark";

interface AuthContextValue {
  user: User | null;
  userRole: UserRole;
  loading: boolean;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  signUp: (email: string, password: string, fullName: string, role?: "user" | "admin") => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  updateRole: (role: "user" | "admin") => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userRole: null,
  loading: true,
  theme: "default",
  setTheme: () => {},
  signUp: async () => null,
  signIn: async () => null,
  signOut: async () => {},
  updateRole: async () => null,
  signInWithGoogle: async () => null,
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("sera_auth_user");
        if (cached) return JSON.parse(cached);
      } catch {
        /* ignore */
      }
    }
    return null;
  });
  const [userRole, setUserRole] = useState<UserRole>(() => {
    if (typeof window !== "undefined") {
      try {
        const role = localStorage.getItem("sera_auth_role") as UserRole;
        if (role) return role;
      } catch {
        /* ignore */
      }
    }
    return null;
  });
  // Never make route decisions from a cached profile. Supabase persists the
  // actual session in its own storage; wait for that session to initialize.
  const [loading, setLoading] = useState(() => Boolean(supabase));
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window !== "undefined") {
      try {
        return (localStorage.getItem("app-theme") as AppTheme) || "default";
      } catch {
        /* ignore */
      }
    }
    return "default";
  });

  const applyTheme = (t: AppTheme) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.remove("light-theme", "dark-theme");
      if (t === "light") root.classList.add("light-theme");
      if (t === "dark") root.classList.add("dark-theme");
    }
  };

  // Load and apply theme
  useEffect(() => {
    const savedTheme = (localStorage.getItem("app-theme") as AppTheme) || "default";
    const timer = setTimeout(() => {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("app-theme", newTheme);
    // Enable transitions only during user-triggered theme switch
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("theme-transitioning");
    }
    applyTheme(newTheme);
    // Remove after transition completes
    setTimeout(() => {
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("theme-transitioning");
      }
    }, 300);
  };

  useEffect(() => {
    if (!supabase) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }

    // Initial session
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      if (u) {
        setUser(u);
        const r = (u?.user_metadata?.role as UserRole) ?? "user";
        setUserRole(r);
        try {
          localStorage.setItem("sera_auth_user", JSON.stringify(u));
          localStorage.setItem("sera_auth_role", r);
        } catch {
          /* ignore */
        }
      } else {
        setUser(null);
        setUserRole(null);
        try {
          localStorage.removeItem("sera_auth_user");
          localStorage.removeItem("sera_auth_role");
        } catch {
          /* ignore */
        }
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // Auth state listener
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      const r = (u?.user_metadata?.role as UserRole) ?? null;
      setUserRole(r);
      if (u) {
        try {
          localStorage.setItem("sera_auth_user", JSON.stringify(u));
          if (r) localStorage.setItem("sera_auth_role", r);
        } catch {
          /* ignore */
        }
      } else {
        try {
          localStorage.removeItem("sera_auth_user");
          localStorage.removeItem("sera_auth_role");
        } catch {
          /* ignore */
        }
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, role: "user" | "admin" = "user"): Promise<string | null> => {
    if (!supabase) return "Supabase is not configured.";
    
    // Dynamic redirect URL based on current host (supports both localhost and Vercel)
    const emailRedirectTo = typeof window !== "undefined"
      ? `${window.location.origin}/role-select`
      : undefined;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo,
      },
    });
    if (data.user) {
      setUser(data.user);
      setUserRole(role);
      try {
        localStorage.setItem("sera_auth_user", JSON.stringify(data.user));
        localStorage.setItem("sera_auth_role", role);
      } catch {
        /* ignore */
      }
    }
    return error?.message ?? null;
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!supabase) return "Supabase is not configured.";
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data?.user) {
      setUser(data.user);
      const r = (data.user?.user_metadata?.role as UserRole) ?? "user";
      setUserRole(r);
      try {
        localStorage.setItem("sera_auth_user", JSON.stringify(data.user));
        localStorage.setItem("sera_auth_role", r);
      } catch {
        /* ignore */
      }
    }
    return error?.message ?? null;
  }, []);

  const signOut = useCallback(async () => {
    try {
      localStorage.removeItem("sera_auth_user");
      localStorage.removeItem("sera_auth_role");
    } catch {
      /* ignore */
    }
    setUser(null);
    setUserRole(null);
    await supabase?.auth.signOut();
  }, []);

  const updateRole = useCallback(async (role: "user" | "admin"): Promise<string | null> => {
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.updateUser({
      data: { role },
    });
    if (error) return error.message;
    setUserRole(role);
    try {
      localStorage.setItem("sera_auth_role", role);
    } catch {
      /* ignore */
    }
    return null;
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<string | null> => {
    if (!supabase) return "Supabase is not configured.";
    const redirectTo = typeof window !== "undefined"
      ? `${window.location.origin}/role-select`
      : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    return error?.message ?? null;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, loading, theme, setTheme, signUp, signIn, signOut, updateRole, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useAuth = () => useContext(AuthContext);
