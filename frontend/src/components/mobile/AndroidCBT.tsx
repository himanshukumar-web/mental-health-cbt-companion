"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AndroidMobileLayout from "./AndroidMobileLayout";
import { TopAppBar, MaterialCard, Button, Input, LoadingSkeleton, EmptyStateOld } from "./ui";
import toast from "react-hot-toast";
import { API_URL } from "@/lib/config";

interface CBTWorksheet {
  id: string;
  situation: string;
  automatic_thought: string;
  emotion: string;
  emotion_intensity: number | null;
  thinking_errors: string[] | string;
  alternative_thought: string | null;
  action_plan: string | null;
  ai_generated: boolean;
  created_at: string;
}

export default function AndroidCBT() {
  const { user } = useAuth();
  const router = useRouter();

  const [worksheets, setWorksheets] = useState<CBTWorksheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [situation, setSituation] = useState("");
  const [thought, setThought] = useState("");
  const [emotion, setEmotion] = useState("");
  const [intensity, setIntensity] = useState(70);

  const fetchWorksheets = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/cbt-worksheets/${user.id}`);
      if (res.ok) {
        const json = await res.json();
        setWorksheets(json.worksheets || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchWorksheets(); }, [fetchWorksheets]);

  const handleGenerate = async () => {
    if (!user || !situation.trim() || !thought.trim() || !emotion.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/cbt-worksheets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, situation, automatic_thought: thought, emotion, emotion_intensity: intensity, ai_generate: true }),
      });
      if (res.ok) {
        toast.success("AI Thought Restructuring Complete! ✨");
        setSituation(""); setThought(""); setEmotion(""); setShowForm(false);
        fetchWorksheets();
      } else toast.error("Failed to generate worksheet");
    } catch { toast.error("Network error"); }
    setGenerating(false);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/cbt-worksheets/${id}?user_id=${user.id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Worksheet deleted"); fetchWorksheets(); }
    } catch { toast.error("Delete failed"); }
  };

  const parseErrors = (errors: string[] | string): string[] => {
    if (typeof errors === "string") {
      try { return JSON.parse(errors); } catch { return []; }
    }
    return errors || [];
  };

  if (loading) {
    return (
      <AndroidMobileLayout>
        <TopAppBar title="CBT Tools" subtitle="Cognitive Restructuring" />
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <LoadingSkeleton height="60px" /><LoadingSkeleton height="200px" /><LoadingSkeleton height="200px" />
        </div>
      </AndroidMobileLayout>
    );
  }

  return (
    <AndroidMobileLayout hasBottomNav={true}>
      <TopAppBar title="CBT Worksheets" subtitle="Challenge automatic thoughts" />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {!showForm ? (
          <Button fullWidth onClick={() => setShowForm(true)} style={{ height: "56px", borderRadius: "16px", background: "linear-gradient(135deg, #a855f7, #7c3aed)" }}>
            🧠 New Cognitive Restructuring
          </Button>
        ) : (
          <MaterialCard variant="elevated" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#e8edf5", margin: 0 }}>New Thought Record</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "#8b95a7" }}>✕</button>
            </div>
            <Input label="Situation" placeholder="What happened?" value={situation} onChange={e => setSituation(e.target.value)} />
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#8b95a7" }}>Automatic Thought</label>
              <textarea value={thought} onChange={e => setThought(e.target.value)} placeholder="What went through your mind?" style={{ width: "100%", minHeight: "80px", padding: "12px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8edf5", fontSize: "14px", resize: "none" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Input label="Emotion" placeholder="Anxious, Sad..." value={emotion} onChange={e => setEmotion(e.target.value)} />
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#8b95a7" }}>Intensity ({intensity}%)</label>
                <input type="range" min="0" max="100" value={intensity} onChange={e => setIntensity(parseInt(e.target.value))} style={{ width: "100%", height: "32px", accentColor: "#22c55e" }} />
              </div>
            </div>
            <Button fullWidth loading={generating} onClick={handleGenerate}>Analyze & Restructure ✨</Button>
          </MaterialCard>
        )}

        {worksheets.length === 0 ? (
          <EmptyStateOld icon="🧠" title="No Worksheets" description="Start by recording an unhelpful thought to challenge it with CBT techniques." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {worksheets.map(ws => {
              const errs = parseErrors(ws.thinking_errors);
              return (
                <MaterialCard key={ws.id} variant="filled" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#e8edf5" }}>{ws.situation}</div>
                    <button onClick={() => handleDelete(ws.id)} style={{ background: "none", border: "none", color: "#f87171", fontSize: "16px" }}>🗑</button>
                  </div>
                  <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.08)", borderLeft: "4px solid #ef4444" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#ef4444", marginBottom: "2px" }}>AUTOMATIC THOUGHT</div>
                    <div style={{ fontSize: "13px", color: "#e8edf5" }}>{ws.automatic_thought}</div>
                  </div>
                  {errs.length > 0 && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {errs.map((e, idx) => <span key={idx} style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>⚠️ {e}</span>)}
                    </div>
                  )}
                  {ws.alternative_thought && (
                    <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(34, 197, 94, 0.08)", borderLeft: "4px solid #22c55e" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#22c55e", marginBottom: "2px" }}>BALANCED ALTERNATIVE</div>
                      <div style={{ fontSize: "13px", color: "#e8edf5" }}>{ws.alternative_thought}</div>
                    </div>
                  )}
                </MaterialCard>
              );
            })}
          </div>
        )}
      </div>
    </AndroidMobileLayout>
  );
}
