"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/config";

/**
 * useDailyReminders:
 * Automatically triggers generation of daily task reminder notifications
 * when an authenticated user opens the app.
 * Deduplicated on backend by user_id, date, and task type.
 */
export function useDailyReminders() {
  const { user } = useAuth();
  const triggeredRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Get current local date in YYYY-MM-DD format
    const now = new Date();
    const localDate = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    // Don't trigger multiple times in the same day within the same session
    const sessionKey = `${user.id}_${localDate}`;
    if (triggeredRef.current === sessionKey) return;

    triggeredRef.current = sessionKey;

    const generateReminders = async () => {
      try {
        const apiUrl = getApiUrl();
        await fetch(`${apiUrl}/reminders/${user.id}/generate-daily`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ local_date: localDate }),
        });
      } catch (err) {
        console.warn("[useDailyReminders] Failed to generate daily reminders:", err);
      }
    };

    generateReminders();
  }, [user?.id]);
}
