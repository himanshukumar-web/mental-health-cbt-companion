"use client";

import { useAuth, type AppTheme } from "@/contexts/AuthContext";

export default function ThemeSelector() {
  const { theme, setTheme } = useAuth();

  const themes: { id: AppTheme; label: string; icon: string; activeColor: string }[] = [
    { id: "default", label: "Default", icon: "✨", activeColor: "#10b981" },
    { id: "light", label: "Light", icon: "☀️", activeColor: "#f59e0b" },
    { id: "dark", label: "Dark", icon: "🌙", activeColor: "#6366f1" },
  ];

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      background: "var(--bg-glass)",
      border: "0.5px solid var(--border-secondary)",
      borderRadius: 12,
      padding: 3,
    }}>
      {themes.map((t) => {
        const isActive = theme === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            title={`${t.label} Theme`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 9,
              border: "none",
              background: isActive ? "var(--bg-glass-hover)" : "transparent",
              color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {t.icon}
          </button>
        );
      })}
    </div>
  );
}
