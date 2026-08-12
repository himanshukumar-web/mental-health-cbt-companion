"use client";

import { useState, useCallback, useEffect } from "react";
import { WellnessScore } from "@/types/persona";
import { getApiUrl } from "@/lib/config";

const API_URL = getApiUrl();

export function useWellnessScore(userId?: string) {
  const [currentScore, setCurrentScore] = useState<WellnessScore | null>(() => {
    if (typeof window !== "undefined" && userId) {
      try {
        const cached = localStorage.getItem(`sera_score_${userId}`);
        if (cached) return JSON.parse(cached);
      } catch {
        /* ignore */
      }
    }
    return null;
  });
  const [history, setHistory] = useState<WellnessScore[]>([]);
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined" && userId) {
      try {
        if (localStorage.getItem(`sera_score_${userId}`)) return false;
      } catch {
        /* ignore */
      }
    }
    return true;
  });

  const fetchWellnessScore = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_URL}/wellness-score/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentScore(data.current);
        setHistory(data.history || []);
        try {
          localStorage.setItem(`sera_score_${userId}`, JSON.stringify(data.current));
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      console.error("Error fetching wellness score:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWellnessScore();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchWellnessScore]);

  return {
    currentScore,
    history,
    refetch: fetchWellnessScore,
    loading,
  };
}
