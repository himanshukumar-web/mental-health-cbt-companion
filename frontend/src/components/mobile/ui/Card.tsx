"use client";

import React from "react";

interface MD3CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "elevated" | "filled" | "outlined";
  children: React.ReactNode;
  clickable?: boolean;
}

export function MD3Card({
  variant = "filled",
  children,
  clickable = false,
  style,
  onClick,
  ...props
}: MD3CardProps) {
  const getStyles = (): React.CSSProperties => {
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
        cursor: clickable ? "pointer" : "default",
        transition: "transform 0.15s ease, background 0.2s ease, border-color 0.2s ease",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        ...getStyles(),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
