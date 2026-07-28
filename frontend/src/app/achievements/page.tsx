"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import toast from "react-hot-toast";

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

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [xpRes, moodRes, journalRes, cbtRes, habitRes] = await Promise.all([
        fetch(`${API_URL}/gamification/xp/${user.id}`),
        fetch(`${API_URL}/mood-entries/${user.id}`),
        fetch(`${API_URL}/journal/${user.id}`),
        fetch(`${API_URL}/cbt-worksheets/${user.id}`),
        fetch(`${API_URL}/habits/${user.id}/progress`),
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
      let habitCompletions = 0;

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
      if (habitRes.ok) {
        const json = await habitRes.json();
        habitCompletions = (json.completions || []).length;
      }

      // Compute Badges
      const badgeList: Badge[] = [
        {
          id: "streak_7",
          title: "7-Day Streak",
          desc: "Maintained a 7-day mood check-in streak.",
          icon: "🔥",
          color: "#f97316",
          reqText: `${Math.min(moodCount, 7)} / 7 check-ins`,
          isUnlocked: moodCount >= 7,
        },
        {
          id: "meditation_master",
          title: "Meditation Master",
          desc: "Completed guided mindfulness sessions.",
          icon: "🧘",
          color: "#8b5cf6",
          reqText: `${xp >= 300 ? "Unlocked!" : "Earn 300+ XP from meditation"}`,
          isUnlocked: xp >= 300,
        },
        {
          id: "journal_champion",
          title: "Journal Champion",
          desc: "Written 5+ reflection journal entries.",
          icon: "📖",
          color: "#a855f7",
          reqText: `${Math.min(journalCount, 5)} / 5 entries`,
          isUnlocked: journalCount >= 5,
        },
        {
          id: "hydration_hero",
          title: "Hydration Hero",
          desc: "Logged water intake 8+ times.",
          icon: "💧",
          color: "#3b82f6",
          reqText: `${Math.min(habitCompletions, 8)} / 8 habit completions`,
          isUnlocked: habitCompletions >= 8,
        },
        {
          id: "positive_mind",
          title: "Positive Mind",
          desc: "Recorded positive mood check-ins.",
          icon: "😊",
          color: "#22c55e",
          reqText: `${moodCount >= 3 ? "Unlocked!" : "Log 3+ mood check-ins"}`,
          isUnlocked: moodCount >= 3,
        },
        {
          id: "cbt_restructurer",
          title: "CBT Restructurer",
          desc: "Restructured 3+ negative thoughts into balanced reframes.",
          icon: "🧠",
          color: "#06b6d4",
          reqText: `${Math.min(cbtCount, 3)} / 3 worksheets`,
          isUnlocked: cbtCount >= 3,
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

  const currentLevelXP = totalXP % 500;
  const progressPct = (currentLevelXP / 500) * 100;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-primary)",
      }}
    >
      <Sidebar />
      <main
        style={{
          flex: 1,
          marginLeft: 260,
          padding: "32px 28px",
          maxWidth: 900,
          overflow: "auto",
        }}
      >
        <style>{`
          @media (max-width: 767px) { main { margin-left: 0 !important; padding: 16px !important; } }
          @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        `}</style>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 4vw, 32px)",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            Achievements & Gamification 🏆
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Earn XP and unlock badges as you build healthy mental wellness habits
          </p>
        </div>

        {/* Level Banner */}
        <div
          style={{
            padding: "24px 28px",
            borderRadius: 20,
            background:
              "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(34,197,94,0.08))",
            border: "1px solid rgba(245,158,11,0.3)",
            marginBottom: 32,
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
              color: "white",
              boxShadow: "0 0 24px rgba(245,158,11,0.4)",
            }}
          >
            {level}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                marginBottom: 4,
              }}
            >
              Level {level} Wellness Champion
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                marginBottom: 10,
              }}
            >
              {totalXP} Total XP Earned • {500 - currentLevelXP} XP until Level {level + 1}
            </div>

            {/* XP Progress Bar */}
            <div
              style={{
                width: "100%",
                height: 10,
                borderRadius: 5,
                background: "var(--bg-tertiary)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #f59e0b, #22c55e)",
                  borderRadius: 5,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>
        </div>

        {/* Badges Grid */}
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--text-primary)",
            fontFamily: "var(--font-display)",
            marginBottom: 16,
          }}
        >
          Progress Badges
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {badges.map((b, i) => (
            <div
              key={b.id}
              style={{
                padding: "20px",
                borderRadius: 16,
                background: b.isUnlocked
                  ? "var(--bg-glass)"
                  : "rgba(255,255,255,0.02)",
                border: b.isUnlocked
                  ? `1px solid ${b.color}40`
                  : "0.5px solid var(--border-secondary)",
                opacity: b.isUnlocked ? 1 : 0.55,
                display: "flex",
                alignItems: "center",
                gap: 16,
                animation: `popIn 0.3s ease ${i * 0.05}s both`,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: b.isUnlocked
                    ? `${b.color}20`
                    : "var(--bg-tertiary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  filter: b.isUnlocked ? "none" : "grayscale(100%)",
                }}
              >
                {b.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: b.isUnlocked ? "var(--text-primary)" : "var(--text-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {b.title} {b.isUnlocked && "✓"}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    lineHeight: 1.4,
                    marginTop: 2,
                    marginBottom: 6,
                  }}
                >
                  {b.desc}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: b.isUnlocked ? b.color : "var(--text-tertiary)",
                  }}
                >
                  {b.isUnlocked ? "Unlocked 🎉" : b.reqText}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
