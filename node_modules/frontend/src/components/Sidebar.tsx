"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ThemeSelector from "@/components/ThemeSelector";
import GlobalSearch from "@/components/GlobalSearch";
import { motion } from "framer-motion";

interface NavGroup {
  category: string;
  items: {
    label: string;
    icon: string;
    path: string;
    badge?: string;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    category: "Overview",
    items: [
      { label: "Dashboard", icon: "🏠", path: "/dashboard" },
    ],
  },
  {
    category: "AI Therapy",
    items: [
      { label: "AI Therapy Chat", icon: "🤖", path: "/chat", badge: "AI" },
    ],
  },
  {
    category: "Progress & Goals",
    items: [
      { label: "Progress Hub", icon: "📊", path: "/progress" },
      { label: "Activity Heatmap", icon: "📜", path: "/timeline" },
      { label: "Wellness Analytics", icon: "📈", path: "/analytics" },
      { label: "Achievements & XP", icon: "🏆", path: "/achievements" },
    ],
  },
  {
    category: "Wellness Log",
    items: [
      { label: "Wellness Hub", icon: "🧘", path: "/wellness" },
      { label: "Mood Tracker", icon: "😊", path: "/mood" },
      { label: "Voice Journal", icon: "📝", path: "/journal" },
      { label: "Habit Tracker", icon: "✅", path: "/habits" },
    ],
  },
  {
    category: "AI Tools & Exercises",
    items: [
      { label: "Mindful Meditation", icon: "🎧", path: "/meditation" },
      { label: "Breathing Exercises", icon: "🫁", path: "/breathing" },
      { label: "CBT Worksheets", icon: "🧠", path: "/cbt" },
      { label: "Clinical Tests", icon: "📋", path: "/assessments" },
    ],
  },
  {
    category: "Care & Account",
    items: [
      { label: "Appointments", icon: "📅", path: "/appointments" },
      { label: "User Profile", icon: "👤", path: "/profile" },
      { label: "Settings", icon: "⚙️", path: "/settings" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, userRole, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <aside
      className="custom-scrollbar desktop-sidebar"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: 250,
        zIndex: 1000,
        background: "rgba(11, 15, 26, 0.94)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid var(--border-secondary)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 16px",
      }}
    >
      <style>{`
        @media (max-width: 767px) {
          .desktop-sidebar { display: none !important; }
        }
      `}</style>

      {/* Brand Logo Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 8px 20px",
          borderBottom: "1px solid var(--border-secondary)",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            boxShadow: "0 0 16px rgba(34,197,94,0.4)",
          }}
        >
          🌿
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            Sera CBT
          </div>
          <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            AI Companion
          </div>
        </div>
      </div>

      {/* Global Search Trigger Button */}
      <button
        onClick={() => setSearchOpen(true)}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: 12,
          background: "var(--bg-glass)",
          border: "1px solid var(--border-secondary)",
          color: "var(--text-secondary)",
          fontSize: 12,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          marginBottom: 16,
          transition: "all 0.15s ease",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>🔍</span>
          <span>Global Search...</span>
        </span>
        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: "var(--bg-secondary)", color: "var(--text-tertiary)" }}>
          ⌘K
        </span>
      </button>

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} userId={user?.id} />

      {/* Navigation Links Grouped */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          paddingRight: 4,
        }}
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.category} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                letterSpacing: "0.08em",
                padding: "0 8px 4px",
              }}
            >
              {group.category}
            </div>

            {group.items.map((item) => {
              const targetPath = (userRole === "admin" && item.path === "/appointments")
                ? "/admin?tab=appointments"
                : item.path;
              const targetLabel = (userRole === "admin" && item.path === "/appointments")
                ? "Patient Appointments"
                : item.label;
              const isActive = pathname === targetPath || (item.path === "/appointments" && pathname.startsWith("/admin"));

              return (
                <Link
                  key={item.path}
                  href={targetPath}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px",
                    borderRadius: 12,
                    textDecoration: "none",
                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 13,
                    background: isActive ? "rgba(34,197,94,0.12)" : "transparent",
                    border: isActive ? "1px solid rgba(34,197,94,0.3)" : "1px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <span>{targetLabel}</span>
                  </div>

                  {item.badge && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        padding: "2px 6px",
                        borderRadius: 6,
                        background: "rgba(34,197,94,0.2)",
                        color: "#22c55e",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}

                  {isActive && (
                    <motion.div
                      layoutId="activeSideDot"
                      style={{
                        position: "absolute",
                        left: -16,
                        width: 4,
                        height: 18,
                        borderRadius: "0 4px 4px 0",
                        background: "#22c55e",
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {userRole === "admin" && (
          <div style={{ paddingTop: 8 }}>
            <Link
              href="/admin"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 12,
                textDecoration: "none",
                color: "#f59e0b",
                fontWeight: 700,
                fontSize: 13,
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.3)",
              }}
            >
              <span>🩺</span>
              <span>Doctor Portal</span>
            </Link>
          </div>
        )}
      </div>

      {/* Footer Profile & Theme Bar */}
      <div
        style={{
          paddingTop: 16,
          borderTop: "1px solid var(--border-secondary)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginTop: 12,
        }}
      >
        <ThemeSelector />

        {user && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
              {user.email}
            </div>
            <button
              onClick={() => signOut()}
              title="Sign Out"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-tertiary)",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              🚪
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
