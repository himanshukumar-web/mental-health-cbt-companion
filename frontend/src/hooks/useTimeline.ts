"use client";

import { useState, useCallback, useEffect } from "react";
import { TimelineItem } from "@/types/persona";
import { getApiUrl } from "@/lib/config";

const API_URL = getApiUrl();

export function useTimeline(userId?: string, category: string = "all", searchQuery: string = "") {
  const cacheKey = userId ? `sera_timeline_${userId}_${category}` : null;
  const [timeline, setTimeline] = useState<TimelineItem[]>(() => {
    if (typeof window !== "undefined" && cacheKey && !searchQuery) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch {
        /* ignore */
      }
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined" && cacheKey && !searchQuery) {
      try {
        if (localStorage.getItem(cacheKey)) return false;
      } catch {
        /* ignore */
      }
    }
    return true;
  });

  const fetchTimeline = useCallback(async () => {
    if (!userId) return;
    try {
      const url = new URL(`${API_URL}/timeline/${userId}`);
      if (category) url.searchParams.append("category", category);
      if (searchQuery) url.searchParams.append("search", searchQuery);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        const items = data.timeline || [];
        setTimeline(items);
        if (cacheKey && !searchQuery) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(items));
          } catch {
            /* ignore */
          }
        }
      }
    } catch (err) {
      console.error("Error fetching timeline:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, category, searchQuery, cacheKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTimeline();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchTimeline]);

  return {
    timeline,
    refetch: fetchTimeline,
    loading,
  };
}
