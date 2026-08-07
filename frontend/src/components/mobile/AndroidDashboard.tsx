"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWellnessScore } from "@/hooks/useWellnessScore";
import { usePersona } from "@/hooks/usePersona";
import { useMobileMoodData, useMobileGamification } from "@/hooks/mobile";
import { getGreeting, formatMobileDate } from "@/utils/mobileUtils";
import AndroidMobileLayout from "./AndroidMobileLayout";
import {
  MaterialCard,
  QuickActionCard,
  MoodCard,
  StatCard,
  PrimaryButton,
  Avatar,
  Badge,
  LoadingSkeleton,
} from "./ui";

const QUICK_ACTIONS = [
  { icon: "🤖", title: "Talk with AI", href: "/chat", bg: "rgba(34, 197, 94, 0.15)", subtitle: "CBT Guide" },
  { icon: "🎭", title: "Log Mood", href: "/mood", bg: "rgba(245, 158, 11, 0.15)", subtitle: "Track emotions" },
  { icon: "📝", title: "Journal", href: "/journal", bg: "rgba(236, 72, 153, 0.15)", subtitle: "Reflect daily" },
  { icon: "🧘", title: "Meditate", href: "/meditation", bg: "rgba(16, 185, 129, 0.15)", subtitle: "Mindfulness" },
  { icon: "🫁", title: "Breathing", href: "/breathing", bg: "rgba(6, 182, 212, 0.15)", subtitle: "Calm anxiety" },
  { icon: "📅", title: "Appointments", href: "/appointments", bg: "rgba(59, 130, 246, 0.15)", subtitle: "Doctors" },
];

export default function AndroidDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const { latestMood, loading: moodLoading } = useMobileMoodData(user?.id);
  const { xp, level, loading: xpLoading } = useMobileGamification(user?.id);
  const { currentScore } = useWellnessScore(user?.id);
  const { activePersona } = usePersona(user?.id);

  const greetingInfo = getGreeting();
  const overallScore = typeof currentScore === "object" && currentScore !== null ? (currentScore as any).overall_score ?? 78 : typeof currentScore === "number" ? currentScore : 78;

  if (moodLoading || xpLoading) {
    return (
      <AndroidMobileLayout>
        <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <LoadingSkeleton height="64px" />
          <LoadingSkeleton height="140px" />
          <LoadingSkeleton height="200px" />
        </div>
      </AndroidMobileLayout>
    );
  }

  return (
    <AndroidMobileLayout>
      {/* Native Top Greeting Bar */}
      <div
        style={{
          padding: "16px 20px 12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, rgba(34, 197, 94, 0.08) 0%, transparent 100%)",
        }}
      >
        <div>
          <span style={{ fontSize: "12px", color: "#4ade80", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {greetingInfo.text} {greetingInfo.icon}
          </span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#e8edf5", margin: "2px 0 0 0", letterSpacing: "-0.02em" }}>
            {user?.user_metadata?.full_name || "Friend"}
          </h1>
        </div>

        <Avatar
          fallback={user?.user_metadata?.full_name ? user.user_metadata.full_name[0].toUpperCase() : "👤"}
          onClick={() => router.push("/profile")}
        />
      </div>

      <div style={{ padding: "0 16px 20px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Wellness Score Card */}
        <MaterialCard variant="elevated" style={{ background: "linear-gradient(135deg, #182720 0%, #0f172a 100%)", borderColor: "rgba(34, 197, 94, 0.25)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "12px", color: "#8b95a7", fontWeight: 600 }}>WELLNESS INDEX</span>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#4ade80", margin: "4px 0" }}>
                {overallScore} <span style={{ fontSize: "14px", color: "#8b95a7", fontWeight: 500 }}>/ 100</span>
              </div>
              <span style={{ fontSize: "12px", color: "#e8edf5", opacity: 0.8 }}>
                Guided by {activePersona?.name || "Dr. Sera"}
              </span>
            </div>

            <div style={{ textAlign: "right" }}>
              <Badge label={`Level ${level}`} color="#f59e0b" bg="rgba(245, 158, 11, 0.15)" />
              <div style={{ fontSize: "12px", color: "#8b95a7", marginTop: "6px" }}>
                {xp} XP earned
              </div>
            </div>
          </div>
        </MaterialCard>

        {/* Latest Mood Banner */}
        {latestMood ? (
          <MoodCard
            emoji={latestMood.mood_emoji || "😊"}
            score={latestMood.mood_score}
            date={formatMobileDate(latestMood.created_at)}
            notes={latestMood.notes}
            onClick={() => router.push("/mood")}
          />
        ) : (
          <MaterialCard variant="filled" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#e8edf5" }}>How are you feeling today?</div>
              <div style={{ fontSize: "12px", color: "#8b95a7" }}>Take 10 seconds to check in</div>
            </div>
            <PrimaryButton onClick={() => router.push("/mood")}>
              Check in
            </PrimaryButton>
          </MaterialCard>
        )}

        {/* Quick Action Grid */}
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#e8edf5", margin: "0 0 12px 0" }}>
            Quick Actions
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.title} href={action.href} style={{ textDecoration: "none" }}>
                <QuickActionCard
                  icon={action.icon}
                  title={action.title}
                  subtitle={action.subtitle}
                  bg={action.bg}
                />
              </Link>
            ))}
          </div>
        </div>

        {/* AI Chat Banner */}
        <MaterialCard
          clickable
          variant="elevated"
          onClick={() => router.push("/chat")}
          style={{
            background: "linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px",
          }}
        >
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#e8edf5" }}>Start CBT Session</div>
            <div style={{ fontSize: "12px", color: "#8b95a7", marginTop: "4px" }}>
              Talk through your thoughts in a safe space
            </div>
          </div>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "#22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "20px",
              boxShadow: "0 4px 14px rgba(34, 197, 94, 0.4)",
            }}
          >
            💬
          </div>
        </MaterialCard>
      </div>
    </AndroidMobileLayout>
  );
}
