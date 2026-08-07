"use client";

import React, { useState } from "react";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export function TextField({
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
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const actualType = isPassword && showPassword ? "text" : type;

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
          padding: "8px 14px",
          minHeight: "56px",
          transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1)",
        }}
      >
        {leadingIcon && (
          <span style={{ marginRight: "10px", color: focused ? "#22c55e" : "#8b95a7", fontSize: "18px", display: "flex" }}>
            {leadingIcon}
          </span>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <label
            style={{
              fontSize: focused || value ? "11px" : "14px",
              fontWeight: 500,
              color: error ? "#fca5a5" : focused ? "#22c55e" : "#8b95a7",
              transition: "all 0.15s ease",
              pointerEvents: "none",
              lineHeight: 1.2,
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
              paddingTop: "2px",
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
            }}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        ) : (
          trailingIcon && (
            <span style={{ marginLeft: "8px", color: "#8b95a7", fontSize: "18px", display: "flex" }}>
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

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  onClear,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  onClear?: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "100px",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        padding: "4px 16px",
        minHeight: "48px",
        width: "100%",
        marginBottom: "16px",
      }}
    >
      <span style={{ marginRight: "10px", color: "#8b95a7", fontSize: "18px" }}>🔍</span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          color: "#e8edf5",
          fontSize: "14px",
          fontFamily: "inherit",
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            if (onClear) onClear();
            else onChange({ target: { value: "" } } as any);
          }}
          style={{
            background: "none",
            border: "none",
            color: "#8b95a7",
            fontSize: "14px",
            cursor: "pointer",
            padding: "4px",
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
