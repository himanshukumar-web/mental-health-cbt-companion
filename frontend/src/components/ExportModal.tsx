"use client";

import { useState } from "react";
import { ExportCategory, ExportFormat } from "@/types/heatmap";
import { exportDataAsJSON, exportDataAsCSV, exportReportAsPDF } from "@/utils/export";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { API_URL } from "@/lib/config";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export default function ExportModal({ isOpen, onClose, userId }: ExportModalProps) {
  const [category, setCategory] = useState<ExportCategory>("report");
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [exporting, setExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!userId) {
      toast.error("User ID not found.");
      return;
    }
    setExporting(true);
    try {
      if (category === "report") {
        const res = await fetch(`${API_URL}/export/${userId}`);
        const data = await res.json();
        const exportData = data.data || {};

        if (format === "json") {
          exportDataAsJSON(exportData, `mindmate_wellness_report_${userId.slice(0, 8)}`);
        } else if (format === "csv") {
          exportDataAsCSV(exportData.mood_entries || [], `mindmate_mood_history_${userId.slice(0, 8)}`);
        } else {
          // PDF Report
          const contentHtml = `
            <h2>Personalized Mental Health Overview</h2>
            <div class="card">
              <div><strong>Total Mood Logs:</strong> ${(exportData.mood_entries || []).length}</div>
              <div><strong>Journal Reflections:</strong> ${(exportData.journal_entries || []).length}</div>
              <div><strong>CBT Exercises:</strong> ${(exportData.cbt_worksheets || []).length}</div>
            </div>
            <h2>Recent Mood Entries</h2>
            ${(exportData.mood_entries || []).slice(0, 10).map((m: { mood_score: number; date?: string; created_at?: string; note?: string }) => `
              <div class="card">
                <span class="badge">Mood: ${m.mood_score}/10</span>
                <div>Date: ${m.date || m.created_at}</div>
                <div>Note: ${m.note || 'None'}</div>
              </div>
            `).join('')}
          `;
          exportReportAsPDF("Complete Wellness Report", contentHtml, `mindmate_report_${userId.slice(0, 8)}`);
        }
      } else if (category === "timeline") {
        const res = await fetch(`${API_URL}/timeline/${userId}`);
        const data = await res.json();
        const timeline = data.timeline || [];

        if (format === "json") exportDataAsJSON(timeline, "mindmate_timeline");
        else if (format === "csv") exportDataAsCSV(timeline, "mindmate_timeline");
        else {
          const html = timeline.map((item: { type: string; title: string; content: string; timestamp?: string }) => `
            <div class="card">
              <span class="badge">${item.type.toUpperCase()}</span>
              <h3>${item.title}</h3>
              <p>${item.content}</p>
              <small>${item.timestamp || ''}</small>
            </div>
          `).join('');
          exportReportAsPDF("Timeline Export", html, "mindmate_timeline");
        }
      } else if (category === "mood") {
        const res = await fetch(`${API_URL}/mood-entries/${userId}`);
        const data = await res.json();
        const entries = data.mood_entries || [];

        if (format === "json") exportDataAsJSON(entries, "mindmate_mood_history");
        else if (format === "csv") exportDataAsCSV(entries, "mindmate_mood_history");
        else {
          const html = entries.map((m: { mood_score: number; note?: string; date?: string; created_at?: string }) => `
            <div class="card">
              <h3>Mood Score: ${m.mood_score}/10</h3>
              <p>${m.note || 'No note'}</p>
              <small>${m.date || m.created_at}</small>
            </div>
          `).join('');
          exportReportAsPDF("Mood History", html, "mindmate_mood_history");
        }
      } else if (category === "journal") {
        const res = await fetch(`${API_URL}/journal/${userId}`);
        const data = await res.json();
        const journals = data.journal_entries || [];

        if (format === "json") exportDataAsJSON(journals, "mindmate_journals");
        else if (format === "csv") exportDataAsCSV(journals, "mindmate_journals");
        else {
          const html = journals.map((j: { title?: string; content: string; created_at: string }) => `
            <div class="card">
              <h3>${j.title || 'Untitled'}</h3>
              <p>${j.content}</p>
              <small>${j.created_at}</small>
            </div>
          `).join('');
          exportReportAsPDF("Journal Reflections", html, "mindmate_journals");
        }
      } else if (category === "assessments") {
        const [phqRes, gadRes] = await Promise.all([
          fetch(`${API_URL}/assessments/phq9/${userId}`),
          fetch(`${API_URL}/assessments/gad7/${userId}`),
        ]);
        const phq = (await phqRes.json()).history || [];
        const gad = (await gadRes.json()).history || [];

        if (format === "json") exportDataAsJSON({ phq9: phq, gad7: gad }, "mindmate_assessments");
        else if (format === "csv") exportDataAsCSV([...phq, ...gad], "mindmate_assessments");
        else {
          const html = `
            <h2>PHQ-9 Depression History</h2>
            ${phq.map((p: { score: number; risk_category?: string; created_at: string }) => `<div class="card"><strong>Score ${p.score}/27</strong> - ${p.risk_category} (${p.created_at})</div>`).join('')}
            <h2>GAD-7 Anxiety History</h2>
            ${gad.map((g: { score: number; anxiety_level?: string; created_at: string }) => `<div class="card"><strong>Score ${g.score}/21</strong> - ${g.anxiety_level} (${g.created_at})</div>`).join('')}
          `;
          exportReportAsPDF("Clinical Assessments Report", html, "mindmate_assessments");
        }
      }

      toast.success("Export generated successfully!");
      onClose();
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export data.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 480,
            borderRadius: 20,
            background: "var(--bg-primary)",
            border: "1px solid var(--border-secondary)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#3b82f6" }}>
                Export Data & Clinical Reports
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: "2px 0 0" }}>
                Select Export Package
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "1px solid var(--border-secondary)",
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          {/* Category selection */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>Data Scope</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { id: "report", label: "Complete Wellness Report" },
                { id: "timeline", label: "Timeline History" },
                { id: "mood", label: "Mood Logs" },
                { id: "journal", label: "Journal Entries" },
                { id: "assessments", label: "Clinical Tests" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCategory(item.id as ExportCategory)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: category === item.id ? "1.5px solid #3b82f6" : "1px solid var(--border-secondary)",
                    background: category === item.id ? "rgba(59,130,246,0.1)" : "var(--bg-secondary)",
                    color: category === item.id ? "#3b82f6" : "var(--text-primary)",
                    fontSize: 12,
                    fontWeight: category === item.id ? 700 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format selection */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>Format</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { id: "pdf", label: "📄 PDF Report" },
                { id: "csv", label: "📊 CSV Table" },
                { id: "json", label: "⚙️ Raw JSON" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFormat(item.id as ExportFormat)}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: format === item.id ? "1.5px solid #22c55e" : "1px solid var(--border-secondary)",
                    background: format === item.id ? "rgba(34,197,94,0.1)" : "var(--bg-secondary)",
                    color: format === item.id ? "#22c55e" : "var(--text-primary)",
                    fontSize: 12,
                    fontWeight: format === item.id ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(34,197,94,0.3)",
            }}
          >
            {exporting ? "Generating Package..." : `Download ${category.toUpperCase()} (${format.toUpperCase()}) ✨`}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
