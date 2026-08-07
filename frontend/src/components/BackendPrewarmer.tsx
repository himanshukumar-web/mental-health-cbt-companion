"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const RENDER_BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://mental-health-cbt-companion.onrender.com";
const KEEP_ALIVE_INTERVAL = 3.5 * 60 * 1000; // 3.5 minutes

export default function BackendPrewarmer() {
  const [status, setStatus] = useState<"idle" | "waking" | "ready">("idle");
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;
    let keepAliveTimer: NodeJS.Timeout | null = null;

    const wakeUpBackend = async () => {
      const timeoutNotice = setTimeout(() => {
        if (isMounted) {
          setStatus("waking");
        }
      }, 1200);

      try {
        const res = await fetch(`${RENDER_BACKEND_URL}/health`, { mode: "cors" });
        clearTimeout(timeoutNotice);
        if (res.ok && isMounted) {
          setStatus("ready");
          setTimeout(() => {
            if (isMounted) setStatus("idle");
          }, 3500);
        }
      } catch {
        clearTimeout(timeoutNotice);
        if (isMounted) {
          setTimeout(wakeUpBackend, 3000);
        }
      }
    };

    wakeUpBackend();

    keepAliveTimer = setInterval(() => {
      fetch(`${RENDER_BACKEND_URL}/health`, { mode: "cors" }).catch(() => {});
    }, KEEP_ALIVE_INTERVAL);

    return () => {
      isMounted = false;
      if (keepAliveTimer) clearInterval(keepAliveTimer);
    };
  }, []);

  // Hide warm-up loader on unauthenticated pages (Login, Signup, Splash)
  if (
    !user ||
    !pathname ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/role-select"
  ) {
    return null;
  }

  return (
    <AnimatePresence>
      {status === "waking" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            padding: "10px 16px",
            borderRadius: 14,
            background: "rgba(11, 15, 26, 0.92)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(245,158,11,0.4)",
            color: "#f59e0b",
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              border: "2px solid #f59e0b",
              borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span>Waking up AI companion server... 🌿</span>
        </motion.div>
      )}

      {status === "ready" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            padding: "10px 16px",
            borderRadius: 14,
            background: "rgba(11, 15, 26, 0.92)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(34,197,94,0.4)",
            color: "#22c55e",
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <span>🟢 AI Server Ready</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
