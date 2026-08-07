"use client";

import React, { useState } from "react";

interface MD3InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export function MD3Input({
  label,
  error,
  leadingIcon,
  trailingIcon,
  value,
  onChange,
  type = "text",
  placeholder,
  style,
  onFocus,
  onBlur,
  ...props
}: MD3InputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const actualType = isPassword && showPassword ? "text" : type;
  const isFilled = value !== undefined && value !== null && String(value).length > 0;
  const isFloating = focused || isFilled;

  return (
    <div style={{ marginBottom: "16px", width: "100%" }}>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          background: focused ? "rgba(34, 197, 94, 0.08)" : "rgba(255, 255, 255, 0.05)",
          borderRadius: "16px",
          border: error
            ? "1.5px solid #ef4444"
            : focused
            ? "1.5px solid #22c55e"
            : "1px solid rgba(255, 255, 255, 0.12)",
          padding: "0 16px",
          height: "56px",
          transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1)",
          boxSizing: "border-box",
        }}
      >
        {leadingIcon && (
          <span style={{ marginRight: "12px", color: error ? "#ef4444" : focused ? "#22c55e" : "#8b95a7", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {leadingIcon}
          </span>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", height: "100%" }}>
          <label
            style={{
              position: "absolute",
              top: isFloating ? "8px" : "18px",
              left: 0,
              fontSize: isFloating ? "11px" : "14px",
              fontWeight: isFloating ? 600 : 500,
              color: error ? "#fca5a5" : focused ? "#4ade80" : "#8b95a7",
              transition: "all 0.18s cubic-bezier(0.2, 0, 0, 1)",
              pointerEvents: "none",
              lineHeight: 1,
            }}
          >
            {label}
          </label>
          <input
            type={actualType}
            value={value}
            onChange={onChange}
            placeholder={focused ? placeholder : ""}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#e8edf5",
              fontSize: "15px",
              fontWeight: 500,
              fontFamily: "inherit",
              paddingTop: isFloating ? "16px" : "0px",
              margin: 0,
              boxSizing: "border-box",
              ...style,
            }}
            {...props}
          />
        </div>

        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              background: "none",
              border: "none",
              color: "#8b95a7",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              padding: "4px 8px",
              marginLeft: "4px",
              flexShrink: 0,
            }}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        ) : (
          trailingIcon && (
            <span style={{ marginLeft: "8px", color: "#8b95a7", fontSize: "18px", display: "flex", flexShrink: 0 }}>
              {trailingIcon}
            </span>
          )
        )}
      </div>
      {error && (
        <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px", display: "block", paddingLeft: "12px" }}>
          {error}
        </span>
      )}
    </div>
  );
}
