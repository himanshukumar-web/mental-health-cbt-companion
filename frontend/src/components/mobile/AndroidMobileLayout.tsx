"use client";

import React, { memo } from "react";

interface AndroidMobileLayoutProps {
  children: React.ReactNode;
  hasBottomNav?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default memo(function AndroidMobileLayout({
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
        transform: "translateZ(0)",
        WebkitOverflowScrolling: "touch",
        ...style,
      }}
    >
      <style>{`
        /* Native Android 60 FPS Hardware Acceleration & Smooth Scroll */
        .android-mobile-root * {
          -webkit-tap-highlight-color: transparent;
          box-sizing: border-box;
        }
        .android-mobile-root {
          -webkit-user-select: none;
          user-select: none;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }
        .android-mobile-root input,
        .android-mobile-root textarea {
          -webkit-user-select: text;
          user-select: text;
        }
        @keyframes md3Spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes md3Shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes md3SlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      {children}
    </div>
  );
});
