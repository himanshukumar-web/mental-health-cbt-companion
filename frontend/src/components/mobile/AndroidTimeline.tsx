"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AndroidMobileLayout from "./AndroidMobileLayout";
import { MD3TopAppBar } from "./ui/TopAppBar";
import { MD3Card } from "./ui/Card";
import { MD3LoadingState, MD3EmptyState } from "./ui/FeedbackStates";
import { API_URL } from "@/lib/config";

export default function AndroidTimeline() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) return;
    async function fetchTimeline() {
      try {
        const res = await fetch(`${API_URL}/mood-entries/${user?.id}`);
        if (res.ok) {
          const json = await res.json();
          setEvents(json.mood_entries || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTimeline();
  }, [user]);

  return (
    <AndroidMobileLayout>
      <MD3TopAppBar title="Activity Timeline" subtitle="Chronological CBT log" />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {loading ? (
          <MD3LoadingState message="Loading timeline..." />
        ) : events.length === 0 ? (
          <MD3EmptyState icon="⏳" title="No events recorded" description="Logged moods, sessions, and journal notes will appear here." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {events.map((item, idx) => (
              <MD3Card key={idx} variant="filled" style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "rgba(34, 197, 94, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    flexShrink: 0,
                  }}
                >
                  {item.mood_emoji || "🎭"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#e8edf5" }}>
                      Mood Check-in ({item.mood_score}/10)
                    </span>
                    <span style={{ fontSize: "11px", color: "#8b95a7" }}>
                      {new Date(item.created_at || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                  {item.notes && (
                    <p style={{ fontSize: "13px", color: "#8b95a7", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                      {item.notes}
                    </p>
                  )}
                </div>
              </MD3Card>
            ))}
          </div>
        )}
      </div>
    </AndroidMobileLayout>
  );
}
