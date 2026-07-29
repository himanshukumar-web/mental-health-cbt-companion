"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Home", icon: "🏠", path: "/dashboard" },
  { label: "Therapy", icon: "💬", path: "/chat" },
  { label: "Mood", icon: "😊", path: "/mood" },
  { label: "Journal", icon: "📝", path: "/journal" },
  { label: "Timeline", icon: "📜", path: "/timeline" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="mobile-bottom-nav"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1002,
        height: 64,
        background: "rgba(11, 15, 26, 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "0 8px",
        pointerEvents: "auto",
      }}
    >
      <style>{`
        @media (min-width: 768px) {
          .mobile-bottom-nav { display: none !important; }
        }
      `}</style>

      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            href={item.path}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              textDecoration: "none",
              color: isActive ? "#22c55e" : "var(--text-secondary)",
              fontSize: 10,
              fontWeight: isActive ? 700 : 500,
              padding: "6px 12px",
              borderRadius: 12,
              background: isActive ? "rgba(34,197,94,0.12)" : "transparent",
              transition: "all 0.15s ease",
              cursor: "pointer",
              touchAction: "manipulation",
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
