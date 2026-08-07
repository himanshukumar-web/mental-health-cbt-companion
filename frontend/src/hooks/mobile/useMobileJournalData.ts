"use client";

import { useEffect, useCallback } from "react";
import { useJournalStore } from "@/stores/useJournalStore";
import { API_URL } from "@/lib/config";
import toast from "react-hot-toast";

export function useMobileJournalData(userId?: string) {
  const { entries, searchQuery, loading, setEntries, addEntry, setSearchQuery, setLoading } = useJournalStore();

  const fetchJournalEntries = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/journal/${userId}`);
      if (res.ok) {
        const json = await res.json();
        setEntries(json.entries || json || []);
      }
    } catch (err) {
      console.error("Error fetching journal entries:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, setEntries, setLoading]);

  useEffect(() => {
    fetchJournalEntries();
  }, [fetchJournalEntries]);

  const createJournalEntry = async (title: string, content: string) => {
    if (!userId || !title.trim() || !content.trim()) return false;
    try {
      const res = await fetch(`${API_URL}/journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          title: title.trim(),
          content: content.trim(),
        }),
      });
      if (res.ok) {
        toast.success("Journal entry saved! 📝");
        addEntry({ title: title.trim(), content: content.trim(), created_at: new Date().toISOString() });
        fetchJournalEntries();
        return true;
      } else {
        toast.error("Failed to save entry.");
        return false;
      }
    } catch (err) {
      toast.error("Network error.");
      return false;
    }
  };

  return {
    entries,
    searchQuery,
    setSearchQuery,
    loading,
    refetch: fetchJournalEntries,
    createJournalEntry,
  };
}
