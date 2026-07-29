"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ThemeSelector from "@/components/ThemeSelector";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  category: "main" | "wellness" | "tools" | "care";
}

const NAV_ITEMS: NavItem[] = [
  // Main
  { id: "dashboard", label: "Dashboard", icon: "🏠", path: "/dashboard", category: "main" },
  { id: "chat", label: "AI Therapy", icon: "💬", path: "/chat", category: "main" },
  { id: "timeline", label: "Timeline", icon: "📜", path: "/timeline", category: "main" },

  // Wellness
  { id: "mood", label: "Mood Tracker", icon: "😊", path: "/mood", category: "wellness" },
  { id: "journal", label: "Journal", icon: "📝", path: "/journal", category: "wellness" },
  { id: "habits", label: "Habits", icon: "✅", path: "/habits", category: "wellness" },
  { id: "analytics", label: "Analytics", icon: "📊", path: "/analytics", category: "wellness" },

  // Tools
  { id: "meditation", label: "Meditation", icon: "🧘", path: "/meditation", category: "tools" },
  { id: "breathing", label: "Breathing", icon: "🫁", path: "/breathing", category: "tools" },
  { id: "cbt", label: "CBT Tools", icon: "🧠", path: "/cbt", category: "tools" },
  { id: "assessments", label: "Clinical Tests", icon: "📋", path: "/assessments", category: "tools" },

  // Care & Settings
  { id: "appointments", label: "Appointments", icon: "📅", path: "/appointments", category: "care" },
  { id: "profile", label: "Profile", icon: "👤", path: "/profile", category: "care" },
  { id: "settings", label: "Settings", icon: "⚙️", path: "/settings", category: "care" },
];

const CATEGORY_LABELS: Record<string, string> = {
  main: "Main",
  wellness: "Wellness",
  tools: "AI Tools",
  care: "Account & Care",
};

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (!user) return null;

  const categories = ["main", "wellness", "tools", "care"] as const;

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: "fixed",
            top: 12,
            left: 12,
            zIndex: 1001,
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "rgba(17,24,39,0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--border-secondary)",
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          {isOpen ? "✕" : "☰"}
        </button>
      )}

      {/* Backdrop */}
      {isMobile && isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className="custom-scrollbar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 250,
          zIndex: 1000,
          background: "rgba(11, 15, 26, 0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRight: "1px solid var(--border-secondary)",
          display: "flex",
          flexDirection: "column",
          padding: "20px 16px",
          transform: isMobile && !isOpen ? "translateX(-100%)" : "translateX(0)",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowY: "auto",
        }}
      >
        {/* Brand Header */}
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            paddingLeft: 4,
            textDecoration: "none",
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
              color: "#fff",
              boxShadow: "0 0 20px rgba(34,197,94,0.35)",
            }}
          >
            🌿
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              Sera AI
            </div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 500 }}>
              CBT Companion V2
            </div>
          </div>
        </Link>

        {/* Grouped Navigation */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          {categories.map((cat) => {
            const items = NAV_ITEMS.filter((item) => item.category === cat);
            return (
              <div key={cat} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
                  {CATEGORY_LABELS[cat]}
                </div>

                {items.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "9px 12px",
                        borderRadius: 12,
                        textDecoration: "none",
                        fontSize: 13,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? "#22c55e" : "var(--text-secondary)",
                        background: isActive ? "rgba(34,197,94,0.12)" : "transparent",
                        border: isActive ? "1px solid rgba(34,197,94,0.25)" : "1px solid transparent",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{item.icon}</span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {isActive && (
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#22c55e",
                            boxShadow: "0 0 8px #22c55e",
                          }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer Account Section */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid var(--border-secondary)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>Theme</div>
            <ThemeSelector />
          </div>

          <button
            onClick={signOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 12px",
              borderRadius: 12,
              border: "1px solid rgba(239,68,68,0.2)",
              background: "rgba(239,68,68,0.08)",
              color: "#ef4444",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              width: "100%",
            }}
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
