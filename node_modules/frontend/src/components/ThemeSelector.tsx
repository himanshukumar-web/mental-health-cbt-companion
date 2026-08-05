"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function ThemeSelector() {
  const { theme, setTheme } = useAuth();

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  const isLight = theme === "light";

  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${isLight ? "dark" : "light"} theme`}
      className="theme-toggle-btn"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {isLight ? "🌙" : "☀️"}
    </button>
  );
}
