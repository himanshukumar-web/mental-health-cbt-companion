"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import TimelineFeed from "@/components/TimelineFeed";
import { useTimeline } from "@/hooks/useTimeline";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";

export default function TimelinePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const { timeline, loading: timelineLoading } = useTimeline(user?.id, category, search);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <PageSkeleton />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Sidebar />

      <main style={{ flex: 1, padding: "28px 24px", maxWidth: 1000, margin: "0 auto", width: "100%" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#22c55e", letterSpacing: "0.08em" }}>
            Mental Health Journey
          </span>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", margin: "4px 0 0" }}>
            Conversation & Activity Timeline
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-tertiary)", margin: "4px 0 0" }}>
            A unified chronological feed combining AI therapy chats, mood entries, journal logs, clinical assessments, and CBT tools.
          </p>
        </div>

        {/* Timeline Feed */}
        <TimelineFeed
          items={timeline}
          loading={timelineLoading}
          onFilterChange={(cat) => setCategory(cat)}
          onSearchChange={(q) => setSearch(q)}
        />
      </main>
    </div>
  );
}
