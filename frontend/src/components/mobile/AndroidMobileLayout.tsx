"use client";

import React from "react";

interface AndroidMobileLayoutProps {
  children: React.ReactNode;
  hasBottomNav?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function AndroidMobileLayout({
  children,
  hasBottomNav = true,
  className = "",
  style,
}: AndroidMobileLayoutProps) {
  return (
    <div
      className={`android-mobile-root ${className}`}
      style={{
        minHeight: "100vh",
        background: "#0b0f1a",
        color: "#e8edf5",
        fontFamily: "'Outfit', 'Inter', -apple-system, Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflowX: "hidden",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: hasBottomNav
          ? "calc(80px + env(safe-area-inset-bottom, 0px))"
          : "env(safe-area-inset-bottom, 0px)",
        boxSizing: "border-box",
        ...style,
      }}
    >
      <style>{`
        /* Native Android Scrollbar & Tap behavior */
        .android-mobile-root * {
          -webkit-tap-highlight-color: transparent;
          box-sizing: border-box;
        }
        .android-mobile-root {
          -webkit-user-select: none;
          user-select: none;
        }
        .android-mobile-root input,
        .android-mobile-root textarea {
          -webkit-user-select: text;
          user-select: text;
        }
      `}</style>
      {children}
    </div>
  );
}
