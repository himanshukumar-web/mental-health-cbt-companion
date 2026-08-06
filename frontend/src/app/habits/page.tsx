"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface HabitDef { id: string; name: string; icon: string; color: string; }
interface HabitCompletion { habit_definition_id: string; date: string; }
interface Streaks { [habitId: string]: { current: number; longest: number } }

export default function HabitsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [habits, setHabits] = useState<HabitDef[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [streaks, setStreaks] = useState<Streaks>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/habits/${user.id}/progress`);
      if (res.ok) {
        const data = await res.json();
        setHabits(data.definitions || []);
        setCompletions(data.completions || []);
        setStreaks(data.streaks || {});
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const today = new Date().toISOString().split("T")[0];

  const isCompleted = (habitId: string, date: string) =>
    completions.some(c => c.habit_definition_id === habitId && c.date === date);

  const toggleHabit = async (habitId: string) => {
    if (!user) return;
    const completed = !isCompleted(habitId, today);
    // Optimistic update
    if (completed) {
      setCompletions(prev => [...prev, { habit_definition_id: habitId, date: today }]);
    } else {
      setCompletions(prev => prev.filter(c => !(c.habit_definition_id === habitId && c.date === today)));
    }
    try {
      await fetch(`${API_URL}/habits/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, habit_definition_id: habitId, date: today, completed }),
      });
      if (completed) toast.success("Habit completed! 🎉", { duration: 2000 });
      fetchData();
    } catch {
      fetchData(); // Revert on error
    }
  };

  const todayCompleted = habits.filter(h => isCompleted(h.id, today)).length;
  const todayTotal = habits.length;
  const completionPct = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  // Last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  if (authLoading || loading) return <><Sidebar /><div className="app-main-layout"><PageSkeleton /></div></>;
  if (!user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Sidebar />
      <main className="app-main-layout" style={{ padding: "24px 20px", maxWidth: 900, overflow: "auto" }}>
        <MobileHeader title="Daily Habits" />
        <style>{`
          @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
          @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
          @keyframes checkmark { from { transform: scale(0); } to { transform: scale(1); } }
        `}</style>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
            Daily Habits ✅
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Build healthy habits one day at a time
          </p>
        </div>

        {/* Progress Ring */}
        <div style={{
          padding: "24px", borderRadius: 20,
          background: "var(--bg-glass)", border: "0.5px solid var(--border-secondary)",
          marginBottom: 24, display: "flex", alignItems: "center", gap: 24,
          flexWrap: "wrap",
        }}>
          <div style={{ position: "relative", width: 80, height: 80 }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--bg-tertiary)" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke="#22c55e" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${completionPct * 2.136} 213.6`}
                transform="rotate(-90 40 40)"
                style={{ transition: "stroke-dasharray 0.5s ease" }}
              />
            </svg>
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 18, color: "var(--text-primary)",
            }}>
              {completionPct}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              Today&apos;s Progress
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
              {todayCompleted} of {todayTotal} habits completed
            </div>
          </div>
        </div>

        {/* Today&apos;s Habits */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            Today&apos;s Habits
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {habits.map((habit, i) => {
              const done = isCompleted(habit.id, today);
              const streak = streaks[habit.id];
              return (
                <button
                  key={habit.id}
                  onClick={() => toggleHabit(habit.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "16px 20px", borderRadius: 14,
                    background: done ? `${habit.color}10` : "var(--bg-glass)",
                    border: done ? `1px solid ${habit.color}30` : "0.5px solid var(--border-secondary)",
                    cursor: "pointer", transition: "all 0.2s",
                    animation: `popIn 0.3s ease ${i * 0.06}s both`,
                    textAlign: "left",
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: done ? habit.color : `${habit.color}15`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: done ? 16 : 18, transition: "all 0.3s",
                    color: done ? "white" : "inherit",
                  }}>
                    {done ? "✓" : habit.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600,
                      color: done ? habit.color : "var(--text-primary)",
                      textDecoration: done ? "line-through" : "none",
                    }}>
                      {habit.name}
                    </div>
                    {streak && streak.current > 0 && (
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
                        🔥 {streak.current} day streak
                      </div>
                    )}
                  </div>
                  {streak && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Best</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: habit.color }}>{streak.longest}</div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Weekly View */}
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            This Week
          </h2>
          <div style={{
            overflowX: "auto", padding: "4px 0",
          }}>
            <table style={{
              width: "100%", borderCollapse: "collapse",
              background: "var(--bg-glass)", borderRadius: 14,
              border: "0.5px solid var(--border-secondary)", overflow: "hidden",
            }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px 14px", fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textAlign: "left", borderBottom: "0.5px solid var(--border-secondary)" }}>Habit</th>
                  {last7Days.map(d => (
                    <th key={d} style={{
                      padding: "12px 8px", fontSize: 11, fontWeight: 500,
                      color: d === today ? "#22c55e" : "var(--text-tertiary)",
                      textAlign: "center", borderBottom: "0.5px solid var(--border-secondary)",
                      minWidth: 44,
                    }}>
                      {new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habits.map(habit => (
                  <tr key={habit.id}>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--text-primary)", borderBottom: "0.5px solid var(--border-secondary)" }}>
                      {habit.icon} {habit.name}
                    </td>
                    {last7Days.map(d => {
                      const done = isCompleted(habit.id, d);
                      return (
                        <td key={d} style={{ textAlign: "center", padding: "10px 8px", borderBottom: "0.5px solid var(--border-secondary)" }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: 6,
                            background: done ? habit.color : "var(--bg-tertiary)",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, color: done ? "white" : "transparent",
                            transition: "all 0.2s",
                          }}>
                            ✓
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
