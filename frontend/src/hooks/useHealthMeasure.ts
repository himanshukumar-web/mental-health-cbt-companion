"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { getApiUrl } from "@/lib/config";

const API_URL = getApiUrl();

/* ── Date helpers (local timezone) ──────────────────────────────────────── */

/** Returns today's date as YYYY-MM-DD in the user's local timezone */
function getLocalToday(): string {
  return new Date().toLocaleDateString("en-CA"); // always YYYY-MM-DD
}

/** Returns the Monday-to-Sunday range for the current week in local time */
function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun … 6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toLocaleDateString("en-CA"),
    end: sunday.toLocaleDateString("en-CA"),
  };
}

/* ── Daily check-in questions (rotated by day-of-year) ──────────────────── */

const DAILY_DIMENSIONS = [
  {
    id: "mood",
    label: "Mood & Emotional State",
    icon: "😊",
    question: "How would you rate your overall mood today?",
    color: "#22c55e",
  },
  {
    id: "sleep",
    label: "Sleep Quality",
    icon: "🌙",
    question: "How well did you sleep last night?",
    color: "#06b6d4",
  },
  {
    id: "stress",
    label: "Stress & Anxiety Level",
    icon: "😤",
    question: "How is your stress/anxiety level today?",
    color: "#a855f7",
  },
  {
    id: "energy",
    label: "Energy & Motivation",
    icon: "⚡",
    question: "How is your energy level today?",
    color: "#f59e0b",
  },
  {
    id: "mindfulness",
    label: "Mindfulness & Calm",
    icon: "🧘",
    question: "How mindful/present have you felt today?",
    color: "#10b981",
  },
  {
    id: "social",
    label: "Social Connection",
    icon: "🤝",
    question: "How connected did you feel with others today?",
    color: "#ec4899",
  },
  {
    id: "gratitude",
    label: "Gratitude & Positivity",
    icon: "🙏",
    question: "How grateful/positive do you feel right now?",
    color: "#3b82f6",
  },
];

function getDailyDimension(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return DAILY_DIMENSIONS[dayOfYear % DAILY_DIMENSIONS.length];
}

/* ── Interfaces ─────────────────────────────────────────────────────────── */

export interface DailyCheckIn {
  date: string;
  dimension: typeof DAILY_DIMENSIONS[number];
  rating: number | null; // 1-5 user rating
  completed: boolean;
  completedAt: string | null;
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  daysCompleted: number;
  totalDays: number;
  averageScore: number | null;
  scores: { date: string; score: number }[];
  trend: "improving" | "stable" | "declining" | "insufficient";
}

/* ── Local storage helpers ──────────────────────────────────────────────── */

function getStorageKey(userId: string, date: string) {
  return `healthMeasure_${userId}_${date}`;
}

function loadDailyFromStorage(userId: string, date: string): DailyCheckIn | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKey(userId, date));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveDailyToStorage(userId: string, checkIn: DailyCheckIn) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(userId, checkIn.date), JSON.stringify(checkIn));
  } catch { /* ignore */ }
}

/* ── Hook ───────────────────────────────────────────────────────────────── */

export function useHealthMeasure(userId?: string) {
  const today = getLocalToday();
  const dimension = getDailyDimension(today);

  const [dailyCheckIn, setDailyCheckIn] = useState<DailyCheckIn>(() => {
    if (!userId) {
      return { date: today, dimension, rating: null, completed: false, completedAt: null };
    }
    const cached = loadDailyFromStorage(userId, today);
    if (cached) return cached;
    return { date: today, dimension, rating: null, completed: false, completedAt: null };
  });

  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  /* ── Load weekly summary from wellness score history ──────────────── */
  const fetchWeeklySummary = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_URL}/wellness-score/${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      const history: { total_score: number; created_at: string }[] = data.history || [];

      const { start, end } = getCurrentWeekRange();

      // Filter scores that fall within this week (using local date of created_at)
      const weekScores: { date: string; score: number }[] = [];
      const seenDates = new Set<string>();

      for (const entry of history) {
        const entryDate = new Date(entry.created_at).toLocaleDateString("en-CA");
        if (entryDate >= start && entryDate <= end && !seenDates.has(entryDate)) {
          seenDates.add(entryDate);
          weekScores.push({ date: entryDate, score: entry.total_score });
        }
      }

      weekScores.sort((a, b) => a.date.localeCompare(b.date));

      const daysCompleted = weekScores.length;
      const averageScore = daysCompleted > 0
        ? Math.round(weekScores.reduce((sum, s) => sum + s.score, 0) / daysCompleted)
        : null;

      // Determine trend
      let trend: WeeklySummary["trend"] = "insufficient";
      if (weekScores.length >= 3) {
        const firstHalf = weekScores.slice(0, Math.floor(weekScores.length / 2));
        const secondHalf = weekScores.slice(Math.floor(weekScores.length / 2));
        const avgFirst = firstHalf.reduce((s, e) => s + e.score, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((s, e) => s + e.score, 0) / secondHalf.length;
        const delta = avgSecond - avgFirst;
        if (delta > 3) trend = "improving";
        else if (delta < -3) trend = "declining";
        else trend = "stable";
      }

      // Calculate totalDays: how many days from week start through today (max 7)
      const todayDate = getLocalToday();
      const endDate = todayDate < end ? todayDate : end;
      const daysDiff = Math.floor(
        (new Date(endDate + "T12:00:00").getTime() - new Date(start + "T12:00:00").getTime()) /
        (1000 * 60 * 60 * 24)
      ) + 1;

      setWeeklySummary({
        weekStart: start,
        weekEnd: end,
        daysCompleted,
        totalDays: Math.min(daysDiff, 7),
        averageScore,
        scores: weekScores,
        trend,
      });
    } catch (err) {
      console.error("Error fetching weekly summary:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchWeeklySummary();
  }, [fetchWeeklySummary]);

  /* ── Also sync dailyCheckIn from localStorage if userId changes ──── */
  useEffect(() => {
    if (!userId) return;
    const cached = loadDailyFromStorage(userId, today);
    if (cached) {
      setDailyCheckIn(cached);
    } else {
      setDailyCheckIn({ date: today, dimension, rating: null, completed: false, completedAt: null });
    }
  }, [userId, today, dimension]);

  /* ── Complete today's check-in ────────────────────────────────────── */
  const completeDailyCheckIn = useCallback(async (rating: number) => {
    if (!userId) return;

    const updated: DailyCheckIn = {
      date: today,
      dimension,
      rating,
      completed: true,
      completedAt: new Date().toISOString(),
    };
    setDailyCheckIn(updated);
    saveDailyToStorage(userId, updated);

    // Trigger wellness score recalculation (existing API saves a new score record)
    try {
      await fetch(`${API_URL}/wellness-score/${userId}`);
    } catch { /* ignore */ }

    // Refresh weekly summary
    fetchedRef.current = false;
    await fetchWeeklySummary();
  }, [userId, today, dimension, fetchWeeklySummary]);

  return {
    dailyCheckIn,
    weeklySummary,
    completeDailyCheckIn,
    loading,
    todaysDimension: dimension,
    refetch: fetchWeeklySummary,
  };
}
