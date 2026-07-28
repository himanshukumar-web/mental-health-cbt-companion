"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
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
    fetchProfile();
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
        toast.success("Profile saved! 👤");
      } else {
        toast.error("Failed to update profile");
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  };

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
          maxWidth: 800,
          overflow: "auto",
        }}
      >
        <style>{`
          @media (max-width: 767px) { main { margin-left: 0 !important; padding: 16px !important; } }
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
            User Profile 👤
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Personalize your account details and wellness goals
          </p>
        </div>

        {/* Form */}
        <div
          style={{
            padding: "28px 24px",
            borderRadius: 20,
            background: "var(--bg-glass)",
            border: "0.5px solid var(--border-secondary)",
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-tertiary)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Email Address
            </label>
            <input
              type="text"
              disabled
              value={user.email || ""}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                background: "var(--bg-tertiary)",
                border: "0.5px solid var(--border-secondary)",
                color: "var(--text-tertiary)",
                fontSize: 13,
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-tertiary)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Himanshu"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                background: "var(--bg-secondary)",
                border: "0.5px solid var(--border-secondary)",
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Age
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) =>
                  setAge(e.target.value ? parseInt(e.target.value) : "")
                }
                placeholder="25"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 10,
                  background: "var(--bg-secondary)",
                  border: "0.5px solid var(--border-secondary)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 10,
                  background: "var(--bg-secondary)",
                  border: "0.5px solid var(--border-secondary)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                }}
              >
                <option value="">Select (Optional)</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-tertiary)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Timezone
            </label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="Asia/Kolkata"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                background: "var(--bg-secondary)",
                border: "0.5px solid var(--border-secondary)",
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-tertiary)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Mental Wellness Goals
            </label>
            <textarea
              value={wellnessGoals}
              onChange={(e) => setWellnessGoals(e.target.value)}
              placeholder="e.g., Manage anxiety during work presentations, improve sleep consistency."
              style={{
                width: "100%",
                minHeight: 90,
                padding: "12px",
                borderRadius: 10,
                background: "var(--bg-secondary)",
                border: "0.5px solid var(--border-secondary)",
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none",
                resize: "vertical",
                fontFamily: "var(--font-body)",
              }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 12,
              background: saving
                ? "var(--bg-tertiary)"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
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
      </main>
    </div>
  );
}
