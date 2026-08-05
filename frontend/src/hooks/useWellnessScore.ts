"use client";

import { useState, useCallback, useEffect } from "react";
import { WellnessScore } from "@/types/persona";
import { getApiUrl } from "@/lib/config";

const API_URL = getApiUrl();

export function useWellnessScore(userId?: string) {
  const [currentScore, setCurrentScore] = useState<WellnessScore | null>(null);
  const [history, setHistory] = useState<WellnessScore[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchWellnessScore = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/wellness-score/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentScore(data.current);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Error fetching wellness score:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWellnessScore();
  }, [fetchWellnessScore]);

  return {
    currentScore,
    history,
    refetch: fetchWellnessScore,
    loading,
  };
}
