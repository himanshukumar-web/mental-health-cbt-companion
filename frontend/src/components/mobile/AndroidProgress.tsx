"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMobileGamification } from "@/hooks/mobile";
import AndroidMobileLayout from "./AndroidMobileLayout";
import { TopAppBar, MaterialCard, Badge, LoadingSkeleton, Tag } from "./ui";

const ACHIEVEMENTS = [
  { id: "1", title: "First Step", desc: "Completed your first CBT check-in", icon: "🌱", unlocked: true },
  { id: "2", title: "Mindful Streaker", desc: "Maintained a 7-day mood streak", icon: "🔥", unlocked: true },
  { id: "3", title: "Thought Master", desc: "Completed 5 CBT worksheets", icon: "🧠", unlocked: true },
  { id: "4", title: "Zen Master", desc: "Logged 10 meditation sessions", icon: "🧘", unlocked: false },
  { id: "5", title: "Deep Rest", desc: "Maintained 8h sleep for 3 days", icon: "🌙", unlocked: false },
];

export default function AndroidProgress() {
  const { user } = useAuth();
  const { xp, level, nextLevelXp, progressPercent, loading } = useMobileGamification(user?.id);

  const safeXp = typeof xp === "number" ? xp : typeof xp === "object" && xp !== null ? Number((xp as any).total_xp ?? 0) : 350;
  const safeLevel = typeof level === "number" ? level : typeof level === "object" && level !== null ? Number((level as any).level ?? 1) : 3;
  const safeNextLevelXp = typeof nextLevelXp === "number" ? nextLevelXp : safeLevel * 200;
  const safePercent = typeof progressPercent === "number" ? progressPercent : Math.min(100, Math.round((safeXp / (safeNextLevelXp || 1)) * 100));

  if (loading) {
    return (
      <AndroidMobileLayout>
        <TopAppBar title="Progress & Achievements" subtitle="Gamified CBT journey" />
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <LoadingSkeleton height="140px" />
          <LoadingSkeleton height="200px" />
        </div>
      </AndroidMobileLayout>
    );
  }

  return (
    <AndroidMobileLayout>
      <TopAppBar title="Progress & Achievements" subtitle="Gamified CBT journey" />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Level & XP Card */}
        <MaterialCard variant="elevated" style={{ background: "linear-gradient(135deg, #182720 0%, #0f172a 100%)", borderColor: "rgba(34, 197, 94, 0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div>
              <span style={{ fontSize: "12px", color: "#4ade80", fontWeight: 700 }}>CURRENT RANK</span>
              <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#e8edf5", margin: "2px 0 0 0" }}>
                Level {safeLevel} Explorer
              </h2>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                boxShadow: "0 4px 14px rgba(245, 158, 11, 0.3)",
              }}
            >
              🏆
            </div>
          </div>

          {/* XP Progress Bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#8b95a7", marginBottom: "6px" }}>
              <span>{safeXp} XP</span>
              <span>{safeNextLevelXp} XP (Level {safeLevel + 1})</span>
            </div>
            <div style={{ width: "100%", height: "8px", borderRadius: "4px", background: "rgba(255, 255, 255, 0.1)", overflow: "hidden" }}>
              <div
                style={{
                  width: `${safePercent}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #22c55e, #10b981)",
                  borderRadius: "4px",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>
        </MaterialCard>

        {/* Achievements List */}
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#e8edf5", marginBottom: "12px" }}>
            Badges & Achievements
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {ACHIEVEMENTS.map((a) => (
              <MaterialCard
                key={a.id}
                variant="filled"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  opacity: a.unlocked ? 1 : 0.45,
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "14px",
                    background: a.unlocked ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    flexShrink: 0,
                  }}
                >
                  {a.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#e8edf5" }}>{a.title}</div>
                  <div style={{ fontSize: "12px", color: "#8b95a7", marginTop: "2px" }}>{a.desc}</div>
                </div>
                <Tag label={a.unlocked ? "UNLOCKED" : "LOCKED"} variant={a.unlocked ? "success" : "default"} />
              </MaterialCard>
            ))}
          </div>
        </div>
      </div>
    </AndroidMobileLayout>
  );
}
