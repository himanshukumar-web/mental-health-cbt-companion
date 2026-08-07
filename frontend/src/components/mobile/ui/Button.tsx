"use client";

import React from "react";

interface MD3ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "tonal" | "outlined" | "text" | "fab";
  icon?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
}

export function MD3Button({
  variant = "filled",
  icon,
  fullWidth = false,
  loading = false,
  children,
  disabled,
  className = "",
  style,
  ...props
}: MD3ButtonProps) {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case "filled":
        return {
          background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
          color: "#ffffff",
          border: "none",
          boxShadow: "0 4px 14px rgba(34, 197, 94, 0.25)",
        };
      case "tonal":
        return {
          background: "rgba(34, 197, 94, 0.12)",
          color: "#4ade80",
          border: "1px solid rgba(34, 197, 94, 0.25)",
          boxShadow: "none",
        };
      case "outlined":
        return {
          background: "transparent",
          color: "#e8edf5",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          boxShadow: "none",
        };
      case "text":
        return {
          background: "transparent",
          color: "#4ade80",
          border: "none",
          padding: "8px 12px",
          boxShadow: "none",
        };
      case "fab":
        return {
          background: "linear-gradient(135deg, #22c55e, #16a34a)",
          color: "#ffffff",
          border: "none",
          borderRadius: "16px",
          minWidth: "56px",
          height: "56px",
          padding: "0 16px",
          boxShadow: "0 8px 24px rgba(34, 197, 94, 0.35)",
        };
      default:
        return {};
    }
  };

  return (
    <button
      disabled={disabled || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        height: variant === "fab" ? "56px" : "52px",
        minHeight: variant === "fab" ? "56px" : "52px",
        padding: variant === "fab" ? "0 20px" : "0 24px",
        borderRadius: variant === "fab" ? "16px" : "100px",
        fontSize: "15px",
        fontWeight: 600,
        letterSpacing: "0.01em",
        width: fullWidth ? "100%" : "auto",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s cubic-bezier(0.2, 0, 0, 1)",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        userSelect: "none",
        fontFamily: "inherit",
        boxSizing: "border-box",
        ...getVariantStyles(),
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <span
          style={{
            display: "inline-block",
            width: "18px",
            height: "18px",
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "md3Spin 0.7s linear infinite",
          }}
        />
      ) : (
        icon && <span style={{ fontSize: "18px", display: "flex", alignItems: "center" }}>{icon}</span>
      )}
      {children && <span>{children}</span>}
      <style>{`
        button:active {
          transform: scale(0.98);
        }
        @keyframes md3Spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
