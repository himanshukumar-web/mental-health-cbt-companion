"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMobileJournalData } from "@/hooks/mobile";
import { formatMobileDate } from "@/utils/mobileUtils";
import AndroidMobileLayout from "./AndroidMobileLayout";
import {
  TopAppBar,
  JournalCard,
  SearchBar,
  PrimaryButton,
  SecondaryButton,
  BottomSheet,
  FAB,
  EmptyState,
  LoadingSkeleton,
  TextField,
} from "./ui";

export default function AndroidJournal() {
  const { user } = useAuth();
  const { entries, loading, createJournalEntry } = useMobileJournalData(user?.id);

  const [search, setSearch] = useState<string>("");
  const [showCreateSheet, setShowCreateSheet] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const handleCreateEntry = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    const success = await createJournalEntry(title, content);
    if (success) {
      setTitle("");
      setContent("");
      setShowCreateSheet(false);
    }
    setSaving(false);
  };

  const filtered = entries.filter((e) =>
    (e.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.content || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AndroidMobileLayout>
      <TopAppBar
        title="Reflective Journal"
        subtitle="Write down thoughts and insights"
        actions={
          <SecondaryButton onClick={() => setShowCreateSheet(false || true)} style={{ minHeight: "36px", padding: "0 14px", borderRadius: "100px" }}>
            + New
          </SecondaryButton>
        }
      />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Search Bar */}
        <SearchBar
          placeholder="Search Journal Entries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Entry List */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <LoadingSkeleton height="100px" />
            <LoadingSkeleton height="100px" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📝"
            title="No journal entries yet"
            description="Express your thoughts freely in a private, safe space."
            actionLabel="Create Entry"
            onAction={() => setShowCreateSheet(true)}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filtered.map((entry, idx) => (
              <JournalCard
                key={entry.id || idx}
                title={entry.title || "Untitled Note"}
                content={entry.content}
                date={formatMobileDate(entry.created_at)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div style={{ position: "fixed", bottom: "calc(90px + env(safe-area-inset-bottom, 0px))", right: "20px", zIndex: 1200 }}>
        <FAB icon="✏️" label="New Entry" onClick={() => setShowCreateSheet(true)} />
      </div>

      {/* Create Entry Bottom Sheet */}
      <BottomSheet isOpen={showCreateSheet} onClose={() => setShowCreateSheet(false)} title="New Journal Entry">
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <TextField
            label="Title"
            type="text"
            placeholder="e.g. Evening Reflection"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#8b95a7", display: "block", marginBottom: "6px" }}>
              YOUR THOUGHTS
            </label>
            <textarea
              rows={6}
              placeholder="Write freely..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "16px",
                padding: "14px",
                color: "#e8edf5",
                fontSize: "14px",
                outline: "none",
                fontFamily: "inherit",
                resize: "none",
              }}
            />
          </div>

          <PrimaryButton fullWidth loading={saving} onClick={handleCreateEntry}>
            Save Journal Entry
          </PrimaryButton>
        </div>
      </BottomSheet>
    </AndroidMobileLayout>
  );
}
