"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

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

  const navItems = userRole === "admin"
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
      aria-label="Mobile Navigation"
      style={{
        position: "fixed",
        bottom: "calc(10px + env(safe-area-inset-bottom, 0px))",
        left: 12,
        right: 12,
        zIndex: 1002,
        height: 64,
        background: "rgba(11, 15, 26, 0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: 22,
        border: "1px solid rgba(255, 255, 255, 0.12)",
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "0 4px",
        pointerEvents: "auto",
        maxWidth: 500,
        margin: "0 auto",
      }}
    >
      <style>{`
        @media (min-width: 768px) {
          .mobile-bottom-nav { display: none !important; }
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
              gap: 2,
              flex: 1,
              minWidth: 0,
              height: 52,
              padding: "4px 2px",
              textDecoration: "none",
              color: isActive ? "#22c55e" : "var(--text-secondary)",
              fontSize: 11,
              fontWeight: isActive ? 700 : 500,
              borderRadius: 16,
              transition: "color 0.2s ease",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {isActive && (
              <motion.div
                layoutId="mobileNavActivePill"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, rgba(34, 197, 94, 0.18), rgba(34, 197, 94, 0.08))",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  boxShadow: "0 0 16px rgba(34, 197, 94, 0.2)",
                  zIndex: 0,
                }}
              />
            )}
            <motion.span
              animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{ fontSize: 19, zIndex: 1, lineHeight: 1 }}
            >
              {item.icon}
            </motion.span>
            <span
              style={{
                zIndex: 1,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
                fontSize: 10,
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
