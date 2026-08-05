"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { label: "Home", icon: "🏠", path: "/dashboard" },
  { label: "Sera AI", icon: "🤖", path: "/chat" },
  { label: "Mood", icon: "😊", path: "/mood" },
  { label: "Progress", icon: "📊", path: "/progress" },
  { label: "Profile", icon: "👤", path: "/profile" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <nav className="mobile-bottom-nav">
      <style>{`
        .mobile-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: rgba(17, 24, 39, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          z-index: 2000;
          padding-bottom: env(safe-area-inset-bottom);
          box-sizing: content-box;
          justify-content: space-around;
          align-items: center;
        }
        @media (max-width: 767px) {
          .mobile-bottom-nav { display: flex; }
          body { padding-bottom: 74px !important; }
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
              transition: "all 0.2s",
              flex: 1,
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
            {isActive && (
              <div style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "#22c55e",
                marginTop: -2,
              }} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
