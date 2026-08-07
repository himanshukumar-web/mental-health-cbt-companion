"use client";

import React, { useEffect } from "react";

interface MD3BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function MD3BottomSheet({ isOpen, onClose, title, children }: MD3BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          animation: "md3Fade 0.25s ease-out",
        }}
      />

      {/* Sheet surface */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          background: "#111827",
          borderTopLeftRadius: "28px",
          borderTopRightRadius: "28px",
          borderTop: "1px solid rgba(255, 255, 255, 0.12)",
          padding: "16px 20px calc(24px + env(safe-area-inset-bottom, 0px)) 20px",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.5)",
          animation: "md3SlideUp 0.3s cubic-bezier(0.2, 0, 0, 1)",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "rgba(255, 255, 255, 0.25)" }} />
        </div>

        {title && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#e8edf5", margin: 0 }}>{title}</h3>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                color: "#8b95a7",
                fontSize: "16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {children}
      </div>

      <style>{`
        @keyframes md3Fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes md3SlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
