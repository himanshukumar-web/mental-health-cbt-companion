"use client";

import React from "react";

interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function PrimaryButton({
  fullWidth = false,
  loading = false,
  icon,
  children,
  style,
  disabled,
  ...props
}: BaseButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        minHeight: "48px",
        padding: "12px 24px",
        borderRadius: "100px",
        background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
        color: "#ffffff",
        border: "none",
        fontSize: "14px",
        fontWeight: 600,
        letterSpacing: "0.01em",
        width: fullWidth ? "100%" : "auto",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        boxShadow: "0 4px 14px rgba(34, 197, 94, 0.3)",
        transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1)",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        fontFamily: "inherit",
        ...style,
      }}
      {...props}
    >
      {loading ? <Spinner /> : icon && <span style={{ fontSize: "18px", display: "flex" }}>{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
}

export function SecondaryButton({
  fullWidth = false,
  loading = false,
  icon,
  children,
  style,
  disabled,
  ...props
}: BaseButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        minHeight: "48px",
        padding: "12px 20px",
        borderRadius: "100px",
        background: "rgba(34, 197, 94, 0.12)",
        color: "#4ade80",
        border: "1px solid rgba(34, 197, 94, 0.25)",
        fontSize: "14px",
        fontWeight: 600,
        letterSpacing: "0.01em",
        width: fullWidth ? "100%" : "auto",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1)",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        fontFamily: "inherit",
        ...style,
      }}
      {...props}
    >
      {loading ? <Spinner color="#4ade80" /> : icon && <span style={{ fontSize: "18px", display: "flex" }}>{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
}

export function OutlinedButton({
  fullWidth = false,
  loading = false,
  icon,
  children,
  style,
  disabled,
  ...props
}: BaseButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        minHeight: "48px",
        padding: "12px 20px",
        borderRadius: "100px",
        background: "transparent",
        color: "#e8edf5",
        border: "1px solid rgba(255, 255, 255, 0.18)",
        fontSize: "14px",
        fontWeight: 600,
        letterSpacing: "0.01em",
        width: fullWidth ? "100%" : "auto",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1)",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        fontFamily: "inherit",
        ...style,
      }}
      {...props}
    >
      {loading ? <Spinner color="#e8edf5" /> : icon && <span style={{ fontSize: "18px", display: "flex" }}>{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
}

export function DangerButton({
  fullWidth = false,
  loading = false,
  icon,
  children,
  style,
  disabled,
  ...props
}: BaseButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        minHeight: "48px",
        padding: "12px 20px",
        borderRadius: "100px",
        background: "rgba(239, 68, 68, 0.15)",
        color: "#fca5a5",
        border: "1px solid rgba(239, 68, 68, 0.35)",
        fontSize: "14px",
        fontWeight: 600,
        width: fullWidth ? "100%" : "auto",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1)",
        WebkitTapHighlightColor: "transparent",
        fontFamily: "inherit",
        ...style,
      }}
      {...props}
    >
      {loading ? <Spinner color="#ef4444" /> : icon && <span style={{ fontSize: "18px", display: "flex" }}>{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
}

export function IconButton({
  icon,
  style,
  disabled,
  ...props
}: {
  icon: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      disabled={disabled}
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        background: "rgba(255, 255, 255, 0.08)",
        border: "none",
        color: "#e8edf5",
        fontSize: "18px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s ease",
        WebkitTapHighlightColor: "transparent",
        flexShrink: 0,
        ...style,
      }}
      {...props}
    >
      {icon}
    </button>
  );
}

export function FAB({
  icon = "✏️",
  label,
  style,
  ...props
}: {
  icon?: React.ReactNode;
  label?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      style={{
        minWidth: "56px",
        height: "56px",
        borderRadius: "16px",
        background: "linear-gradient(135deg, #22c55e, #16a34a)",
        color: "#ffffff",
        border: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: label ? "0 20px" : "0 16px",
        fontSize: "15px",
        fontWeight: 700,
        boxShadow: "0 8px 24px rgba(34, 197, 94, 0.35)",
        cursor: "pointer",
        transition: "transform 0.15s ease, boxShadow 0.15s ease",
        WebkitTapHighlightColor: "transparent",
        fontFamily: "inherit",
        ...style,
      }}
      {...props}
    >
      <span style={{ fontSize: "20px", display: "flex", alignItems: "center" }}>{icon}</span>
      {label && <span>{label}</span>}
    </button>
  );
}

function Spinner({ color = "#ffffff" }: { color?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: "18px",
        height: "18px",
        border: `2px solid ${color}`,
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "md3Spin 0.7s linear infinite",
      }}
    />
  );
}
