"use client";

import { useState } from "react";

const GROUNDING_TECHNIQUES = [
  { icon: "👁", title: "5 things you can SEE", desc: "Look around and name 5 objects in your environment right now." },
  { icon: "🤲", title: "4 things you can TOUCH", desc: "Feel your clothes, the chair, the floor — name 4 textures." },
  { icon: "👂", title: "3 things you can HEAR", desc: "Listen carefully — name 3 sounds around you." },
  { icon: "👃", title: "2 things you can SMELL", desc: "Take a breath — notice 2 scents near you." },
  { icon: "👅", title: "1 thing you can TASTE", desc: "Swallow and notice any taste in your mouth." },
];

const CRISIS_RESOURCES = [
  { name: "iCall (India)", number: "9152987821", type: "call" },
  { name: "Vandrevala Foundation", number: "1860-2662-345", type: "call" },
  { name: "iCall WhatsApp", number: "+919152987821", type: "whatsapp" },
  { name: "AASRA", number: "912227546669", type: "call" },
];

interface CrisisPanelProps {
  onDismiss: () => void;
}

export default function CrisisPanel({ onDismiss }: CrisisPanelProps) {
  const [step, setStep] = useState(0);

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 50,
      background: "var(--bg-primary)",
      display: "flex", flexDirection: "column",
      animation: "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      {/* Header */}
      <div style={{
        background: "rgba(239,68,68,0.08)",
        borderBottom: "0.5px solid var(--crisis-border)",
        padding: "16px 20px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(239,68,68,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0,
        }}>🛡</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#fca5a5" }}>
            Crisis Support Activated
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
            Safety monitor detected distress signals — you're not alone
          </div>
        </div>
        <button
          id="crisis-dismiss-btn"
          onClick={onDismiss}
          style={{
            background: "rgba(239,68,68,0.12)",
            border: "0.5px solid var(--crisis-border)",
            borderRadius: 8, padding: "6px 14px",
            fontSize: 12, color: "#fca5a5", cursor: "pointer",
            fontWeight: 500, flexShrink: 0,
          }}
        >
          I'm safe now
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
        {/* Message */}
        <div style={{
          padding: "16px 20px", borderRadius: 14,
          background: "rgba(239,68,68,0.06)",
          border: "0.5px solid var(--crisis-border)",
          marginBottom: 24,
        }}>
          <p style={{ fontSize: 15, color: "var(--text-primary)", lineHeight: 1.7, marginBottom: 6 }}>
            What you're feeling is real, and it matters. Help is available right now.
          </p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Try the grounding exercise below to anchor yourself in this moment, then reach out if you need to.
          </p>
        </div>

        {/* Grounding */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
          }}>
            5-4-3-2-1 Grounding Technique
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {GROUNDING_TECHNIQUES.map((t, i) => (
              <button
                key={i}
                id={`grounding-step-${i}`}
                onClick={() => setStep(i)}
                style={{
                  padding: "13px 16px", borderRadius: 12, cursor: "pointer",
                  border: step === i
                    ? "1px solid rgba(59,130,246,0.4)"
                    : "0.5px solid var(--border-secondary)",
                  background: step === i
                    ? "rgba(59,130,246,0.08)"
                    : "var(--bg-secondary)",
                  transition: "all 0.2s",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <div>
                    <div style={{
                      fontSize: 13, fontWeight: 500,
                      color: step === i ? "#93c5fd" : "var(--text-primary)",
                    }}>
                      {t.title}
                    </div>
                    {step === i && (
                      <div style={{ fontSize: 12, color: "#60a5fa", marginTop: 4, lineHeight: 1.5 }}>
                        {t.desc}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div>
          <div style={{
            fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
          }}>
            Emergency Resources (India)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CRISIS_RESOURCES.map((r, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "13px 16px", borderRadius: 12,
                border: "0.5px solid var(--border-secondary)",
                background: "var(--bg-secondary)",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                    {r.number}
                  </div>
                </div>
                <a
                  id={`resource-${i}`}
                  href={r.type === "whatsapp"
                    ? `https://wa.me/${r.number}`
                    : `tel:${r.number}`}
                  style={{
                    padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: r.type === "whatsapp"
                      ? "rgba(34,197,94,0.15)"
                      : "rgba(59,130,246,0.12)",
                    color: r.type === "whatsapp" ? "#86efac" : "#93c5fd",
                    border: r.type === "whatsapp"
                      ? "0.5px solid rgba(34,197,94,0.3)"
                      : "0.5px solid rgba(59,130,246,0.3)",
                    cursor: "pointer", flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  {r.type === "whatsapp" ? "WhatsApp" : "Call now"}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
