"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AndroidMobileLayout from "./AndroidMobileLayout";
import { MD3TopAppBar } from "./ui/TopAppBar";
import { MD3Card } from "./ui/Card";
import { MD3Button } from "./ui/Button";
import { MD3Input } from "./ui/Input";
import { MD3BottomSheet } from "./ui/BottomSheet";
import { MD3EmptyState, MD3LoadingState } from "./ui/FeedbackStates";
import { API_URL } from "@/lib/config";
import toast from "react-hot-toast";

export default function AndroidJournal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  const [showCreateSheet, setShowCreateSheet] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;
    fetchJournalEntries();
  }, [user]);

  const fetchJournalEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/journal/${user?.id}`);
      if (res.ok) {
        const json = await res.json();
        setEntries(json.entries || json || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async () => {
    if (!title.trim() || !content.trim() || !user) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
        }),
      });

      if (res.ok) {
        toast.success("Journal entry saved!");
        setTitle("");
        setContent("");
        setShowCreateSheet(false);
        fetchJournalEntries();
      } else {
        toast.error("Failed to save entry.");
      }
    } catch (err) {
      toast.error("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = entries.filter((e) =>
    (e.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.content || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AndroidMobileLayout>
      <MD3TopAppBar
        title="Reflective Journal"
        subtitle="Write down thoughts and insights"
        actions={
          <MD3Button variant="tonal" onClick={() => setShowCreateSheet(true)} style={{ height: "36px", padding: "0 12px" }}>
            + New
          </MD3Button>
        }
      />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Search Bar */}
        <MD3Input
          label="Search Journal Entries"
          type="text"
          placeholder="Filter by keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leadingIcon="🔍"
        />

        {/* Entry List */}
        {loading ? (
          <MD3LoadingState message="Fetching entries..." />
        ) : filtered.length === 0 ? (
          <MD3EmptyState
            icon="📝"
            title="No journal entries yet"
            description="Express your thoughts freely in a private, safe space."
            actionLabel="Create Entry"
            onAction={() => setShowCreateSheet(true)}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filtered.map((entry, idx) => (
              <MD3Card key={entry.id || idx} variant="filled">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#e8edf5", margin: 0 }}>
                    {entry.title || "Untitled Note"}
                  </h3>
                  <span style={{ fontSize: "11px", color: "#8b95a7" }}>
                    {new Date(entry.created_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "#8b95a7", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {entry.content}
                </p>
              </MD3Card>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div style={{ position: "fixed", bottom: "calc(90px + env(safe-area-inset-bottom, 0px))", right: "20px", zIndex: 1200 }}>
        <MD3Button variant="fab" icon="✏️" onClick={() => setShowCreateSheet(true)}>
          New Entry
        </MD3Button>
      </div>

      {/* Create Entry Bottom Sheet */}
      <MD3BottomSheet isOpen={showCreateSheet} onClose={() => setShowCreateSheet(false)} title="New Journal Entry">
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <MD3Input
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

          <MD3Button fullWidth loading={saving} onClick={handleCreateEntry}>
            Save Journal Entry
          </MD3Button>
        </div>
      </MD3BottomSheet>
    </AndroidMobileLayout>
  );
}
