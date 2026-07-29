"use client";

import { useState } from "react";
import { TimelineItem } from "@/types/persona";
import { motion, AnimatePresence } from "framer-motion";

interface TimelineFeedProps {
  items: TimelineItem[];
  loading?: boolean;
  onFilterChange?: (category: string) => void;
  onSearchChange?: (query: string) => void;
}

const CATEGORIES = [
  { id: "all", label: "All Events", icon: "🌐" },
  { id: "chat", label: "Chat History", icon: "💬" },
  { id: "mood", label: "Mood Logs", icon: "😊" },
  { id: "journal", label: "Journals", icon: "📝" },
  { id: "assessment", label: "Assessments", icon: "📊" },
  { id: "cbt", label: "CBT Tools", icon: "🧠" },
];

export default function TimelineFeed({
  items,
  loading = false,
  onFilterChange,
  onSearchChange,
}: TimelineFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (onFilterChange) onFilterChange(cat);
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (onSearchChange) onSearchChange(q);
  };

  const getItemBadge = (type: string) => {
    switch (type) {
      case "chat":
        return { label: "Chat", color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
      case "mood":
        return { label: "Mood", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" };
      case "journal":
        return { label: "Journal", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
      case "assessment":
        return { label: "Assessment", color: "#a855f7", bg: "rgba(168,85,247,0.1)" };
      case "cbt":
        return { label: "CBT Worksheet", color: "#06b6d4", bg: "rgba(6,182,212,0.1)" };
      default:
        return { label: type, color: "#6b7280", bg: "rgba(107,114,128,0.1)" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
      {/* Search & Filter Header */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <input
          type="text"
          placeholder="🔍 Search timeline entries..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            flex: "1 1 240px",
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid var(--border-secondary)",
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            fontSize: 13,
            outline: "none",
          }}
        />

        {/* Category Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 10,
                  border: isSelected ? "1px solid #22c55e" : "1px solid var(--border-secondary)",
                  background: isSelected ? "rgba(34,197,94,0.12)" : "transparent",
                  color: isSelected ? "#22c55e" : "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
          Loading timeline entries...
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            background: "var(--bg-glass)",
            backdropFilter: "blur(12px)",
            borderRadius: 16,
            border: "1px solid var(--border-secondary)",
          }}
        >
          <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>📜</span>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>No timeline entries found</div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>
            Try adjusting your search or category filter.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <AnimatePresence>
            {items.map((item) => {
              const badge = getItemBadge(item.type);
              const formattedDate = item.timestamp
                ? new Date(item.timestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Recent";

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    background: "var(--bg-glass)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid var(--border-secondary)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.color}30`,
                        textTransform: "uppercase",
                      }}
                    >
                      {badge.label}
                    </span>

                    <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{formattedDate}</span>
                  </div>

                  <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                    {item.title}
                  </h4>

                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      margin: 0,
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {item.content}
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
