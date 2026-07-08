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

interface AuthContextValue {
  user: User | null;
  userRole: UserRole;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role?: "user" | "admin") => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  updateRole: (role: "user" | "admin") => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userRole: null,
  loading: true,
  signUp: async () => null,
  signIn: async () => null,
  signOut: async () => {},
  updateRole: async () => null,
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    // Initial session
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      setUserRole((u?.user_metadata?.role as UserRole) ?? null);
      setLoading(false);
    });

    // Auth state listener
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setUserRole((u?.user_metadata?.role as UserRole) ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, role: "user" | "admin" = "user"): Promise<string | null> => {
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    return error?.message ?? null;
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setUserRole(null);
  }, []);

  const updateRole = useCallback(async (role: "user" | "admin"): Promise<string | null> => {
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.updateUser({
      data: { role },
    });
    if (error) return error.message;
    setUserRole(role);
    return null;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, loading, signUp, signIn, signOut, updateRole }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useAuth = () => useContext(AuthContext);
