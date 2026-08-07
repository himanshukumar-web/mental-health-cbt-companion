"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import PHQ9Wizard from "@/components/PHQ9Wizard";
import GAD7Wizard from "@/components/GAD7Wizard";
import EmptyState from "@/components/ui/EmptyState";
import { useAssessments } from "@/hooks/useAssessments";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface ComparisonResult {
  previous: { score: number };
  current: { score: number };
  improved: boolean;
  same: boolean;
  score_delta: number;
}

export default function AssessmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"phq9" | "gad7" | "history">("phq9");

  const {
    phq9History,
    gad7History,
    phq9Comparison,
    gad7Comparison,
    submitPHQ9,
    submitGAD7,
    // loading: assessmentsLoading,
  } = useAssessments(user?.id);

  const phq9Comp = phq9Comparison as ComparisonResult | null;
  const gad7Comp = gad7Comparison as ComparisonResult | null;

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <PageSkeleton />;
  }

  const latestPHQ9 = phq9History.length > 0 ? phq9History[0] : null;
  const latestGAD7 = gad7History.length > 0 ? gad7History[0] : null;

  // Prepare trend data combining both assessments
  const trendDataMap: Record<string, { date: string; phq9?: number; gad7?: number }> = {};

  phq9History.forEach((item) => {
    const dStr = new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    if (!trendDataMap[dStr]) trendDataMap[dStr] = { date: dStr };
    trendDataMap[dStr].phq9 = item.score;
  });

  gad7History.forEach((item) => {
    const dStr = new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    if (!trendDataMap[dStr]) trendDataMap[dStr] = { date: dStr };
    trendDataMap[dStr].gad7 = item.score;
  });

  const trendData = Object.values(trendDataMap);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Sidebar />

      <main className="app-main-layout" style={{ padding: "24px 20px", maxWidth: 1100, overflow: "auto" }}>
        <MobileHeader title="Clinical Assessments" />
        
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#8b5cf6", letterSpacing: "0.08em" }}>
            Clinical Tools & Assessment Hub
          </span>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", margin: "4px 0 0", fontFamily: "var(--font-display)" }}>
            Clinical Health Assessments & Recovery Trends 📋
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Standardized clinical tools (PHQ-9 & GAD-7) to evaluate depression, anxiety, and monitor recovery progress.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="custom-scrollbar" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24, borderBottom: "1px solid var(--border-secondary)", paddingBottom: 12, overflowX: "auto" }}>
          <button
            onClick={() => setActiveTab("phq9")}
            style={{
              padding: "10px 18px",
              borderRadius: 12,
              border: activeTab === "phq9" ? "1px solid #3b82f6" : "1px solid var(--border-secondary)",
              background: activeTab === "phq9" ? "rgba(59,130,246,0.12)" : "transparent",
              color: activeTab === "phq9" ? "#3b82f6" : "var(--text-secondary)",
              fontSize: 14,
              fontWeight: activeTab === "phq9" ? 700 : 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>📋</span>
            <span>PHQ-9 Depression</span>
          </button>

          <button
            onClick={() => setActiveTab("gad7")}
            style={{
              padding: "10px 18px",
              borderRadius: 12,
              border: activeTab === "gad7" ? "1px solid #8b5cf6" : "1px solid var(--border-secondary)",
              background: activeTab === "gad7" ? "rgba(139,92,246,0.12)" : "transparent",
              color: activeTab === "gad7" ? "#8b5cf6" : "var(--text-secondary)",
              fontSize: 14,
              fontWeight: activeTab === "gad7" ? 700 : 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>📊</span>
            <span>GAD-7 Anxiety</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            style={{
              padding: "10px 18px",
              borderRadius: 12,
              border: activeTab === "history" ? "1px solid #22c55e" : "1px solid var(--border-secondary)",
              background: activeTab === "history" ? "rgba(34,197,94,0.12)" : "transparent",
              color: activeTab === "history" ? "#22c55e" : "var(--text-secondary)",
              fontSize: 14,
              fontWeight: activeTab === "history" ? 700 : 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>📈</span>
            <span>Reports & Trends</span>
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "phq9" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {phq9Comp && phq9Comp.previous && (
              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6" }}>PHQ-9 Assessment Comparison</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                    Current score: {phq9Comp.current.score}/27 vs Previous score: {phq9Comp.previous.score}/27
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: phq9Comp.improved ? "#22c55e" : "#ef4444",
                  }}
                >
                  {phq9Comp.improved ? "📉 Improved (-" + Math.abs(phq9Comp.score_delta) + " pts)" : phq9Comp.same ? "⚖️ Stable" : "📈 Increase (+" + phq9Comp.score_delta + " pts)"}
                </div>
              </div>
            )}

            <PHQ9Wizard onSubmit={submitPHQ9} latestAssessment={latestPHQ9} />
          </div>
        )}

        {activeTab === "gad7" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {gad7Comp && gad7Comp.previous && (
              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: "rgba(139,92,246,0.08)",
                  border: "1px solid rgba(139,92,246,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#8b5cf6" }}>GAD-7 Anxiety Comparison</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                    Current score: {gad7Comp.current.score}/21 vs Previous score: {gad7Comp.previous.score}/21
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: gad7Comp.improved ? "#22c55e" : "#ef4444",
                  }}
                >
                  {gad7Comp.improved ? "📉 Reduced Anxiety (-" + Math.abs(gad7Comp.score_delta) + " pts)" : gad7Comp.same ? "⚖️ Stable" : "📈 Increase (+" + gad7Comp.score_delta + " pts)"}
                </div>
              </div>
            )}

            <GAD7Wizard onSubmit={submitGAD7} latestAssessment={latestGAD7} />
          </div>
        )}

        {activeTab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Recovery Trend Chart */}
            {trendData.length > 0 && (
              <div style={{ padding: 24, borderRadius: 20, background: "var(--bg-glass)", border: "1px solid var(--border-secondary)" }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 16px", fontFamily: "var(--font-display)" }}>
                  📉 Clinical Recovery Trend
                </h3>
                <div style={{ height: 260, width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" opacity={0.5} />
                      <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={11} />
                      <YAxis stroke="var(--text-tertiary)" fontSize={11} />
                      <Tooltip contentStyle={{ background: "var(--bg-primary)", borderRadius: 10, border: "1px solid var(--border-secondary)" }} />
                      <Legend />
                      <Line type="monotone" dataKey="phq9" stroke="#3b82f6" strokeWidth={3} name="PHQ-9 (Depression)" dot={{ r: 5 }} />
                      <Line type="monotone" dataKey="gad7" stroke="#8b5cf6" strokeWidth={3} name="GAD-7 (Anxiety)" dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-display)" }}>
              Past Assessment Log & Clinical Reports
            </h3>

            {phq9History.length === 0 && gad7History.length === 0 ? (
              <EmptyState
                icon="📋"
                title="No Completed Assessments Yet"
                description="Take your first PHQ-9 or GAD-7 assessment to unlock personalized clinical explanations, recovery trends, and doctor reports."
                actionText="Take PHQ-9 Assessment"
                onAction={() => setActiveTab("phq9")}
                tip="Standard clinical tests are recommended every 2 weeks to measure treatment progress."
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {phq9History.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: 18,
                      borderRadius: 18,
                      background: "var(--bg-glass)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid var(--border-secondary)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        PHQ-9 Depression Score: {item.score}/27
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                        {new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{item.risk_category}</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.ai_explanation}</div>
                  </motion.div>
                ))}

                {gad7History.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: 18,
                      borderRadius: 18,
                      background: "var(--bg-glass)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid var(--border-secondary)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#8b5cf6", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        GAD-7 Anxiety Score: {item.score}/21
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                        {new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{item.anxiety_level}</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.ai_explanation}</div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
