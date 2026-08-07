"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AndroidMobileLayout from "./AndroidMobileLayout";
import { MD3TopAppBar } from "./ui/TopAppBar";
import { MD3Card } from "./ui/Card";
import { MD3ListItem } from "./ui/ListItem";
import { MD3Button } from "./ui/Button";

export default function AndroidProfile() {
  const { user, userRole, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <AndroidMobileLayout>
      <MD3TopAppBar title="Profile & Account" showBack={false} />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* User Card */}
        <MD3Card variant="elevated" style={{ textAlign: "center", padding: "24px 16px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              color: "#ffffff",
              boxShadow: "0 8px 24px rgba(34, 197, 94, 0.35)",
              marginBottom: "12px",
            }}
          >
            {user?.user_metadata?.full_name ? user.user_metadata.full_name[0].toUpperCase() : "👤"}
          </div>

          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#e8edf5", margin: "0 0 4px 0" }}>
            {user?.user_metadata?.full_name || "Valued User"}
          </h2>
          <p style={{ fontSize: "13px", color: "#8b95a7", margin: "0 0 12px 0" }}>{user?.email}</p>

          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "4px 12px",
              borderRadius: "100px",
              background: userRole === "admin" ? "rgba(245, 158, 11, 0.15)" : "rgba(34, 197, 94, 0.15)",
              color: userRole === "admin" ? "#fbbf24" : "#4ade80",
              display: "inline-block",
            }}
          >
            {userRole === "admin" ? "🩺 DOCTOR / ADMIN" : "👤 PATIENT"}
          </span>
        </MD3Card>

        {/* Quick Menu Options */}
        <MD3Card variant="filled" style={{ padding: "4px 0" }}>
          <MD3ListItem
            leading="⚙️"
            headline="Application Settings"
            supportingText="Preferences, notifications & dark mode"
            trailing="➔"
            divider
            onClick={() => router.push("/settings")}
          />
          <MD3ListItem
            leading="📊"
            headline="Personal Progress"
            supportingText="Level, badges & CBT worksheet stats"
            trailing="➔"
            divider
            onClick={() => router.push("/progress")}
          />
          <MD3ListItem
            leading="🛡️"
            headline="Privacy & Safety"
            supportingText="Data encryption & emergency helplines"
            trailing="➔"
          />
        </MD3Card>

        {/* Sign Out Button */}
        <MD3Button variant="outlined" fullWidth onClick={handleSignOut} style={{ borderColor: "rgba(239, 68, 68, 0.4)", color: "#ef4444", marginTop: "12px" }}>
          Sign Out of Account
        </MD3Button>
      </div>
    </AndroidMobileLayout>
  );
}
