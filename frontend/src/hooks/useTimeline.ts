"use client";

import { useState, useCallback, useEffect } from "react";
import { TimelineItem } from "@/types/persona";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function useTimeline(userId?: string, category: string = "all", searchQuery: string = "") {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTimeline = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const url = new URL(`${API_URL}/timeline/${userId}`);
      if (category) url.searchParams.append("category", category);
      if (searchQuery) url.searchParams.append("search", searchQuery);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setTimeline(data.timeline || []);
      }
    } catch (err) {
      console.error("Error fetching timeline:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, category, searchQuery]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return {
    timeline,
    refetch: fetchTimeline,
    loading,
  };
}
