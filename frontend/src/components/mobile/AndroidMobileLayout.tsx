"use client";

import React, { memo, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface AndroidMobileLayoutProps {
  children: React.ReactNode;
  hasBottomNav?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const scrollPositionMap = new Map<string, number>();

export default memo(function AndroidMobileLayout({
  children,
  hasBottomNav = true,
  className = "",
  style,
}: AndroidMobileLayoutProps) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && pathname) {
      const saved = scrollPositionMap.get(pathname);
      if (typeof saved === "number" && saved > 0) {
        containerRef.current.scrollTop = saved;
      }
    }
  }, [pathname]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (pathname) {
      scrollPositionMap.set(pathname, e.currentTarget.scrollTop);
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`android-mobile-root ${className}`}
      style={{
        height: "100dvh",
        minHeight: 0,
        width: "100%",
        maxWidth: "100vw",
        background: "#0b0f1a",
        color: "#e8edf5",
        fontFamily: "'Outfit', 'Inter', -apple-system, Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflowX: "hidden",
        overflowY: "auto",
        overscrollBehaviorY: "contain",
        // This is the sole vertical scroll owner for standard Android screens.
        // Keeping safe-area padding here prevents every page from having to
        // guess at status-bar and BottomNav offsets.
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: hasBottomNav
          ? "calc(88px + env(safe-area-inset-bottom, 0px))"
          : "calc(24px + env(safe-area-inset-bottom, 0px))",
        boxSizing: "border-box",
        transform: "translateZ(0)",
        WebkitOverflowScrolling: "touch",
        ...style,
      }}
    >
      <style>{`
        /* Native Android 60 FPS Hardware Acceleration & Edge-to-Edge Layout */
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
