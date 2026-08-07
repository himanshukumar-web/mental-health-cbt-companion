"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AndroidMobileLayout from "./AndroidMobileLayout";
import {
  TopAppBar,
  MaterialCard,
  ListItem,
  OutlinedButton,
  Avatar,
  Badge,
} from "./ui";

export default function AndroidProfile() {
  const { user, userRole, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <AndroidMobileLayout>
      <TopAppBar title="Profile & Account" showBack={false} />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* User Card */}
        <MaterialCard variant="elevated" style={{ textAlign: "center", padding: "24px 16px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
            <Avatar
              fallback={user?.user_metadata?.full_name ? user.user_metadata.full_name[0].toUpperCase() : "👤"}
              size={72}
            />
          </div>

          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#e8edf5", margin: "0 0 4px 0" }}>
            {user?.user_metadata?.full_name || "Valued User"}
          </h2>
          <p style={{ fontSize: "13px", color: "#8b95a7", margin: "0 0 12px 0" }}>{user?.email}</p>

          <Badge
            label={userRole === "admin" ? "🩺 DOCTOR / ADMIN" : "👤 PATIENT"}
            color={userRole === "admin" ? "#fbbf24" : "#4ade80"}
            bg={userRole === "admin" ? "rgba(245, 158, 11, 0.15)" : "rgba(34, 197, 94, 0.15)"}
          />
        </MaterialCard>

        {/* Quick Menu Options */}
        <MaterialCard variant="filled" style={{ padding: "4px 0" }}>
          <ListItem
            leading="⚙️"
            headline="Application Settings"
            supportingText="Preferences, notifications & dark mode"
            trailing="➔"
            divider
            onClick={() => router.push("/settings")}
          />
          <ListItem
            leading="📊"
            headline="Personal Progress"
            supportingText="Level, badges & CBT worksheet stats"
            trailing="➔"
            divider
            onClick={() => router.push("/progress")}
          />
          <ListItem
            leading="🛡️"
            headline="Privacy & Safety"
            supportingText="Data encryption & emergency helplines"
            trailing="➔"
          />
        </MaterialCard>

        {/* Sign Out Button */}
        <OutlinedButton fullWidth onClick={handleSignOut} style={{ borderColor: "rgba(239, 68, 68, 0.4)", color: "#ef4444", marginTop: "12px" }}>
          Sign Out of Account
        </OutlinedButton>
      </div>
    </AndroidMobileLayout>
  );
}
