"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/config";

export function useMobileGamification(userId?: string) {
  const [xp, setXp] = useState<number>(350);
  const [level, setLevel] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchGamification = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/gamification/xp/${userId}`);
      if (res.ok) {
        const json = await res.json();
        setXp(json.xp || 350);
        setLevel(json.level || 3);
      }
    } catch (err) {
      console.error("Error fetching gamification XP:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchGamification();
  }, [fetchGamification]);

  const nextLevelXp = level * 200;
  const progressPercent = Math.min(100, Math.round((xp / nextLevelXp) * 100));

  return {
    xp,
    level,
    nextLevelXp,
    progressPercent,
    loading,
    refetch: fetchGamification,
  };
}
