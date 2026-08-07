"use client";

import React, { useEffect } from "react";

interface MD3ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function MD3Modal({ isOpen, onClose, title, children, actions }: MD3ModalProps) {
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
        zIndex: 2500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          animation: "md3Fade 0.2s ease-out",
        }}
      />

      {/* Modal Card */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "400px",
          background: "#111827",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "28px",
          padding: "24px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
          animation: "md3ScaleUp 0.25s cubic-bezier(0.2, 0, 0, 1)",
        }}
      >
        {title && (
          <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#e8edf5", margin: "0 0 16px 0", letterSpacing: "-0.01em" }}>
            {title}
          </h3>
        )}

        <div style={{ color: "#8b95a7", fontSize: "14px", lineHeight: 1.6, marginBottom: actions ? "20px" : "0" }}>
          {children}
        </div>

        {actions && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
            {actions}
          </div>
        )}
      </div>

      <style>{`
        @keyframes md3Fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes md3ScaleUp { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
