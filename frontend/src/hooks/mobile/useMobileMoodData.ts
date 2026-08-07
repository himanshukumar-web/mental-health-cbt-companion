"use client";

import { useEffect, useCallback } from "react";
import { useMoodStore } from "@/stores/useMoodStore";
import { API_URL } from "@/lib/config";
import toast from "react-hot-toast";

export function useMobileMoodData(userId?: string) {
  const { moodEntries, latestMood, loading, setMoodEntries, addMoodEntry, setLoading } = useMoodStore();

  const fetchMoodEntries = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/mood-entries/${userId}`);
      if (res.ok) {
        const json = await res.json();
        setMoodEntries(json.mood_entries || json || []);
      }
    } catch (err) {
      console.error("Error fetching mood entries:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, setMoodEntries, setLoading]);

  useEffect(() => {
    fetchMoodEntries();
  }, [fetchMoodEntries]);

  const addMood = async (entry: {
    mood_score: number;
    mood_emoji: string;
    stress_level?: number;
    sleep_hours?: number;
    notes?: string;
  }) => {
    if (!userId) return false;
    try {
      const res = await fetch(`${API_URL}/mood-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          ...entry,
        }),
      });
      if (res.ok) {
        toast.success("Mood check-in saved! 🎉");
        addMoodEntry(entry);
        fetchMoodEntries();
        return true;
      } else {
        toast.error("Failed to save mood.");
        return false;
      }
    } catch (err) {
      toast.error("Network error saving mood.");
      return false;
    }
  };

  return {
    moodEntries,
    latestMood,
    loading,
    refetch: fetchMoodEntries,
    addMoodEntry: addMood,
  };
}
