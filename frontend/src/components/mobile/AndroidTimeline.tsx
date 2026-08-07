"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMobileMoodData } from "@/hooks/mobile";
import { formatMobileDate } from "@/utils/mobileUtils";
import AndroidMobileLayout from "./AndroidMobileLayout";
import { TopAppBar, MoodCard, EmptyState, LoadingSkeleton } from "./ui";

export default function AndroidTimeline() {
  const { user } = useAuth();
  const { moodEntries, loading } = useMobileMoodData(user?.id);

  return (
    <AndroidMobileLayout>
      <TopAppBar title="Activity Timeline" subtitle="Chronological CBT log" />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <LoadingSkeleton height="80px" />
            <LoadingSkeleton height="80px" />
          </div>
        ) : moodEntries.length === 0 ? (
          <EmptyState icon="⏳" title="No events recorded" description="Logged moods, sessions, and journal notes will appear here." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {moodEntries.map((item, idx) => (
              <MoodCard
                key={item.id || idx}
                emoji={item.mood_emoji || "🎭"}
                score={item.mood_score}
                notes={item.notes}
                date={formatMobileDate(item.created_at)}
              />
            ))}
          </div>
        )}
      </div>
    </AndroidMobileLayout>
  );
}
