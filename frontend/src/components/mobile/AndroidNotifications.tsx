"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AndroidMobileLayout from "./AndroidMobileLayout";
import {
  TopAppBar,
  MaterialCard,
  PrimaryButton,
  SecondaryButton,
  Chip,
  Badge,
  EmptyState,
  LoadingSkeleton,
} from "./ui";
import toast from "react-hot-toast";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: "cbt" | "reminder" | "appointment" | "streak";
  timestamp: string;
  icon: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Daily Mindful Check-in",
    message: "Take 2 minutes to reflect on how you're feeling and log your emotional score.",
    category: "cbt",
    timestamp: "10m ago",
    icon: "🌱",
    read: false,
    actionUrl: "/mood",
    actionLabel: "Log Mood",
  },
  {
    id: "notif-2",
    title: "5-Day Streak Maintained! 🔥",
    message: "Amazing consistency! You have completed consecutive wellness activities.",
    category: "streak",
    timestamp: "2h ago",
    icon: "🏆",
    read: false,
    actionUrl: "/progress",
    actionLabel: "View Badges",
  },
  {
    id: "notif-3",
    title: "Doctor Consultation Reminder",
    message: "Your upcoming CBT session with Dr. Sarah Jenkins is scheduled tomorrow.",
    category: "appointment",
    timestamp: "5h ago",
    icon: "🩺",
    read: true,
    actionUrl: "/appointments",
    actionLabel: "View Session",
  },
  {
    id: "notif-4",
    title: "Guided Meditation Ready",
    message: "Wind down with 'Body Scan Relaxation' before sleep.",
    category: "reminder",
    timestamp: "1d ago",
    icon: "🧘",
    read: true,
    actionUrl: "/meditation",
    actionLabel: "Start Meditation",
  },
];

export default function AndroidNotifications() {
  const { user } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "cbt" | "reminder" | "appointment">("all");
  const [loading, setLoading] = useState<boolean>(false);

  const filtered = useMemo(() => {
    if (filter === "all") return notifications;
    return notifications.filter((n) => n.category === filter);
  }, [notifications, filter]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All marked as read");
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success("Notifications cleared");
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    if (item.actionUrl) {
      router.push(item.actionUrl);
    }
  };

  if (loading) {
    return (
      <AndroidMobileLayout hasBottomNav={true}>
        <TopAppBar title="Notifications" subtitle="Reminders & Alerts" showBack={true} />
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <LoadingSkeleton height="70px" />
          <LoadingSkeleton height="70px" />
          <LoadingSkeleton height="70px" />
        </div>
      </AndroidMobileLayout>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AndroidMobileLayout hasBottomNav={true}>
      <TopAppBar
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread updates` : "All caught up"}
        showBack={true}
        actions={
          unreadCount > 0 ? (
            <button
              onClick={markAllRead}
              style={{
                background: "transparent",
                border: "none",
                color: "#4ade80",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                padding: "6px 10px",
                borderRadius: "100px",
              }}
            >
              Mark Read
            </button>
          ) : undefined
        }
      />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Category Filters */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          {[
            { id: "all", label: "All Updates" },
            { id: "cbt", label: "🧠 CBT" },
            { id: "reminder", label: "⏰ Reminders" },
            { id: "appointment", label: "📅 Sessions" },
          ].map((tab) => (
            <Chip
              key={tab.id}
              label={tab.label}
              selected={filter === tab.id}
              onClick={() => setFilter(tab.id as any)}
            />
          ))}
        </div>

        {/* Notifications List */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="No Notifications"
            description="You are all caught up! New reminders and CBT insights will appear here."
            actionLabel="Return to Dashboard"
            onAction={() => router.push("/dashboard")}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filtered.map((item) => (
              <MaterialCard
                key={item.id}
                clickable
                variant={item.read ? "filled" : "elevated"}
                onClick={() => handleNotificationClick(item)}
                style={{
                  background: item.read
                    ? "rgba(255, 255, 255, 0.03)"
                    : "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(17, 24, 39, 0.95) 100%)",
                  borderColor: item.read
                    ? "rgba(255, 255, 255, 0.06)"
                    : "rgba(34, 197, 94, 0.3)",
                  position: "relative",
                  transition: "all 0.2s ease",
                }}
              >
                {!item.read && (
                  <span
                    style={{
                      position: "absolute",
                      top: "14px",
                      right: "14px",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#22c55e",
                      boxShadow: "0 0 6px #22c55e",
                    }}
                  />
                )}

                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background: item.read
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(34, 197, 94, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                      <h3
                        style={{
                          fontSize: "14px",
                          fontWeight: item.read ? 600 : 700,
                          color: item.read ? "#cbd5e1" : "#ffffff",
                          margin: 0,
                        }}
                      >
                        {item.title}
                      </h3>
                      <span style={{ fontSize: "11px", color: "#8b95a7", marginRight: item.read ? 0 : "12px" }}>
                        {item.timestamp}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: "12.5px",
                        color: item.read ? "#8b95a7" : "#cbd5e1",
                        margin: "0 0 8px 0",
                        lineHeight: 1.4,
                      }}
                    >
                      {item.message}
                    </p>

                    {item.actionLabel && (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#4ade80",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {item.actionLabel} →
                      </span>
                    )}
                  </div>
                </div>
              </MaterialCard>
            ))}
          </div>
        )}

        {/* Clear All Footer */}
        {notifications.length > 0 && (
          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <button
              onClick={clearAll}
              style={{
                background: "transparent",
                border: "none",
                color: "#8b95a7",
                fontSize: "12px",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Clear all notifications
            </button>
          </div>
        )}
      </div>
    </AndroidMobileLayout>
  );
}
