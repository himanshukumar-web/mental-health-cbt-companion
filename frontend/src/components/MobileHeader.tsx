"use client";

import Link from "next/link";
import ThemeSelector from "@/components/ThemeSelector";
import PatientNotificationBell from "@/components/PatientNotificationBell";
import { useAuth } from "@/contexts/AuthContext";

export default function MobileHeader({ title }: { title?: string }) {
  const { user } = useAuth();

  return (
    <header
      className="mobile-header-bar"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 999,
        background: "rgba(11, 15, 26, 0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border-secondary)",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 16,
      }}
    >
      <style>{`
        @media (min-width: 768px) {
          .mobile-header-bar { display: none !important; }
        }
      `}</style>

      {/* Brand & Page Title */}
      <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            boxShadow: "0 0 12px rgba(34,197,94,0.3)",
          }}
        >
          🌿
        </div>
        <div>
          <span
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              display: "block",
            }}
          >
            {title || "MindMate CBT"}
          </span>
          <span style={{ fontSize: 9, color: "#22c55e", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            MindMate Companion
          </span>
        </div>
      </Link>

      {/* Actions: Notifications, Theme, Crisis */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {user?.id && <PatientNotificationBell userId={user.id} />}
        <ThemeSelector />
        <Link
          href="/chat?prompt=I%20need%20urgent%20crisis%20help"
          style={{
            padding: "6px 10px",
            borderRadius: 10,
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#f87171",
            fontSize: 11,
            fontWeight: 700,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          🆘 <span style={{ display: "inline" }}>Crisis</span>
        </Link>
      </div>
    </header>
  );
}
