"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWellnessScore } from "@/hooks/useWellnessScore";
import { usePersona } from "@/hooks/usePersona";
import AndroidMobileLayout from "./AndroidMobileLayout";
import { MD3Card } from "./ui/Card";
import { MD3Button } from "./ui/Button";
import { MD3LoadingState } from "./ui/FeedbackStates";
import { API_URL } from "@/lib/config";

const QUICK_ACTIONS = [
  { icon: "🤖", title: "Talk with AI", href: "/chat", color: "#22c55e", bg: "rgba(34, 197, 94, 0.15)", subtitle: "CBT Guide" },
  { icon: "🎭", title: "Log Mood", href: "/mood", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", subtitle: "Track emotions" },
  { icon: "📝", title: "Journal", href: "/journal", color: "#ec4899", bg: "rgba(236, 72, 153, 0.15)", subtitle: "Reflect daily" },
  { icon: "🧘", title: "Meditate", href: "/meditation", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", subtitle: "Mindfulness" },
  { icon: "🫁", title: "Breathing", href: "/breathing", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.15)", subtitle: "Calm anxiety" },
  { icon: "📅", title: "Appointments", href: "/appointments", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)", subtitle: "Doctors" },
];

export default function AndroidDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [moodEntries, setMoodEntries] = useState<any[]>([]);
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  const { currentScore } = useWellnessScore(user?.id);
  const { activePersona } = usePersona(user?.id);

  useEffect(() => {
    if (!user) return;
    async function loadDashboardData() {
      try {
        const [moodRes, xpRes] = await Promise.allSettled([
          fetch(`${API_URL}/mood-entries/${user?.id}`),
          fetch(`${API_URL}/gamification/xp/${user?.id}`),
        ]);

        if (moodRes.status === "fulfilled" && moodRes.value.ok) {
          const json = await moodRes.value.json();
          setMoodEntries(json.mood_entries || []);
        }
        if (xpRes.status === "fulfilled" && xpRes.value.ok) {
          const json = await xpRes.value.json();
          setUserXP(json.xp || 0);
          setUserLevel(json.level || 1);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning 🌅";
    if (hour < 17) return "Good Afternoon ☀️";
    if (hour < 21) return "Good Evening 🌙";
    return "Good Night ✨";
  };

  if (loading) {
    return (
      <AndroidMobileLayout>
        <MD3LoadingState message="Loading your companion..." />
      </AndroidMobileLayout>
    );
  }

  const latestMood = moodEntries[0];

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
            {getGreeting()}
          </span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#e8edf5", margin: "2px 0 0 0", letterSpacing: "-0.02em" }}>
            {user?.user_metadata?.full_name || "Friend"}
          </h1>
        </div>

        <Link
          href="/profile"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            color: "#ffffff",
            boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
            textDecoration: "none",
          }}
        >
          {user?.user_metadata?.full_name ? user.user_metadata.full_name[0].toUpperCase() : "👤"}
        </Link>
      </div>

      <div style={{ padding: "0 16px 20px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Wellness Score Card */}
        <MD3Card variant="elevated" style={{ background: "linear-gradient(135deg, #182720 0%, #0f172a 100%)", borderColor: "rgba(34, 197, 94, 0.25)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "12px", color: "#8b95a7", fontWeight: 600 }}>WELLNESS INDEX</span>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#4ade80", margin: "4px 0" }}>
                {typeof currentScore === "object" && currentScore !== null ? (currentScore as any).overall_score ?? 78 : typeof currentScore === "number" ? currentScore : 78}{" "}
                <span style={{ fontSize: "14px", color: "#8b95a7", fontWeight: 500 }}>/ 100</span>
              </div>
              <span style={{ fontSize: "12px", color: "#e8edf5", opacity: 0.8 }}>
                Guided by {activePersona?.name || "Dr. Sera"}
              </span>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", color: "#f59e0b", fontWeight: 700, padding: "4px 10px", borderRadius: "100px", background: "rgba(245, 158, 11, 0.15)", display: "inline-block" }}>
                Level {userLevel}
              </div>
              <div style={{ fontSize: "12px", color: "#8b95a7", marginTop: "6px" }}>
                {userXP} XP earned
              </div>
            </div>
          </div>
        </MD3Card>

        {/* Latest Mood Banner */}
        {latestMood ? (
          <MD3Card variant="filled" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "28px" }}>{latestMood.mood_emoji || "😊"}</span>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#e8edf5" }}>
                  Score: {latestMood.mood_score}/10
                </div>
                <div style={{ fontSize: "12px", color: "#8b95a7" }}>
                  Logged {new Date(latestMood.created_at || Date.now()).toLocaleDateString()}
                </div>
              </div>
            </div>
            <MD3Button variant="text" onClick={() => router.push("/mood")}>
              Update →
            </MD3Button>
          </MD3Card>
        ) : (
          <MD3Card variant="filled" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#e8edf5" }}>How are you feeling today?</div>
              <div style={{ fontSize: "12px", color: "#8b95a7" }}>Take 10 seconds to check in</div>
            </div>
            <MD3Button variant="tonal" onClick={() => router.push("/mood")}>
              Check in
            </MD3Button>
          </MD3Card>
        )}

        {/* Quick Action Grid (2-column on Android phones) */}
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#e8edf5", margin: "0 0 12px 0" }}>
            Quick Actions
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "12px",
            }}
          >
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.title} href={action.href} style={{ textDecoration: "none" }}>
                <MD3Card
                  clickable
                  variant="filled"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "100px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background: action.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      marginBottom: "12px",
                    }}
                  >
                    {action.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#e8edf5" }}>{action.title}</div>
                    <div style={{ fontSize: "11px", color: "#8b95a7", marginTop: "2px" }}>{action.subtitle}</div>
                  </div>
                </MD3Card>
              </Link>
            ))}
          </div>
        </div>

        {/* AI Chat Banner */}
        <MD3Card
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
        </MD3Card>
      </div>
    </AndroidMobileLayout>
  );
}
