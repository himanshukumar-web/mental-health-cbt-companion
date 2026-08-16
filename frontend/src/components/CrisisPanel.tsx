"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/lib/config";

const GROUNDING_TECHNIQUES = [
  { icon: "👁", title: "5 things you can SEE", desc: "Look around and name 5 objects in your environment right now." },
  { icon: "🤲", title: "4 things you can TOUCH", desc: "Feel your clothes, the chair, the floor — name 4 textures." },
  { icon: "👂", title: "3 things you can HEAR", desc: "Listen carefully — name 3 sounds around you." },
  { icon: "👃", title: "2 things you can SMELL", desc: "Take a breath — notice 2 scents near you." },
  { icon: "👅", title: "1 thing you can TASTE", desc: "Swallow and notice any taste in your mouth." },
];

const CRISIS_RESOURCES = [
  { name: "iCall Helpline (India)", number: "9152987821", type: "call" },
  { name: "Vandrevala Foundation", number: "1860-2662-345", type: "call" },
  { name: "National Suicide Lifeline (988 US)", number: "988", type: "call" },
  { name: "Emergency Services", number: "112", type: "call" },
  { name: "iCall WhatsApp", number: "+919152987821", type: "whatsapp" },
];

interface CrisisPanelProps {
  onDismiss: () => void;
  userId?: string;
  sessionId?: string;
}

export default function CrisisPanel({ onDismiss, userId, sessionId }: CrisisPanelProps) {
  const [activeTab, setActiveTab] = useState<"grounding" | "breathing" | "contacts">("grounding");
  const [step, setStep] = useState(0);
  const [trustedNumber, setTrustedNumber] = useState("");

  // Auto-log crisis event to backend for safety audit
  useEffect(() => {
    fetch(`${API_URL}/crisis-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId || null,
        session_id: sessionId || null,
        content: "Safety monitor triggered crisis alert mode",
        threat_level: "crisis",
      }),
    }).catch(() => {});
  }, [userId, sessionId]);

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 9999,
      background: "var(--bg-primary)",
      display: "flex", flexDirection: "column",
      animation: "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      {/* Header */}
      <div style={{
        background: "rgba(239,68,68,0.12)",
        borderBottom: "0.5px solid var(--crisis-border)",
        padding: "16px 20px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(239,68,68,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0,
        }}>🛡</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#fca5a5" }}>
            Crisis Safety Alert Activated
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
            Normal AI chat is paused. Your safety is the priority right now.
          </div>
        </div>
        <button
          id="crisis-dismiss-btn"
          onClick={onDismiss}
          style={{
            background: "rgba(239,68,68,0.15)",
            border: "0.5px solid var(--crisis-border)",
            borderRadius: 8, padding: "8px 14px",
            fontSize: 12, color: "#fca5a5", cursor: "pointer",
            fontWeight: 600, flexShrink: 0,
          }}
        >
          I&apos;m safe now ✓
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: "flex", background: "var(--bg-secondary)",
        borderBottom: "0.5px solid var(--border-secondary)",
        padding: "4px 8px", gap: 6,
      }}>
        <button
          onClick={() => setActiveTab("grounding")}
          style={{
            flex: 1, padding: "8px 12px", borderRadius: 8, border: "none",
            background: activeTab === "grounding" ? "var(--bg-glass)" : "transparent",
            color: activeTab === "grounding" ? "var(--text-primary)" : "var(--text-tertiary)",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          👁 5-4-3-2-1 Grounding
        </button>
        <button
          onClick={() => setActiveTab("breathing")}
          style={{
            flex: 1, padding: "8px 12px", borderRadius: 8, border: "none",
            background: activeTab === "breathing" ? "var(--bg-glass)" : "transparent",
            color: activeTab === "breathing" ? "var(--text-primary)" : "var(--text-tertiary)",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          🫁 Calming Breathing
        </button>
        <button
          onClick={() => setActiveTab("contacts")}
          style={{
            flex: 1, padding: "8px 12px", borderRadius: 8, border: "none",
            background: activeTab === "contacts" ? "var(--bg-glass)" : "transparent",
            color: activeTab === "contacts" ? "var(--text-primary)" : "var(--text-tertiary)",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          📞 Emergency Contacts
        </button>
      </div>

      {/* Main Content View */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", maxWidth: 700, margin: "0 auto", width: "100%" }}>
        
        {/* Tab 1: Grounding */}
        {activeTab === "grounding" && (
          <div>
            <div style={{
              padding: "16px 20px", borderRadius: 14,
              background: "rgba(239,68,68,0.06)",
              border: "0.5px solid var(--crisis-border)",
              marginBottom: 24,
            }}>
              <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6, marginBottom: 4 }}>
                Take a moment to anchor your focus on your surroundings.
              </p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Click each sensory step to guide your mind back to the present moment.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {GROUNDING_TECHNIQUES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  style={{
                    padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                    border: step === i ? "1px solid rgba(59,130,246,0.4)" : "0.5px solid var(--border-secondary)",
                    background: step === i ? "rgba(59,130,246,0.08)" : "var(--bg-secondary)",
                    transition: "all 0.2s", textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: step === i ? "#93c5fd" : "var(--text-primary)" }}>
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
        )}

        {/* Tab 2: Calming Breathing */}
        {activeTab === "breathing" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              4-7-8 Deep Breathing
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 32 }}>
              Inhale for 4 seconds • Hold for 7 seconds • Exhale for 8 seconds
            </div>

            {/* Breathing Animation Circle */}
            <div style={{
              width: 180, height: 180, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(34,197,94,0.1) 70%)",
              border: "2px solid #3b82f6",
              margin: "0 auto 32px",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "pulse 4s ease-in-out infinite",
              boxShadow: "0 0 32px rgba(59,130,246,0.3)",
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#93c5fd" }}>
                Breathe...
              </div>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-tertiary)", maxWidth: 400, margin: "0 auto" }}>
              Focus completely on the sensation of your chest rising and falling. Slow breathing directly activates your parasympathetic nervous system.
            </p>
          </div>
        )}

        {/* Tab 3: Emergency Contacts */}
        {activeTab === "contacts" && (
          <div>
            <div style={{
              fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
            }}>
              Free 24/7 Crisis Helplines
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {CRISIS_RESOURCES.map((r, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", borderRadius: 12,
                  border: "0.5px solid var(--border-secondary)",
                  background: "var(--bg-secondary)",
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      {r.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                      {r.number}
                    </div>
                  </div>
                  <a
                    href={r.type === "whatsapp" ? `https://wa.me/${r.number}` : `tel:${r.number}`}
                    style={{
                      padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: r.type === "whatsapp" ? "rgba(34,197,94,0.15)" : "rgba(59,130,246,0.15)",
                      color: r.type === "whatsapp" ? "#86efac" : "#93c5fd",
                      border: r.type === "whatsapp" ? "0.5px solid rgba(34,197,94,0.3)" : "0.5px solid rgba(59,130,246,0.3)",
                      textDecoration: "none",
                    }}
                  >
                    {r.type === "whatsapp" ? "WhatsApp" : "Call Now"}
                  </a>
                </div>
              ))}
            </div>

            {/* Trusted Personal Contact */}
            <div style={{
              padding: "16px", borderRadius: 14,
              background: "var(--bg-glass)", border: "0.5px solid var(--border-secondary)",
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                Reach Out to a Trusted Person
              </div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 12 }}>
                Call or text a family member, friend, or caregiver.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="tel"
                  placeholder="Enter phone number..."
                  value={trustedNumber}
                  onChange={(e) => setTrustedNumber(e.target.value)}
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: 8,
                    background: "var(--bg-secondary)", border: "0.5px solid var(--border-secondary)",
                    color: "var(--text-primary)", fontSize: 13, outline: "none",
                  }}
                />
                <a
                  href={`tel:${trustedNumber}`}
                  style={{
                    padding: "10px 16px", borderRadius: 8,
                    background: trustedNumber ? "#22c55e" : "var(--bg-tertiary)",
                    color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none",
                    pointerEvents: trustedNumber ? "auto" : "none",
                  }}
                >
                  Call
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
