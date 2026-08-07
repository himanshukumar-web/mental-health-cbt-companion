"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAndroid } from "@/hooks/useIsAndroid";

const NAV_ITEMS = [
  { label: "Home", icon: "🏠", path: "/dashboard" },
  { label: "Therapy", icon: "🤖", path: "/chat" },
  { label: "Wellness", icon: "🧘", path: "/wellness" },
  { label: "Progress", icon: "📊", path: "/progress" },
  { label: "Profile", icon: "👤", path: "/profile" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { userRole } = useAuth();
  const isAndroid = useIsAndroid();

  // Hide bottom nav on landing, login, signup, role-select screens
  if (
    !pathname ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/role-select"
  ) {
    return null;
  }

  const navItems =
    userRole === "admin"
      ? [
          { label: "Home", icon: "🏠", path: "/dashboard" },
          { label: "Therapy", icon: "🤖", path: "/chat" },
          { label: "Doctor", icon: "🩺", path: "/admin" },
          { label: "Progress", icon: "📊", path: "/progress" },
          { label: "Profile", icon: "👤", path: "/profile" },
        ]
      : NAV_ITEMS;

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Android Material 3 Mobile Navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1500,
        height: "calc(72px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "rgba(11, 15, 26, 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        pointerEvents: "auto",
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.4)",
      }}
    >
      <style>{`
        @media (min-width: 768px) {
          ${!isAndroid ? ".mobile-bottom-nav { display: none !important; }" : ""}
        }
      `}</style>

      {navItems.map((item) => {
        const isActive =
          pathname === item.path ||
          (item.path !== "/dashboard" && pathname.startsWith(item.path));

        return (
          <Link
            key={item.path}
            href={item.path}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              height: "100%",
              textDecoration: "none",
              color: isActive ? "#4ade80" : "#8b95a7",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
              padding: "4px 0",
            }}
          >
            {/* Icon container with active capsule pill */}
            <div
              style={{
                position: "relative",
                width: "56px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "16px",
                marginBottom: "2px",
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="androidNavActiveCapsule"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "16px",
                    background: "rgba(34, 197, 94, 0.18)",
                    border: "1px solid rgba(34, 197, 94, 0.35)",
                    boxShadow: "0 0 12px rgba(34, 197, 94, 0.2)",
                    zIndex: 0,
                  }}
                />
              )}
              <motion.span
                animate={{ scale: isActive ? 1.15 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                style={{ fontSize: "20px", zIndex: 1, display: "flex", alignItems: "center" }}
              >
                {item.icon}
              </motion.span>
            </div>

            {/* Label */}
            <span
              style={{
                fontSize: "11px",
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "-0.01em",
                zIndex: 1,
                lineHeight: 1,
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
