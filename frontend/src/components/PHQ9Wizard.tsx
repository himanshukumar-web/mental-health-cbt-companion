"use client";

import { useState } from "react";
import { PHQ9Assessment } from "@/types/persona";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading or watching television",
  "Moving or speaking so slowly that others could have noticed? Or being fidgety / restless",
  "Thoughts that you would be better off dead, or of hurting yourself in some way",
];

const OPTIONS = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
];

interface PHQ9WizardProps {
  onSubmit: (answers: number[]) => Promise<PHQ9Assessment | null>;
  latestAssessment?: PHQ9Assessment | null;
}

export default function PHQ9Wizard({ onSubmit, latestAssessment }: PHQ9WizardProps) {
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<number[]>(Array(9).fill(-1));
  const [result, setResult] = useState<PHQ9Assessment | null>(latestAssessment || null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSelect = (val: number) => {
    const next = [...answers];
    next[step] = val;
    setAnswers(next);

    if (step < 8) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (answers.some((a) => a === -1)) {
      toast.error("Please answer all 9 questions before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await onSubmit(answers);
      if (res) {
        setResult(res);
        toast.success("PHQ-9 Assessment Completed!");
      }
    } catch (err) {
      toast.error("Failed to submit assessment.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetWizard = () => {
    setAnswers(Array(9).fill(-1));
    setStep(0);
    setResult(null);
  };

  if (result) {
    const isCrisis = answers[8] > 0 || result.score >= 20;

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: 24,
          borderRadius: 20,
          background: "var(--bg-glass)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border-secondary)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#3b82f6", letterSpacing: "0.08em" }}>
              Clinical Assessment Result
            </span>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: "4px 0 0" }}>
              PHQ-9 Depression Scale
            </h2>
          </div>
          <button
            onClick={resetWizard}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid var(--border-secondary)",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Retake Assessment
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginTop: 8,
          }}
        >
          <div
            style={{
              padding: 16,
              borderRadius: 14,
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase" }}>
              Total PHQ-9 Score
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#3b82f6", marginTop: 4 }}>
              {result.score} <span style={{ fontSize: 16, color: "var(--text-tertiary)", fontWeight: 600 }}>/ 27</span>
            </div>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 14,
              background: "rgba(168,85,247,0.08)",
              border: "1px solid rgba(168,85,247,0.2)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase" }}>
              Severity Level
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#a855f7", marginTop: 8 }}>
              {result.risk_category}
            </div>
          </div>
        </div>

        <div style={{ padding: 16, borderRadius: 14, background: "var(--bg-secondary)", border: "1px solid var(--border-secondary)" }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px" }}>
            🤖 AI Clinical Insights
          </h4>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
            {result.ai_explanation}
          </p>
        </div>

        {isCrisis && (
          <div
            style={{
              padding: 16,
              borderRadius: 14,
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 24 }}>🚨</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>Safety & Crisis Support</div>
              <div style={{ fontSize: 12, color: "var(--text-primary)", marginTop: 2, lineHeight: 1.4 }}>
                If you are experiencing severe distress or thoughts of self-harm, please contact 988 Crisis Lifeline or text HOME to 741741 immediately. You are not alone.
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div
      style={{
        padding: 24,
        borderRadius: 20,
        background: "var(--bg-glass)",
        backdropFilter: "blur(16px)",
        border: "1px solid var(--border-secondary)",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase" }}>
            PHQ-9 Question {step + 1} of 9
          </span>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 600 }}>
            {Math.round(((step + 1) / 9) * 100)}% Complete
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, borderRadius: 3, background: "var(--bg-secondary)", overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / 9) * 100}%` }}
            style={{ height: "100%", background: "linear-gradient(90deg, #3b82f6, #60a5fa)", borderRadius: 3 }}
          />
        </div>
      </div>

      {/* Question prompt */}
      <div style={{ minHeight: 180, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 6 }}>
          Over the last 2 weeks, how often have you been bothered by:
        </div>
        <AnimatePresence mode="wait">
          <motion.h3
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.4, margin: "0 0 20px" }}
          >
            {PHQ9_QUESTIONS[step]}
          </motion.h3>
        </AnimatePresence>

        {/* Radio choices */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {OPTIONS.map((opt) => {
            const isSelected = answers[step] === opt.value;
            return (
              <motion.button
                key={opt.value}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSelect(opt.value)}
                style={{
                  padding: "14px 18px",
                  borderRadius: 12,
                  border: isSelected ? "2px solid #3b82f6" : "1px solid var(--border-secondary)",
                  background: isSelected ? "rgba(59,130,246,0.12)" : "var(--bg-secondary)",
                  color: isSelected ? "#3b82f6" : "var(--text-primary)",
                  fontSize: 14,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.15s",
                }}
              >
                <span>{opt.label}</span>
                <span style={{ fontSize: 12, opacity: 0.6 }}>+{opt.value} pts</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24 }}>
        <button
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
          style={{
            padding: "8px 16px",
            borderRadius: 10,
            border: "1px solid var(--border-secondary)",
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: 13,
            fontWeight: 600,
            cursor: step === 0 ? "not-allowed" : "pointer",
            opacity: step === 0 ? 0.4 : 1,
          }}
        >
          ← Previous
        </button>

        {step === 8 && answers.every((a) => a !== -1) && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: "10px 24px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
            }}
          >
            {submitting ? "Analyzing..." : "Submit PHQ-9 Assessment ✨"}
          </motion.button>
        )}
      </div>
    </div>
  );
}
