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
    <div className="theme-selector-container">
      {themes.map((t) => {
        const isActive = theme === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            title={`${t.label} Theme`}
            className={`theme-selector-btn ${isActive ? "active" : ""}`}
          >
            {t.icon}
          </button>
        );
      })}
    </div>
  );
}
