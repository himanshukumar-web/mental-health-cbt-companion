"use client";

import React from "react";

interface MD3ListItemProps {
  headline: string;
  supportingText?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  divider?: boolean;
}

export function MD3ListItem({
  headline,
  supportingText,
  leading,
  trailing,
  onClick,
  divider = false,
}: MD3ListItemProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "14px 16px",
        minHeight: "56px",
        background: "transparent",
        borderBottom: divider ? "1px solid rgba(255, 255, 255, 0.07)" : "none",
        cursor: onClick ? "pointer" : "default",
        transition: "background 0.15s ease",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
    >
      {leading && (
        <div
          style={{
            marginRight: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#4ade80",
            fontSize: "20px",
            flexShrink: 0,
          }}
        >
          {leading}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0, paddingRight: trailing ? "12px" : "0" }}>
        <div style={{ fontSize: "15px", fontWeight: 600, color: "#e8edf5", lineHeight: 1.3 }}>{headline}</div>
        {supportingText && (
          <div style={{ fontSize: "13px", color: "#8b95a7", marginTop: "2px", lineHeight: 1.4 }}>
            {supportingText}
          </div>
        )}
      </div>

      {trailing && <div style={{ flexShrink: 0, color: "#8b95a7", fontSize: "14px" }}>{trailing}</div>}
    </div>
  );
}
