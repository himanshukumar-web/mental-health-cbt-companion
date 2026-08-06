"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import WellnessPanel from "@/components/WellnessPanel";
import QuickMoodLogger from "@/components/QuickMoodLogger";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { motion } from "framer-motion";

import { API_URL } from "@/lib/config";

export default function WellnessHubPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [moodCount, setMoodCount] = useState(0);
  const [journalCount, setJournalCount] = useState(0);
  const [cbtCount, setCbtCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [moodRes, journalRes, cbtRes] = await Promise.allSettled([
        fetch(`${API_URL}/mood-entries/${user.id}`),
        fetch(`${API_URL}/journal/${user.id}`),
        fetch(`${API_URL}/cbt-worksheets/${user.id}`),
      ]);

      if (moodRes.status === "fulfilled" && moodRes.value.ok) {
        const json = await moodRes.value.json();
        setMoodCount((json.mood_entries || []).length);
      }
      if (journalRes.status === "fulfilled" && journalRes.value.ok) {
        const json = await journalRes.value.json();
        setJournalCount((json.journal_entries || []).length);
      }
      if (cbtRes.status === "fulfilled" && cbtRes.value.ok) {
        const json = await cbtRes.value.json();
        setCbtCount((json.worksheets || []).length);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  if (authLoading || loading)
    return (
      <>
        <Sidebar />
        <div style={{ marginLeft: 250 }}>
          <PageSkeleton />
        </div>
      </>
    );

  if (!user) return null;

  const WELLNESS_TOOLS = [
    {
      id: "mood",
      title: "Daily Mood Tracker",
      subtitle: `${moodCount} check-ins logged`,
      icon: "😊",
      href: "/mood",
      color: "#22c55e",
      badge: "Track",
    },
    {
      id: "journal",
      title: "Voice & Reflective Journal",
      subtitle: `${journalCount} journal reflections`,
      icon: "📝",
      href: "/journal",
      color: "#ec4899",
      badge: "Voice AI",
    },
    {
      id: "habits",
      title: "Mindful Habit Tracker",
      subtitle: "Daily wellness consistency rings",
      icon: "✅",
      href: "/habits",
      color: "#f59e0b",
      badge: "Consistency",
    },
    {
      id: "meditation",
      title: "Guided Meditation",
      subtitle: "Calm your mind & reduce stress",
      icon: "🧘",
      href: "/meditation",
      color: "#8b5cf6",
      badge: "Audio",
    },
    {
      id: "breathing",
      title: "Box & Deep Breathing",
      subtitle: "4-7-8 parasympathetic calm",
      icon: "🫁",
      href: "/breathing",
      color: "#06b6d4",
      badge: "Relax",
    },
    {
      id: "cbt",
      title: "CBT Thought Challenging",
      subtitle: `${cbtCount} cognitive worksheets`,
      icon: "🧠",
      href: "/cbt",
      color: "#3b82f6",
      badge: "CBT Tools",
    },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Sidebar />
      <main className="app-main-layout" style={{ padding: "24px 20px", maxWidth: 960, overflow: "auto" }}>
        <MobileHeader title="Wellness & Self-Care" />

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#22c55e", letterSpacing: "0.08em" }}>
            Wellness & Self-Care Hub
          </span>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", margin: "4px 0 0", fontFamily: "var(--font-display)" }}>
            Mindful Wellness Tools 🧘
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Log your daily mood, write voice journals, track habits, and practice deep meditation.
          </p>
        </div>

        {/* 1-Tap Quick Mood Check-In Widget */}
        <div style={{ marginBottom: 28 }}>
          <QuickMoodLogger userId={user.id} onMoodLogged={fetchData} />
        </div>

        {/* Wellness Tools Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-display)" }}>
            🌿 Self-Care Modules
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 14 }}>
            {WELLNESS_TOOLS.map((tool) => (
              <Link key={tool.id} href={tool.href} style={{ textDecoration: "none" }}>
                <motion.div
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: 18,
                    borderRadius: 20,
                    background: "var(--bg-glass)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid var(--border-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      background: `${tool.color}20`,
                      border: `1px solid ${tool.color}50`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      flexShrink: 0,
                    }}
                  >
                    {tool.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {tool.title}
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 8,
                          background: `${tool.color}20`,
                          color: tool.color,
                        }}
                      >
                        {tool.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{tool.subtitle}</div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <WellnessPanel userId={user.id} />
    </div>
  );
}
