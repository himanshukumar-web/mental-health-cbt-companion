"use client";

import AndroidNotifications from "@/components/mobile/AndroidNotifications";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import PatientNotificationBell from "@/components/PatientNotificationBell";
import { useIsAndroid } from "@/hooks/useIsAndroid";
import { useAuth } from "@/contexts/AuthContext";

function DesktopNotificationsView() {
  const { user } = useAuth();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Sidebar />
      <main className="app-main-layout" style={{ padding: "24px 20px" }}>
        <MobileHeader title="Notifications" />
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
            Your Notifications 🔔
          </h1>
          <PatientNotificationBell userId={user?.id || ""} />
        </div>
      </main>
    </div>
  );
}

export default function NotificationsPage() {
  const isAndroid = useIsAndroid();

  if (isAndroid) {
    return <AndroidNotifications />;
  }

  return <DesktopNotificationsView />;
}
