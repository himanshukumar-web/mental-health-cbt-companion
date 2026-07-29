"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import DailyChallengesCard from "@/components/DailyChallengesCard";
import { useChallenges } from "@/hooks/useChallenges";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Badge {
  id: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  reqText: string;
  isUnlocked: boolean;
}

export default function AchievementsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [totalXP, setTotalXP] = useState(0);
  const [level, setLevel] = useState(1);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  const { challenges, streak, completeChallenge, loading: challengesLoading } = useChallenges(user?.id);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [xpRes, moodRes, journalRes, cbtRes] = await Promise.all([
        fetch(`${API_URL}/gamification/xp/${user.id}`),
        fetch(`${API_URL}/mood-entries/${user.id}`),
        fetch(`${API_URL}/journal/${user.id}`),
        fetch(`${API_URL}/cbt-worksheets/${user.id}`),
      ]);

      let xp = 0;
      let lvl = 1;

      if (xpRes.ok) {
        const json = await xpRes.json();
        xp = json.xp?.total_xp || 0;
        lvl = json.xp?.level || 1;
        setTotalXP(xp);
        setLevel(lvl);
      }

      let moodCount = 0;
      let journalCount = 0;
      let cbtCount = 0;

      if (moodRes.ok) {
        const json = await moodRes.json();
        moodCount = (json.mood_entries || []).length;
      }
      if (journalRes.ok) {
        const json = await journalRes.json();
        journalCount = (json.journal_entries || []).length;
      }
      if (cbtRes.ok) {
        const json = await cbtRes.json();
        cbtCount = (json.worksheets || []).length;
      }

      const badgeList: Badge[] = [
        {
          id: "mind_explorer",
          title: "Mind Explorer",
          desc: "Explored AI Therapist personas and mental wellness tools.",
          icon: "🌿",
          color: "#22c55e",
          reqText: `${moodCount >= 1 ? "Unlocked!" : "Complete 1 wellness log"}`,
          isUnlocked: moodCount >= 1,
        },
        {
          id: "calm_thinker",
          title: "Calm Thinker",
          desc: "Restructured unhelpful thoughts using CBT worksheets.",
          icon: "🧠",
          color: "#06b6d4",
          reqText: `${Math.min(cbtCount, 3)} / 3 CBT worksheets`,
          isUnlocked: cbtCount >= 3,
        },
        {
          id: "weekly_champion",
          title: "Weekly Champion",
          desc: "Maintained a 7-day mood check-in streak.",
          icon: "🏆",
          color: "#f59e0b",
          reqText: `${Math.min(moodCount, 7)} / 7 check-ins`,
          isUnlocked: moodCount >= 7,
        },
        {
          id: "journal_master",
          title: "Journal Master",
          desc: "Written 5+ reflection journal entries.",
          icon: "📝",
          color: "#a855f7",
          reqText: `${Math.min(journalCount, 5)} / 5 entries`,
          isUnlocked: journalCount >= 5,
        },
        {
          id: "meditation_hero",
          title: "Meditation Hero",
          desc: "Completed mindfulness grounding & meditation.",
          icon: "🧘",
          color: "#8b5cf6",
          reqText: `${xp >= 200 ? "Unlocked!" : "Earn 200+ XP from mindfulness"}`,
          isUnlocked: xp >= 200,
        },
        {
          id: "assessment_ace",
          title: "Assessment Ace",
          desc: "Completed clinical PHQ-9 or GAD-7 assessments.",
          icon: "📊",
          color: "#3b82f6",
          reqText: `${xp >= 50 ? "Unlocked!" : "Complete a clinical test"}`,
          isUnlocked: xp >= 50,
        },
      ];

      setBadges(badgeList);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (authLoading || loading)
    return (
      <>
        <Sidebar />
        <div style={{ marginLeft: 260 }}>
          <PageSkeleton />
        </div>
      </>
    );

  if (!user) return null;

  const currentLevelXP = totalXP % 100;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 260, padding: "32px 28px", maxWidth: 1080, overflow: "auto" }}>
        <style>{`
          @media (max-width: 767px) { main { margin-left: 0 !important; padding: 16px !important; } }
        `}</style>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#f59e0b", letterSpacing: "0.08em" }}>
            Gamification Engine
          </span>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", margin: "4px 0 0" }}>
            Achievements & Daily Quests
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-tertiary)", margin: "4px 0 0" }}>
            Earn XP, unlock achievement badges, maintain daily activity streaks, and reach new levels.
          </p>
        </div>

        {/* Level & XP Card */}
        <div
          style={{
            padding: 24,
            borderRadius: 20,
            background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.1))",
            border: "1px solid rgba(245,158,11,0.3)",
            marginBottom: 28,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #f59e0b, #ea580c)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  color: "#fff",
                  fontWeight: 900,
                  boxShadow: "0 0 20px rgba(245,158,11,0.4)",
                }}
              >
                {level}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>Level {level} Explorer</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Total Experience: {totalXP} XP</div>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{currentLevelXP} / 100 XP</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{100 - currentLevelXP} XP to Level {level + 1}</div>
            </div>
          </div>

          <div style={{ height: 8, borderRadius: 4, background: "var(--bg-secondary)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${currentLevelXP}%`, background: "linear-gradient(90deg, #f59e0b, #ea580c)", borderRadius: 4 }} />
          </div>
        </div>

        {/* Daily Challenges Widget */}
        <div style={{ marginBottom: 28 }}>
          <DailyChallengesCard
            challenges={challenges}
            streak={streak}
            onCompleteChallenge={completeChallenge}
            loading={challengesLoading}
          />
        </div>

        {/* Badges Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            🏅 Achievement Badges
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {badges.map((b) => (
              <motion.div
                key={b.id}
                whileHover={{ y: -2 }}
                style={{
                  padding: 20,
                  borderRadius: 18,
                  background: b.isUnlocked ? "var(--bg-glass)" : "var(--bg-secondary)",
                  backdropFilter: "blur(12px)",
                  border: b.isUnlocked ? `1px solid ${b.color}40` : "1px solid var(--border-secondary)",
                  opacity: b.isUnlocked ? 1 : 0.6,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: b.isUnlocked ? `${b.color}20` : "var(--bg-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                    }}
                  >
                    {b.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{b.title}</div>
                    <div style={{ fontSize: 11, color: b.isUnlocked ? b.color : "var(--text-tertiary)", fontWeight: 600 }}>
                      {b.isUnlocked ? "✓ Unlocked" : "Locked"}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>{b.desc}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600 }}>Requirement: {b.reqText}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
