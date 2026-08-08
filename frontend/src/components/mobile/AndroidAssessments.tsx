"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AndroidMobileLayout from "./AndroidMobileLayout";
import { TopAppBar, MaterialCard, Chip, LoadingSkeleton, EmptyStateOld, Badge } from "./ui";
import { useAssessments } from "@/hooks/useAssessments";
import PHQ9Wizard from "@/components/PHQ9Wizard";
import GAD7Wizard from "@/components/GAD7Wizard";

export default function AndroidAssessments() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"phq9" | "gad7" | "history">("phq9");
  const { phq9History, gad7History, submitPHQ9, submitGAD7, loading } = useAssessments(user?.id);

  if (loading) {
    return (
      <AndroidMobileLayout>
        <TopAppBar title="Assessments" />
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <LoadingSkeleton height="60px" /><LoadingSkeleton height="200px" /><LoadingSkeleton height="200px" />
        </div>
      </AndroidMobileLayout>
    );
  }

  return (
    <AndroidMobileLayout hasBottomNav={true}>
      <TopAppBar title="Clinical Assessments" subtitle="Monitor your recovery progress" />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          <Chip label=" Depression (PHQ-9)" selected={activeTab === "phq9"} onClick={() => setActiveTab("phq9")} />
          <Chip label=" Anxiety (GAD-7)" selected={activeTab === "gad7"} onClick={() => setActiveTab("gad7")} />
          <Chip label="📈 Reports" selected={activeTab === "history"} onClick={() => setActiveTab("history")} />
        </div>

        {activeTab === "phq9" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <MaterialCard variant="filled">
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#e8edf5", margin: "0 0 4px 0" }}>Depression Screening</h3>
              <p style={{ fontSize: "12px", color: "#8b95a7", margin: 0, lineHeight: 1.4 }}>The PHQ-9 is a standard clinical tool used by doctors to measure the severity of depressive symptoms.</p>
            </MaterialCard>
            <PHQ9Wizard onSubmit={submitPHQ9} />
          </div>
        )}

        {activeTab === "gad7" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <MaterialCard variant="filled">
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#e8edf5", margin: "0 0 4px 0" }}>Anxiety Screening</h3>
              <p style={{ fontSize: "12px", color: "#8b95a7", margin: 0, lineHeight: 1.4 }}>The GAD-7 assessment evaluates generalized anxiety disorder symptoms over the last 2 weeks.</p>
            </MaterialCard>
            <GAD7Wizard onSubmit={submitGAD7} />
          </div>
        )}

        {activeTab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#e8edf5", margin: 0 }}>Recent Reports</h3>
            {phq9History.length === 0 && gad7History.length === 0 ? (
              <EmptyStateOld icon="📈" title="No History" description="Complete your first assessment to see clinical trends and AI reports." />
            ) : (
              <>
                {phq9History.map(h => (
                  <MaterialCard key={h.id} variant="elevated" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", fontWeight: 800, color: "#3b82f6" }}>PHQ-9 SCORE: {h.score}/27</span>
                      <span style={{ fontSize: "11px", color: "#8b95a7" }}>{new Date(h.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#e8edf5" }}>{h.risk_category}</div>
                    <p style={{ fontSize: "12px", color: "#8b95a7", margin: 0, lineHeight: 1.4 }}>{h.ai_explanation}</p>
                  </MaterialCard>
                ))}
                {gad7History.map(h => (
                  <MaterialCard key={h.id} variant="elevated" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", fontWeight: 800, color: "#8b5cf6" }}>GAD-7 SCORE: {h.score}/21</span>
                      <span style={{ fontSize: "11px", color: "#8b95a7" }}>{new Date(h.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#e8edf5" }}>{h.anxiety_level}</div>
                    <p style={{ fontSize: "12px", color: "#8b95a7", margin: 0, lineHeight: 1.4 }}>{h.ai_explanation}</p>
                  </MaterialCard>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </AndroidMobileLayout>
  );
}
