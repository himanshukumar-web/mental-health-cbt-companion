"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function SettingsPage() {
  const { user, loading: authLoading, theme, setTheme } = useAuth();
  const router = useRouter();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [dataSharing, setDataSharing] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

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
          notifications_enabled: notificationsEnabled,
          email_notifications: emailNotifications,
          data_sharing: dataSharing,
          analytics_enabled: analyticsEnabled,
        }),
      });

      if (res.ok) {
        toast.success("Settings saved! ⚙️");
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  };

  const handleExportData = async () => {
    if (!user) return;
    toast.loading("Preparing your data export...");
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

  const handleDeleteData = async () => {
    if (!user) return;
    if (
      !confirm(
        "Are you sure you want to permanently delete all your mood entries, journals, habits, and CBT worksheets? This cannot be undone."
      )
    )
      return;

    try {
      const res = await fetch(`${API_URL}/delete-data/${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("All data permanently deleted");
        router.replace("/dashboard");
      }
    } catch {
      toast.error("Delete failed");
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
            App Settings ⚙️
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Manage theme preferences, privacy, and data export
          </p>
        </div>

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
            Appearance & Theme
          </h2>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                Theme Mode
              </div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                Current: {theme === "light" ? "Light Mode ☀️" : "Dark Mode 🌙"}
              </div>
            </div>
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              style={{
                padding: "8px 16px",
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

          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 20,
              fontFamily: "var(--font-display)",
            }}
          >
            Notifications & Privacy
          </h2>

          <div
            style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                  In-App Notifications
                </div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                  Receive daily wellness and reminder alerts
                </div>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                  Email Digest
                </div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                  Receive weekly progress summaries
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                  Personal Analytics
                </div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                  Allow Sera to calculate wellness correlation charts
                </div>
              </div>
              <input
                type="checkbox"
                checked={analyticsEnabled}
                onChange={(e) => setAnalyticsEnabled(e.target.checked)}
              />
            </label>
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

        {/* Data Management Section */}
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
            Data Privacy & Export
          </h2>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
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
              📥 Export All My Data (JSON)
            </button>

            <button
              onClick={handleDeleteData}
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
              ⚠️ Delete All My Data
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
