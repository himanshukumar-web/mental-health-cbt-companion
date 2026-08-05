"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--bg-glass)",
          color: "var(--text-primary)",
          border: "0.5px solid var(--border-secondary)",
          backdropFilter: "blur(12px)",
          borderRadius: "14px",
          padding: "14px 18px",
          fontSize: "13px",
          fontFamily: "var(--font-body)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        },
        success: {
          iconTheme: {
            primary: "#22c55e",
            secondary: "white",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "white",
          },
        },
      }}
    />
  );
}
