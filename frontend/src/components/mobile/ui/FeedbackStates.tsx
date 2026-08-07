"use client";

import React from "react";
import { MD3Button } from "./Button";

export function MD3EmptyState({
  icon = "🌿",
  title = "No data yet",
  description = "Start your journey by adding your first entry.",
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
        <MD3Button variant="tonal" onClick={onAction}>
          {actionLabel}
        </MD3Button>
      )}
    </div>
  );
}

export function MD3LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        minHeight: "200px",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          border: "3px solid rgba(34, 197, 94, 0.2)",
          borderTopColor: "#22c55e",
          borderRadius: "50%",
          animation: "md3Spin 0.8s linear infinite",
          marginBottom: "16px",
        }}
      />
      <span style={{ fontSize: "14px", color: "#8b95a7", fontWeight: 500 }}>{message}</span>
      <style>{`
        @keyframes md3Spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export function MD3ErrorState({
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
        background: "rgba(239, 68, 68, 0.1)",
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
        <MD3Button variant="text" onClick={onRetry} style={{ color: "#ef4444", padding: "4px 8px" }}>
          Retry
        </MD3Button>
      )}
    </div>
  );
}
