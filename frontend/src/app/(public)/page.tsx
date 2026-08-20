"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ThemeSelector from "@/components/ThemeSelector";

const FEATURES = [
  {
    icon: "💬",
    title: "AI CBT Therapy Chat",
    desc: "A dual-agent (Therapist + Safety Monitor) streaming experience for evidence-based CBT reframing.",
  },
  {
    icon: "😊",
    title: "Daily Mood Tracker",
    desc: "Track daily mood, stress, anxiety, energy, sleep, and water intake with visual histories.",
  },
  {
    icon: "📝",
    title: "AI-Powered Journal",
    desc: "Write freely while MindMate automatically analyzes sentiment, emotional tones, and key insights.",
  },
  {
    icon: "✅",
    title: "Mindful Habit Tracker",
    desc: "Build consistency with habit completion rings, streak counters, and weekly grids.",
  },
  {
    icon: "📊",
    title: "Wellness Analytics",
    desc: "Visualize correlations between sleep, stress, and mood with interactive Recharts charts.",
  },
  {
    icon: "🧠",
    title: "CBT Thought Challenging",
    desc: "Identify cognitive distortions and generate structured balanced alternative thoughts.",
  },
  {
    icon: "💭",
    title: "Nuanced Emotion Detection",
    desc: "Detect complex underlying emotions like anxiety, burnout, loneliness, and confidence.",
  },
  {
    icon: "📅",
    title: "Doctor Appointments",
    desc: "Book direct consultations with human specialists and manage your appointment calendar.",
  },
];

import { isCapacitorNative } from "@/lib/platform";

export default function LandingPage() {
  const router = useRouter();
  const { user, userRole, signOut, loading } = useAuth();
  const [isNative, setIsNative] = useState<boolean>(() => isCapacitorNative());

  useEffect(() => {
    if (isCapacitorNative()) {
      setIsNative(true);
    }
  }, []);

  // Handle routing for both Android Native and Web
  useEffect(() => {
    if (loading) return;

    if (isNative) {
      // Android Capacitor Native: Direct to login if not authenticated, or dashboard if authenticated
      if (user) {
        router.replace(userRole === "admin" ? "/admin" : "/dashboard");
      } else {
        router.replace("/login");
      }
    } else {
      // Web / Desktop: Redirect logged-in users to dashboard, otherwise prefetch chat
      if (user) {
        router.replace(userRole === "admin" ? "/admin" : "/dashboard");
      } else {
        router.prefetch("/chat");
      }
    }
  }, [user, userRole, loading, isNative, router]);

  // If on Android Capacitor native, prevent flashing the marketing landing page
  if (isNative) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg-primary, #0b0f1a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, margin: "0 auto 16px",
            boxShadow: "0 4px 20px rgba(34,197,94,0.35)",
          }}>🌿</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary, #8b95a7)" }}>Opening MindMate…</div>
        </div>
      </main>
    );
  }

  const startSession = () => {
    if (user) {
      // Logged-in users: continue their existing session (uses user.id internally)
      router.push("/chat");
    } else {
      // Guests: create a new anonymous session
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
        maxWidth: 1100, margin: "0 auto", padding: "0 16px",
        display: "flex", flexDirection: "column", alignItems: "center",
        minHeight: "100vh",
      }}>
        {/* Navbar */}
        <nav style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "16px 0",
          flexWrap: "wrap", gap: 10,
        }}>
          {/* Logo & Theme */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--logo-gap, 10px)" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "var(--logo-gap, 10px)" }}>
              <div className="nav-logo-icon">🌿</div>
              <span className="nav-logo-text">MindMate</span>
            </Link>
            <ThemeSelector />
          </div>

          {/* Auth nav */}
          {!loading && (
            <div className="nav-auth-container">
              {user ? (
                <>
                  <span className="nav-username">
                    {user.user_metadata?.full_name ?? user.email}
                  </span>

                  {/* Admin dashboard link for doctors */}
                  {userRole === "admin" && (
                    <Link href="/admin" id="nav-admin-dashboard" className="nav-btn nav-btn-admin">
                      🩺 Admin
                    </Link>
                  )}


                  <button
                    id="nav-signout"
                    onClick={() => signOut()}
                    className="nav-btn nav-btn-secondary"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" id="nav-login" className="nav-btn nav-btn-secondary">
                    Sign in
                  </Link>
                  <Link href="/signup" id="nav-signup" className="nav-btn nav-btn-primary">
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
          textAlign: "center", padding: "40px 0 40px",
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

          <div className="hero-cta-container">
            <button
              id="start-session-btn"
              onClick={startSession}
              className="hero-cta-button"
              style={{
                padding: "14px 28px", borderRadius: 14, border: "none",
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "white", fontSize: 15, fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 24px rgba(34,197,94,0.35)",
                transition: "all 0.2s",
              }}
            >
              {user ? "Continue Session →" : "Try it free →"}
            </button>

            {user && userRole === "admin" && (
              <>
                <Link href="/admin?tab=appointments" className="hero-cta-button" style={{
                  padding: "14px 28px", borderRadius: 14,
                  border: "0.5px solid rgba(245,158,11,0.3)",
                  background: "rgba(245,158,11,0.08)", color: "#fcd34d",
                  fontSize: 15, fontWeight: 500,
                }}>
                  📅 Manage Appointments
                </Link>
                <Link href="/admin?tab=chat" className="hero-cta-button" style={{
                  padding: "14px 28px", borderRadius: 14,
                  border: "0.5px solid rgba(59,130,246,0.3)",
                  background: "rgba(59,130,246,0.08)", color: "#93c5fd",
                  fontSize: 15, fontWeight: 500,
                }}>
                  💬 Chat with Patient
                </Link>
              </>
            )}

            {user && userRole !== "admin" && (
              <>
                <Link href="/appointments" className="hero-cta-button" style={{
                  padding: "14px 28px", borderRadius: 14,
                  border: "0.5px solid rgba(34,197,94,0.3)",
                  background: "rgba(34,197,94,0.08)", color: "#86efac",
                  fontSize: 15, fontWeight: 500,
                }}>
                  📅 Book Appointment
                </Link>
                <Link href="/appointments/my?tab=chat" className="hero-cta-button" style={{
                  padding: "14px 28px", borderRadius: 14,
                  border: "0.5px solid rgba(59,130,246,0.3)",
                  background: "rgba(59,130,246,0.08)", color: "#93c5fd",
                  fontSize: 15, fontWeight: 500,
                }}>
                  💬 Chat with Doctor
                </Link>
              </>
            )}

            {!user && (
              <Link href="/signup" className="hero-cta-button" style={{
                padding: "14px 28px", borderRadius: 14,
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
            gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
            gap: 12,
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
          MindMate is not a licensed therapist. In crisis? Call iCall: 9152987821 (India)
        </footer>
      </div>
    </main>
  );
}
