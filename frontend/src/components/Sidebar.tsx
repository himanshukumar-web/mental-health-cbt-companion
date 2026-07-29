"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ThemeSelector from "@/components/ThemeSelector";

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  category: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "🏠", path: "/dashboard", category: "main" },
  { id: "chat", label: "AI Therapy", icon: "💬", path: "/chat", category: "main" },
  { id: "timeline", label: "Timeline", icon: "📜", path: "/timeline", category: "main" },
  { id: "mood", label: "Mood Tracker", icon: "😊", path: "/mood", category: "wellness" },
  { id: "assessments", label: "Clinical Tests", icon: "📋", path: "/assessments", category: "wellness" },
  { id: "journal", label: "Journal", icon: "📝", path: "/journal", category: "wellness" },
  { id: "habits", label: "Habits", icon: "✅", path: "/habits", category: "wellness" },
  { id: "analytics", label: "Analytics", icon: "📊", path: "/analytics", category: "wellness" },
  { id: "cbt", label: "CBT Tools", icon: "🧠", path: "/cbt", category: "tools" },
  { id: "meditation", label: "Meditation", icon: "🧘", path: "/meditation", category: "tools" },
  { id: "breathing", label: "Breathing", icon: "🫁", path: "/breathing", category: "tools" },
  { id: "achievements", label: "Achievements", icon: "🏆", path: "/achievements", category: "tools" },
  { id: "emotions", label: "Emotions", icon: "💭", path: "/emotions", category: "tools" },
  { id: "appointments", label: "Appointments", icon: "📅", path: "/appointments", category: "care" },
  { id: "profile", label: "Profile", icon: "👤", path: "/profile", category: "account" },
  { id: "settings", label: "Settings", icon: "⚙️", path: "/settings", category: "account" },
  { id: "reminders", label: "Reminders", icon: "🔔", path: "/reminders", category: "account" },
];

const CATEGORY_LABELS: Record<string, string> = {
  main: "Main",
  wellness: "Wellness",
  tools: "AI Tools",
  care: "Care",
  account: "Account",
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

  const categories = [...new Set(NAV_ITEMS.map(n => n.category))];

  const sidebarWidth = 260;

  return (
    <>
      {/* Mobile toggle */}
      {isMobile && (
        <button
          id="sidebar-toggle"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: "fixed", top: 16, left: 16, zIndex: 1001,
            width: 42, height: 42, borderRadius: 12,
            background: "var(--bg-glass)", backdropFilter: "blur(12px)",
            border: "0.5px solid var(--border-secondary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            transition: "all 0.2s",
          }}
        >
          {isOpen ? "✕" : "☰"}
        </button>
      )}

      {/* Overlay */}
      {isMobile && isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 999,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            transition: "opacity 0.3s",
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0,
          width: sidebarWidth, zIndex: 1000,
          background: "var(--bg-primary)",
          borderRight: "0.5px solid var(--border-secondary)",
          display: "flex", flexDirection: "column",
          transform: isMobile ? (isOpen ? "translateX(0)" : `translateX(-${sidebarWidth}px)`) : "translateX(0)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* Logo */}
        <div style={{
          padding: "20px 20px 16px",
          display: "flex", alignItems: "center", gap: 10,
          borderBottom: "0.5px solid var(--border-secondary)",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #a7f3d0, #6ee7b7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: "0 0 20px rgba(34,197,94,0.25)",
          }}>🌿</div>
          <div>
            <div style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: 18, color: "var(--text-primary)",
            }}>Sera</div>
            <div style={{ fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>
              CBT Companion
            </div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <ThemeSelector />
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {categories.map(cat => {
            const items = NAV_ITEMS.filter(n => n.category === cat);
            return (
              <div key={cat} style={{ marginBottom: 8 }}>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)",
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  padding: "8px 12px 4px",
                }}>
                  {CATEGORY_LABELS[cat]}
                </div>
                {items.map(item => {
                  const isActive = pathname === item.path ||
                    (item.path === "/appointments" && pathname?.startsWith("/appointments"));
                  return (
                    <button
                      key={item.id}
                      id={`nav-${item.id}`}
                      onClick={() => router.push(item.path)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center",
                        gap: 10, padding: "10px 12px", borderRadius: 10,
                        border: "none", cursor: "pointer",
                        background: isActive ? "rgba(34,197,94,0.1)" : "transparent",
                        color: isActive ? "#22c55e" : "var(--text-secondary)",
                        fontSize: 13, fontWeight: isActive ? 600 : 400,
                        transition: "all 0.15s",
                        textAlign: "left",
                        fontFamily: "var(--font-body)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "var(--bg-secondary)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{item.icon}</span>
                      <span>{item.label}</span>
                      {isActive && (
                        <div style={{
                          marginLeft: "auto", width: 6, height: 6,
                          borderRadius: "50%", background: "#22c55e",
                          boxShadow: "0 0 8px rgba(34,197,94,0.5)",
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div style={{
          padding: "12px 14px", borderTop: "0.5px solid var(--border-secondary)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 0", marginBottom: 8,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, color: "white", fontWeight: 700,
            }}>
              {(user.user_metadata?.full_name || user.email || "U")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: "var(--text-primary)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {user.user_metadata?.full_name || "User"}
              </div>
              <div style={{
                fontSize: 11, color: "var(--text-tertiary)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {user.email}
              </div>
            </div>
          </div>
          <button
            id="sidebar-logout"
            onClick={async () => { await signOut(); router.push("/login"); }}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 8,
              border: "0.5px solid rgba(239,68,68,0.2)",
              background: "rgba(239,68,68,0.06)",
              color: "#fca5a5", fontSize: 12, fontWeight: 500,
              cursor: "pointer", transition: "all 0.2s",
              fontFamily: "var(--font-body)",
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
