"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AndroidMobileLayout from "./AndroidMobileLayout";
import {
  TopAppBar,
  MaterialCard,
  ListItem,
  OutlinedButton,
  SnackBar,
} from "./ui";

export default function AndroidSettings() {
  const { signOut } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<boolean>(true);
  const [haptics, setHaptics] = useState<boolean>(true);
  const [darkTheme, setDarkTheme] = useState<boolean>(true);
  const [snackMessage, setSnackMessage] = useState<string | null>(null);

  return (
    <AndroidMobileLayout>
      <TopAppBar title="Settings" subtitle="App & Device Preferences" />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Preference Controls */}
        <MaterialCard variant="filled" style={{ padding: "4px 0" }}>
          <ListItem
            leading="🔔"
            headline="Daily Reminders"
            supportingText="Receive gentle CBT check-in notifications"
            trailing={
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => {
                  setNotifications(e.target.checked);
                  setSnackMessage(e.target.checked ? "Notifications enabled" : "Notifications disabled");
                }}
                style={{ accentColor: "#22c55e", width: "20px", height: "20px" }}
              />
            }
            divider
          />

          <ListItem
            leading="📳"
            headline="Haptic Feedback"
            supportingText="Vibrate on tap & touch interactions"
            trailing={
              <input
                type="checkbox"
                checked={haptics}
                onChange={(e) => {
                  setHaptics(e.target.checked);
                }}
                style={{ accentColor: "#22c55e", width: "20px", height: "20px" }}
              />
            }
            divider
          />

          <ListItem
            leading="🌙"
            headline="Dark Mode"
            supportingText="Optimized for OLED displays"
            trailing={
              <input
                type="checkbox"
                checked={darkTheme}
                onChange={(e) => setDarkTheme(e.target.checked)}
                style={{ accentColor: "#22c55e", width: "20px", height: "20px" }}
              />
            }
          />
        </MaterialCard>

        {/* App Version Info */}
        <MaterialCard variant="elevated" style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>📱</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#e8edf5" }}>Sera Android Native App</div>
          <div style={{ fontSize: "12px", color: "#8b95a7", marginTop: "2px" }}>Version 2.4.0 (Material Design 3 Architecture)</div>
          <div style={{ fontSize: "11px", color: "#4ade80", marginTop: "8px", fontWeight: 600 }}>
            Capacitor Native Engine Active
          </div>
        </MaterialCard>

        <OutlinedButton
          fullWidth
          onClick={async () => {
            await signOut();
            router.replace("/login");
          }}
          style={{ borderColor: "rgba(239, 68, 68, 0.4)", color: "#ef4444" }}
        >
          Sign Out
        </OutlinedButton>

        {snackMessage && (
          <SnackBar
            message={snackMessage}
            actionLabel="OK"
            onAction={() => setSnackMessage(null)}
          />
        )}
      </div>
    </AndroidMobileLayout>
  );
}
