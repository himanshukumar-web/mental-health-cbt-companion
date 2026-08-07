"use client";

import React from "react";

export function Avatar({
  src,
  fallback = "👤",
  size = 44,
  online = false,
  onClick,
}: {
  src?: string;
  fallback?: string;
  size?: number;
  online?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #22c55e, #16a34a)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${size * 0.45}px`,
        color: "#ffffff",
        boxShadow: "0 4px 12px rgba(34, 197, 94, 0.25)",
        cursor: onClick ? "pointer" : "default",
        flexShrink: 0,
      }}
    >
      {src ? (
        <img
          src={src}
          alt="Avatar"
          style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
        />
      ) : (
        <span>{fallback}</span>
      )}
      {online && (
        <span
          style={{
            position: "absolute",
            bottom: "2px",
            right: "2px",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: "#22c55e",
            border: "2px solid #0b0f1a",
          }}
        />
      )}
    </div>
  );
}

export function Badge({
  label,
  color = "#22c55e",
  bg = "rgba(34, 197, 94, 0.15)",
}: {
  label: string | number;
  color?: string;
  bg?: string;
}) {
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 700,
        color,
        background: bg,
        padding: "4px 10px",
        borderRadius: "100px",
        display: "inline-block",
        lineHeight: 1,
        letterSpacing: "0.02em",
      }}
    >
      {label}
    </span>
  );
}

export function Chip({
  label,
  selected = false,
  onClick,
  icon,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
        borderRadius: "100px",
        border: selected ? "1.5px solid #22c55e" : "1px solid rgba(255, 255, 255, 0.12)",
        background: selected ? "rgba(34, 197, 94, 0.18)" : "rgba(255, 255, 255, 0.04)",
        color: selected ? "#4ade80" : "#8b95a7",
        fontSize: "13px",
        fontWeight: selected ? 700 : 500,
        cursor: "pointer",
        transition: "all 0.15s ease",
        WebkitTapHighlightColor: "transparent",
        fontFamily: "inherit",
      }}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

export function Tag({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const getStyles = () => {
    switch (variant) {
      case "success":
        return { bg: "rgba(34, 197, 94, 0.12)", color: "#4ade80", border: "rgba(34, 197, 94, 0.3)" };
      case "warning":
        return { bg: "rgba(245, 158, 11, 0.12)", color: "#fbbf24", border: "rgba(245, 158, 11, 0.3)" };
      case "danger":
        return { bg: "rgba(239, 68, 68, 0.12)", color: "#fca5a5", border: "rgba(239, 68, 68, 0.3)" };
      case "info":
        return { bg: "rgba(59, 130, 246, 0.12)", color: "#60a5fa", border: "rgba(59, 130, 246, 0.3)" };
      default:
        return { bg: "rgba(255, 255, 255, 0.06)", color: "#8b95a7", border: "rgba(255, 255, 255, 0.1)" };
    }
  };

  const s = getStyles();

  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 600,
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
        padding: "3px 8px",
        borderRadius: "6px",
        display: "inline-block",
        lineHeight: 1.2,
      }}
    >
      {label}
    </span>
  );
}
