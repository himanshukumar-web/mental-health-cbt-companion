"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/config";

const gamificationCache = new Map<string, { xp: number; level: number }>();

export function useMobileGamification(userId?: string) {
  const cacheKey = userId || "guest";
  const cached = gamificationCache.get(cacheKey);

  const [xp, setXp] = useState<number>(() => cached?.xp ?? 350);
  const [level, setLevel] = useState<number>(() => cached?.level ?? 3);
  const [loading, setLoading] = useState<boolean>(() => !cached && Boolean(userId));

  const fetchGamification = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    if (!gamificationCache.has(cacheKey)) {
      setLoading(true);
    }
    try {
      const res = await fetch(`${API_URL}/gamification/xp/${userId}`);
      if (res.ok) {
        const json = await res.json();
        let newXp = 350;
        let newLevel = 3;
        if (json.xp && typeof json.xp === "object") {
          newXp = Number(json.xp.total_xp ?? json.xp.xp ?? 350);
          newLevel = Number(json.xp.level ?? 3);
        } else if (typeof json.xp === "number") {
          newXp = json.xp;
          newLevel = Number(json.level ?? 3);
        } else if (typeof json.total_xp === "number") {
          newXp = json.total_xp;
          newLevel = Number(json.level ?? 3);
        }
        setXp(newXp);
        setLevel(newLevel);
        gamificationCache.set(cacheKey, { xp: newXp, level: newLevel });
      }
    } catch (err) {
      console.error("Error fetching gamification XP:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, cacheKey]);

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
