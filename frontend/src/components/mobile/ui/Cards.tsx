"use client";

import React, { memo } from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "elevated" | "filled" | "outlined";
  clickable?: boolean;
  children: React.ReactNode;
}

export const MaterialCard = memo(function MaterialCard({
  variant = "filled",
  clickable = false,
  children,
  style,
  onClick,
  ...props
}: CardProps) {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case "elevated":
        return {
          background: "linear-gradient(145deg, #182234 0%, #0f172a 100%)",
          border: "0.5px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
        };
      case "filled":
        return {
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.07)",
          boxShadow: "none",
        };
      case "outlined":
        return {
          background: "transparent",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "none",
        };
      default:
        return {};
    }
  };

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: "20px",
        padding: "16px 20px",
        cursor: clickable || onClick ? "pointer" : "default",
        transform: "translateZ(0)",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        contain: "content",
        ...getVariantStyles(),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
});

export const SectionCard = memo(function SectionCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#e8edf5", margin: 0 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: "12px", color: "#8b95a7", margin: "2px 0 0 0" }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
});

export const MoodCard = memo(function MoodCard({
  emoji,
  score,
  label,
  date,
  notes,
  onClick,
}: {
  emoji: string;
  score: number;
  label?: string;
  date?: string;
  notes?: string;
  onClick?: () => void;
}) {
  return (
    <MaterialCard variant="filled" clickable={!!onClick} onClick={onClick} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "28px" }}>{emoji}</span>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#e8edf5" }}>
            Score: {score}/10 {label ? `• ${label}` : ""}
          </div>
          {notes && <div style={{ fontSize: "12px", color: "#8b95a7", marginTop: "2px" }}>{notes}</div>}
        </div>
      </div>
      {date && <span style={{ fontSize: "11px", color: "#8b95a7" }}>{date}</span>}
    </MaterialCard>
  );
});

export const JournalCard = memo(function JournalCard({
  title,
  content,
  date,
  onClick,
}: {
  title: string;
  content: string;
  date?: string;
  onClick?: () => void;
}) {
  return (
    <MaterialCard variant="filled" clickable={!!onClick} onClick={onClick}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#e8edf5", margin: 0 }}>{title || "Untitled Entry"}</h3>
        {date && <span style={{ fontSize: "11px", color: "#8b95a7" }}>{date}</span>}
      </div>
      <p style={{ fontSize: "13px", color: "#8b95a7", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {content}
      </p>
    </MaterialCard>
  );
});

export const TherapistCard = memo(function TherapistCard({
  name,
  title,
  specialty,
  rating,
  avatar = "🩺",
  onBook,
}: {
  name: string;
  title: string;
  specialty: string;
  rating?: string;
  avatar?: string;
  onBook?: () => void;
}) {
  return (
    <MaterialCard variant="filled" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "16px",
            background: "rgba(59, 130, 246, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            flexShrink: 0,
          }}
        >
          {avatar}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#e8edf5" }}>{name}</div>
          <div style={{ fontSize: "12px", color: "#8b95a7" }}>{title}</div>
          <div style={{ fontSize: "11px", color: "#3b82f6", marginTop: "2px" }}>{specialty} {rating ? `• ${rating}` : ""}</div>
        </div>
      </div>
      {onBook && (
        <button
          onClick={onBook}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "100px",
            background: "rgba(59, 130, 246, 0.15)",
            color: "#60a5fa",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Book Session
        </button>
      )}
    </MaterialCard>
  );
});

export const QuickActionCard = memo(function QuickActionCard({
  icon,
  title,
  subtitle,
  bg = "rgba(34, 197, 94, 0.15)",
  onClick,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  bg?: string;
  onClick?: () => void;
}) {
  return (
    <MaterialCard
      clickable
      variant="filled"
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "100px",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          marginBottom: "12px",
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#e8edf5" }}>{title}</div>
        {subtitle && <div style={{ fontSize: "11px", color: "#8b95a7", marginTop: "2px" }}>{subtitle}</div>}
      </div>
    </MaterialCard>
  );
});

export const StatCard = memo(function StatCard({
  label,
  value,
  subtext,
  icon,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: string;
}) {
  return (
    <MaterialCard variant="filled">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: "12px", color: "#8b95a7", fontWeight: 600 }}>{label}</span>
        {icon && <span style={{ fontSize: "16px" }}>{icon}</span>}
      </div>
      <div style={{ fontSize: "24px", fontWeight: 800, color: "#4ade80", marginTop: "4px" }}>
        {value}
      </div>
      {subtext && <span style={{ fontSize: "11px", color: "#8b95a7" }}>{subtext}</span>}
    </MaterialCard>
  );
});
