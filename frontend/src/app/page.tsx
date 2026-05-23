"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const FEATURES = [
  {
    icon: "🧠",
    title: "CBT-Based Techniques",
    desc: "Cognitive distortion identification, thought challenging, and evidence-based reframing.",
  },
  {
    icon: "🤝",
    title: "Two-Agent Architecture",
    desc: "A Therapist agent and a real-time Safety Monitor run in parallel on every message.",
  },
  {
    icon: "🛡",
    title: "Crisis Intercept Protocol",
    desc: "Instant UI pivot with grounding techniques and emergency resources when distress is detected.",
  },
  {
    icon: "🔒",
    title: "Encrypted & Private",
    desc: "All conversations are encrypted at rest. No personal data required to start.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const [starting, setStarting] = useState(false);

  const startSession = async () => {
    setStarting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/sessions`,
        { method: "POST" }
      );
      const data = await res.json();
      router.push(`/chat?session=${data.session_id}`);
    } catch {
      const localId = crypto.randomUUID();
      router.push(`/chat?session=${localId}`);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)", position: "relative", overflow: "hidden" }}>
      {/* Ambient orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "10%", left: "20%",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)",
          animation: "float 8s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "15%", right: "10%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)",
          animation: "float 10s ease-in-out infinite 2s",
        }} />
      </div>

      <div style={{
        maxWidth: 1100, margin: "0 auto", padding: "0 24px",
        display: "flex", flexDirection: "column", alignItems: "center",
        minHeight: "100vh",
      }}>
        {/* Navbar */}
        <nav style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "24px 0",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "linear-gradient(135deg, #a7f3d0, #6ee7b7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, boxShadow: "0 0 20px rgba(34,197,94,0.3)",
            }}>🌿</div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "var(--text-primary)" }}>Sera</span>
          </div>

          {/* Auth nav */}
          {!loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {user ? (
                <>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    {user.user_metadata?.full_name ?? user.email}
                  </span>
                  <button
                    onClick={startSession}
                    style={{
                      padding: "7px 16px", borderRadius: 10,
                      background: "linear-gradient(135deg,#22c55e,#16a34a)",
                      border: "none", color: "white", fontSize: 13, fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Open Sera →
                  </button>
                  <button
                    id="nav-signout"
                    onClick={() => signOut()}
                    style={{
                      padding: "7px 14px", borderRadius: 10,
                      border: "0.5px solid var(--border-secondary)",
                      background: "var(--bg-glass)", color: "var(--text-tertiary)",
                      fontSize: 13, cursor: "pointer",
                    }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" id="nav-login" style={{
                    padding: "7px 16px", borderRadius: 10,
                    border: "0.5px solid var(--border-secondary)",
                    background: "var(--bg-glass)", color: "var(--text-secondary)",
                    fontSize: 13, fontWeight: 500,
                  }}>
                    Sign in
                  </Link>
                  <Link href="/signup" id="nav-signup" style={{
                    padding: "7px 16px", borderRadius: 10,
                    background: "linear-gradient(135deg,#22c55e,#16a34a)",
                    border: "none", color: "white", fontSize: 13, fontWeight: 600,
                  }}>
                    Sign up free
                  </Link>
                </>
              )}
            </div>
          )}
        </nav>

        {/* Hero */}
        <section style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "80px 0 60px",
          animation: "fadeIn 0.8s ease",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 20, marginBottom: 32,
            border: "0.5px solid rgba(34,197,94,0.3)",
            background: "rgba(34,197,94,0.08)",
            fontSize: 12, color: "#86efac", fontWeight: 500,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 2s infinite" }} />
            LangGraph · Claude · WebSockets
          </div>

          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "clamp(42px, 6vw, 72px)", lineHeight: 1.1,
            color: "var(--text-primary)", marginBottom: 24,
            letterSpacing: "-0.02em",
          }}>
            Your AI{" "}
            <span style={{
              background: "linear-gradient(135deg, #22c55e, #86efac, #6ee7b7)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundSize: "200% 200%", animation: "gradientShift 4s ease infinite",
            }}>
              CBT Companion
            </span>
          </h1>

          <p style={{
            fontSize: "clamp(16px, 2vw, 20px)", color: "var(--text-secondary)",
            maxWidth: 560, lineHeight: 1.7, marginBottom: 48,
          }}>
            A real-time, multi-agent mental health companion that listens, supports, and
            responds with compassion — with a built-in safety guardrail that activates instantly.
          </p>

          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              id="start-session-btn"
              onClick={startSession}
              disabled={starting}
              style={{
                padding: "15px 36px", borderRadius: 14, border: "none",
                background: starting ? "rgba(34,197,94,0.4)" : "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "white", fontSize: 16, fontWeight: 600,
                cursor: starting ? "default" : "pointer",
                boxShadow: "0 4px 24px rgba(34,197,94,0.35)",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              {starting ? (
                <>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                  Starting…
                </>
              ) : user ? "Continue Session →" : "Try it free →"}
            </button>
            {!user && (
              <Link href="/signup" style={{
                padding: "15px 28px", borderRadius: 14,
                border: "0.5px solid var(--border-primary)",
                background: "var(--bg-glass)", color: "var(--text-secondary)",
                fontSize: 15, fontWeight: 500,
              }}>
                Create account
              </Link>
            )}
          </div>

          <p style={{ marginTop: 20, fontSize: 12, color: "var(--text-tertiary)" }}>
            {user ? `Signed in as ${user.email}` : "No account needed · Anonymous session · Not a replacement for professional therapy"}
          </p>
        </section>

        {/* Features */}
        <section id="how" style={{ width: "100%", paddingBottom: 80 }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                padding: "24px 20px", borderRadius: 16,
                border: "0.5px solid var(--border-secondary)",
                background: "var(--bg-glass)",
                backdropFilter: "blur(12px)",
                animation: `fadeIn 0.6s ease ${i * 0.1}s both`,
                transition: "all 0.25s",
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          width: "100%", padding: "20px 0", textAlign: "center",
          borderTop: "0.5px solid var(--border-tertiary)",
          fontSize: 12, color: "var(--text-tertiary)",
        }}>
          Sera is not a licensed therapist. In crisis? Call iCall: 9152987821 (India)
        </footer>
      </div>
    </main>
  );
}
