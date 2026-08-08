"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAndroid } from "@/hooks/useIsAndroid";
import AndroidProfile from "@/components/mobile/AndroidProfile";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { API_URL } from "@/lib/config";

function DesktopProfileView() {
  const { user, userRole, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [wellnessGoals, setWellnessGoals] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/profile/${user.id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.profile) {
          setDisplayName(json.profile.display_name || "");
          setAge(json.profile.age || "");
          setGender(json.profile.gender || "");
          setTimezone(json.profile.timezone || "Asia/Kolkata");
          setWellnessGoals(json.profile.wellness_goals || "");
        }
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProfile();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchProfile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          age: age === "" ? null : Number(age),
          gender: gender || null,
          timezone,
          wellness_goals: wellnessGoals,
        }),
      });

      if (res.ok) {
        toast.success("Profile updated! 👤");
      } else {
        toast.error("Failed to update profile");
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    router.replace("/login");
  };

  if (authLoading || loading)
    return (
      <>
        <Sidebar />
        <div className="app-main-layout">
          <PageSkeleton />
        </div>
      </>
    );

  if (!user) return null;

  const PROFILE_MENU = userRole === "admin"
    ? [
        { label: "Patient Appointments", icon: "📅", href: "/admin?tab=appointments", color: "#f59e0b", subtitle: "View and manage patient sessions" },
        { label: "Doctor Portal", icon: "🩺", href: "/admin", color: "#22c55e", subtitle: "Clinical dashboard and patient manager" },
        { label: "Settings & Privacy", icon: "⚙️", href: "/settings", color: "#a855f7", subtitle: "Theme, export data, privacy" },
      ]
    : [
        { label: "My Appointments", icon: "📅", href: "/appointments/my", color: "#3b82f6", subtitle: "Scheduled therapist sessions" },
        { label: "Settings & Privacy", icon: "⚙️", href: "/settings", color: "#a855f7", subtitle: "Theme, export data, privacy" },
        { label: "Notification Reminders", icon: "🔔", href: "/reminders", color: "#f59e0b", subtitle: "Custom check-in alerts" },
      ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Sidebar />
      <main className="app-main-layout" style={{ padding: "24px 20px", maxWidth: 800, overflow: "auto" }}>
        <MobileHeader title="User Profile" />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: 24,
            borderRadius: 24,
            background: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(59,130,246,0.08))",
            border: "1px solid rgba(34,197,94,0.25)",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              color: "#fff",
              boxShadow: "0 0 20px rgba(34,197,94,0.3)",
              fontWeight: 800,
            }}
          >
            {displayName ? displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-display)" }}>
              {displayName || "MindMate Member"}
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 0" }}>{user.email}</p>
          </div>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 28 }}>
          {PROFILE_MENU.map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: 16,
                  borderRadius: 18,
                  background: "var(--bg-glass)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid var(--border-secondary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: `${item.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{item.subtitle}</div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        <div
          style={{
            padding: 24,
            borderRadius: 20,
            background: "var(--bg-glass)",
            border: "1px solid var(--border-secondary)",
            backdropFilter: "blur(16px)",
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20, fontFamily: "var(--font-display)" }}>
            Personal Details
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", display: "block", marginBottom: 6 }}>
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your preferred name"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-secondary)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", display: "block", marginBottom: 6 }}>
                Age
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                placeholder="Age in years"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-secondary)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", display: "block", marginBottom: 6 }}>
              Mental Wellness Goals
            </label>
            <textarea
              value={wellnessGoals}
              onChange={(e) => setWellnessGoals(e.target.value)}
              placeholder="e.g., Manage anxiety during work presentations, improve sleep consistency."
              style={{
                width: "100%",
                minHeight: 80,
                padding: "12px",
                borderRadius: 10,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-secondary)",
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 12,
              background: saving ? "var(--bg-tertiary)" : "linear-gradient(135deg, #22c55e, #16a34a)",
              border: "none",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? "default" : "pointer",
            }}
          >
            {saving ? "Saving..." : "Save Profile Changes ✨"}
          </button>
        </div>

        <button
          onClick={handleSignOut}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 14,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          🚪 Sign Out of Account
        </button>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  const isAndroid = useIsAndroid();

  if (isAndroid) {
    return <AndroidProfile />;
  }

  return <DesktopProfileView />;
}
