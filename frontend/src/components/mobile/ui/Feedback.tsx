"use client";

import React from "react";
import { PrimaryButton } from "./Buttons";

export function SnackBar({
  message,
  actionLabel,
  onAction,
  type = "info",
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  type?: "info" | "success" | "error";
}) {
  const getBg = () => {
    switch (type) {
      case "success":
        return "rgba(34, 197, 94, 0.9)";
      case "error":
        return "rgba(239, 68, 68, 0.9)";
      default:
        return "#1e293b";
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(88px + env(safe-area-inset-bottom, 0px))",
        left: "16px",
        right: "16px",
        zIndex: 2200,
        background: getBg(),
        color: "#ffffff",
        padding: "14px 18px",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
        fontSize: "14px",
        fontWeight: 500,
        animation: "md3SlideUp 0.25s ease-out",
      }}
    >
      <span>{message}</span>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            background: "none",
            border: "none",
            color: "#ffffff",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function LoadingSkeleton({
  height = "48px",
  borderRadius = "16px",
  style,
}: {
  height?: string;
  borderRadius?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width: "100%",
        height,
        borderRadius,
        background: "linear-gradient(90deg, rgba(255, 255, 255, 0.04) 25%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.04) 75%)",
        backgroundSize: "200% 100%",
        animation: "md3Shimmer 1.5s infinite linear",
        ...style,
      }}
    />
  );
}

export function ProgressRing({
  progress = 75,
  size = 64,
  strokeWidth = 6,
  color = "#22c55e",
}: {
  progress?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <span style={{ position: "absolute", fontSize: "12px", fontWeight: 800, color: "#e8edf5" }}>
        {Math.round(progress)}%
      </span>
    </div>
  );
}

export function EmptyState({
  icon = "🌿",
  title = "No items yet",
  description = "Get started by creating your first entry.",
  actionLabel,
  onAction,
}: {
  icon?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "48px",
          marginBottom: "16px",
          width: "80px",
          height: "80px",
          borderRadius: "24px",
          background: "rgba(34, 197, 94, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#e8edf5", margin: "0 0 8px 0" }}>{title}</h3>
      <p style={{ fontSize: "14px", color: "#8b95a7", margin: "0 0 20px 0", maxWidth: "280px", lineHeight: 1.5 }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <PrimaryButton onClick={onAction}>
          {actionLabel}
        </PrimaryButton>
      )}
    </div>
  );
}

export function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      style={{
        padding: "16px 20px",
        borderRadius: "16px",
        background: "rgba(239, 68, 68, 0.12)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        margin: "16px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "20px" }}>⚠️</span>
        <span style={{ fontSize: "14px", color: "#fca5a5", fontWeight: 500 }}>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: "none",
            border: "none",
            color: "#ef4444",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
