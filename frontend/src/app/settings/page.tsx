"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const LANGUAGES = [
  { code: "en", label: "English 🇺🇸" },
  { code: "hi", label: "Hindi 🇮🇳" },
  { code: "es", label: "Spanish 🇪🇸" },
  { code: "fr", label: "French 🇫🇷" },
  { code: "de", label: "German 🇩🇪" },
];

export default function SettingsPage() {
  const { user, loading: authLoading, theme, setTheme } = useAuth();
  const router = useRouter();

  const [language, setLanguage] = useState("en");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [dataSharing, setDataSharing] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/settings/${user.id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.settings) {
          setLanguage(json.settings.language || "en");
          setNotificationsEnabled(!!json.settings.notifications_enabled);
          setEmailNotifications(!!json.settings.email_notifications);
          setDataSharing(!!json.settings.data_sharing);
          setAnalyticsEnabled(!!json.settings.analytics_enabled);
        }
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/settings/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          language,
          notifications_enabled: notificationsEnabled,
          email_notifications: emailNotifications,
          data_sharing: dataSharing,
          analytics_enabled: analyticsEnabled,
        }),
      });

      if (res.ok) {
        toast.success("Preferences updated! ⚙️");
      } else {
        toast.error("Failed to save preferences");
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  };

  const handleExportData = async () => {
    if (!user) return;
    toast.loading("Exporting complete user payload...");
    try {
      const res = await fetch(`${API_URL}/export/${user.id}`);
      if (res.ok) {
        const json = await res.json();
        const blob = new Blob([JSON.stringify(json.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sera_wellness_export_${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.dismiss();
        toast.success("Data export downloaded!");
      }
    } catch {
      toast.dismiss();
      toast.error("Export failed");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/delete-data/${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Account and all data permanently deleted");
        router.replace("/login");
      }
    } catch {
      toast.error("Account deletion failed");
    }
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
            System Settings ⚙️
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Customize language, theme presets, notification schedules, and data privacy
          </p>
        </div>

        {/* Appearance & Language Card */}
        <div
          style={{
            padding: "24px",
            borderRadius: 20,
            background: "var(--bg-glass)",
            border: "0.5px solid var(--border-secondary)",
            marginBottom: 28,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 20,
              fontFamily: "var(--font-display)",
            }}
          >
            Appearance & Language
          </h2>

          {/* Language Selection */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", display: "block", marginBottom: 6 }}>
              Interface Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
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
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                Theme Mode
              </div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                Current: {theme === "light" ? "Light Mode ☀️" : "Dark Mode 🌙"}
              </div>
            </div>
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                background: "var(--bg-secondary)",
                border: "0.5px solid var(--border-secondary)",
                color: "var(--text-primary)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Switch to {theme === "light" ? "Dark 🌙" : "Light ☀️"}
            </button>
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
            {saving ? "Saving..." : "Save Preferences ✨"}
          </button>
        </div>

        {/* Data Privacy & Account Management */}
        <div
          style={{
            padding: "24px",
            borderRadius: 20,
            background: "var(--bg-glass)",
            border: "0.5px solid var(--border-secondary)",
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 16,
              fontFamily: "var(--font-display)",
            }}
          >
            Data Privacy & Account Controls
          </h2>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={handleExportData}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                background: "var(--bg-secondary)",
                border: "0.5px solid var(--border-secondary)",
                color: "var(--text-primary)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              📥 Export Complete User Data (JSON)
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                background: "rgba(239,68,68,0.1)",
                border: "0.5px solid rgba(239,68,68,0.3)",
                color: "#ef4444",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ⚠️ Delete Account & Data
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <div
              style={{
                maxWidth: 420,
                width: "100%",
                padding: "28px 24px",
                borderRadius: 20,
                background: "var(--bg-primary)",
                border: "1px solid rgba(239,68,68,0.3)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 42, marginBottom: 12 }}>⚠️</div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-display)",
                  marginBottom: 8,
                }}
              >
                Delete Account Permanently?
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                This action is irreversible. All your mood logs, journal entries, habit streaks, CBT worksheets, and meditation records will be permanently erased.
              </p>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 10,
                    background: "var(--bg-secondary)",
                    border: "0.5px solid var(--border-secondary)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                    border: "none",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
