"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWellnessScore } from "@/hooks/useWellnessScore";
import AndroidMobileLayout from "./AndroidMobileLayout";
import {
  TopAppBar,
  MaterialCard,
  QuickActionCard,
  PrimaryButton,
  Badge,
  LoadingSkeleton,
} from "./ui";

const WELLNESS_MODULES = [
  { icon: "🤖", title: "CBT AI Therapy", subtitle: "Cognitive reframing with MindMate", href: "/chat", bg: "rgba(34, 197, 94, 0.15)", badge: "Real-time" },
  { icon: "🎭", title: "Daily Mood Check", subtitle: "Track emotions & stress", href: "/mood", bg: "rgba(245, 158, 11, 0.15)", badge: "Daily" },
  { icon: "🧘", title: "Guided Meditation", subtitle: "Body scan & anxious thoughts", href: "/meditation", bg: "rgba(16, 185, 129, 0.15)", badge: "5 min" },
  { icon: "🫁", title: "Deep Breathing", subtitle: "4-7-8 & Box breathing", href: "/breathing", bg: "rgba(6, 182, 212, 0.15)", badge: "De-stress" },
  { icon: "📝", title: "Voice Journal", subtitle: "Safe, encrypted reflections", href: "/journal", bg: "rgba(236, 72, 153, 0.15)", badge: "Encrypted" },
  { icon: "📅", title: "Doctor Consultations", subtitle: "Book verified psychologists", href: "/appointments", bg: "rgba(59, 130, 246, 0.15)", badge: "Care" },
  { icon: "📈", title: "Analytics & Trends", subtitle: "Mood heatmaps & progress", href: "/analytics", bg: "rgba(168, 85, 247, 0.15)", badge: "Insights" },
  { icon: "🔔", title: "Smart Reminders", subtitle: "Gentle mindfulness pings", href: "/notifications", bg: "rgba(244, 63, 94, 0.15)", badge: "Schedule" },
];

export default function AndroidWellness() {
  const { user } = useAuth();
  const router = useRouter();
  const { currentScore, loading } = useWellnessScore(user?.id);

  const totalScore = typeof currentScore === "object" && currentScore !== null
    ? (currentScore as any).overall_score ?? (currentScore as any).total_score ?? 78
    : typeof currentScore === "number" ? currentScore : 78;

  if (loading) {
    return (
      <AndroidMobileLayout hasBottomNav={true}>
        <TopAppBar title="Wellness Hub" subtitle="Mind & Body Resources" showBack={false} />
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <LoadingSkeleton height="140px" />
          <LoadingSkeleton height="200px" />
        </div>
      </AndroidMobileLayout>
    );
  }

  return (
    <AndroidMobileLayout hasBottomNav={true}>
      <TopAppBar
        title="Wellness Hub"
        subtitle="Holistic mental health tools"
        showBack={false}
        actions={
          <button
            onClick={() => router.push("/notifications")}
            aria-label="Notifications"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              background: "rgba(255, 255, 255, 0.04)",
              color: "#e8edf5",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            🔔
          </button>
        }
      />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* Wellness Score Card */}
        <MaterialCard
          variant="elevated"
          style={{
            background: "linear-gradient(135deg, #132a20 0%, #0d1726 100%)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            borderRadius: "20px",
            padding: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#4ade80", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                AI WELLNESS INDEX
              </span>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#ffffff", margin: "4px 0" }}>
                {totalScore} <span style={{ fontSize: "14px", color: "#8b95a7" }}>/100</span>
              </div>
            </div>
            <Badge label="✨ Thriving" color="#4ade80" bg="rgba(34, 197, 94, 0.15)" />
          </div>

          <p style={{ fontSize: "13px", color: "#8b95a7", margin: "0 0 16px 0", lineHeight: 1.5 }}>
            Your cognitive resilience is strong today. Explore exercises below to maintain balance.
          </p>

          <PrimaryButton fullWidth onClick={() => router.push("/chat")}>
            Start Daily Session with MindMate 💬
          </PrimaryButton>
        </MaterialCard>

        {/* Explore All Wellness Tools */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#e8edf5", margin: 0 }}>
              CBT & Mindfulness Suite
            </h2>
            <span style={{ fontSize: "12px", color: "#8b95a7" }}>8 Activities</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "12px",
            }}
          >
            {WELLNESS_MODULES.map((item) => (
              <div key={item.title} onClick={() => router.push(item.href)} style={{ cursor: "pointer" }}>
                <QuickActionCard
                  icon={item.icon}
                  title={item.title}
                  subtitle={item.subtitle}
                  bg={item.bg}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AndroidMobileLayout>
  );
}
