"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function RoleSelectPage() {
  const { user, userRole, loading, updateRole } = useAuth();
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Auto-redirect if role already set
  useEffect(() => {
    if (!loading && user && userRole) {
      if (userRole === "admin") router.replace("/admin");
      else router.replace("/");
    }
  }, [user, userRole, loading, router]);

  const handleSelect = async (role: "user" | "admin") => {
    if (selecting) return;
    setSelecting(true);

    const err = await updateRole(role);
    if (err) {
      console.error("Failed to update role:", err);
      setSelecting(false);
      return;
    }

    // If admin, create doctor profile
    if (role === "admin" && user) {
      try {
        await fetch(`${API_URL}/doctors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            full_name: user.user_metadata?.full_name ?? user.email ?? "Doctor",
            specialization: "General CBT Therapist",
            bio: "",
            experience_years: 0,
          }),
        });
      } catch {
        // Doctor profile creation is best-effort
      }
    }

    if (role === "admin") router.push("/admin");
    else router.push("/");
  };

  if (loading || userRole) {
    return (
      <div style={{
        height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-primary)",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid rgba(34,197,94,0.3)", borderTopColor: "#22c55e",
          animation: "spin 0.8s linear infinite",
        }} />
      </div>
    );
  }

  const roles = [
    {
      id: "user" as const,
      icon: "👤",
      title: "I'm a Patient",
      subtitle: "Mental health support seeker",
      description: "Access CBT therapy sessions, book appointments with doctors, and track your mental wellness journey.",
      features: ["💬 AI CBT Therapy Chat", "📅 Book Appointments", "📊 Track Progress"],
      gradient: "linear-gradient(135deg, #22c55e, #16a34a)",
      glowColor: "rgba(34,197,94,0.15)",
      borderColor: "rgba(34,197,94,0.3)",
    },
    {
      id: "admin" as const,
      icon: "🩺",
      title: "I'm a Doctor",
      subtitle: "Mental health professional",
      description: "Manage your appointments, view patient sessions, and access your professional admin dashboard.",
      features: ["📋 Admin Dashboard", "👥 Manage Patients", "✅ Handle Appointments"],
      gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
      glowColor: "rgba(245,158,11,0.15)",
      borderColor: "rgba(245,158,11,0.3)",
    },
  ];

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--bg-primary)", padding: 24,
      position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlide { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* Background orbs */}
      <div style={{ position: "absolute", top: "5%", left: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ animation: "fadeSlide 0.5s ease", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "linear-gradient(135deg, #a7f3d0, #6ee7b7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, boxShadow: "0 0 24px rgba(34,197,94,0.3)",
          animation: "float 3s ease infinite",
        }}>🌿</div>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "var(--text-primary)" }}>Sera</span>
      </div>

      {/* Welcome text */}
      <div style={{ textAlign: "center", marginBottom: 48, animation: "fadeSlide 0.6s ease 0.1s both" }}>
        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 40px)",
          fontWeight: 700, color: "var(--text-primary)", marginBottom: 12,
          letterSpacing: "-0.02em",
        }}>
          Welcome, {user?.user_metadata?.full_name?.split(" ")[0] ?? "there"}! 👋
        </h1>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 500, lineHeight: 1.7 }}>
          Tell us who you are so we can personalize your experience
        </p>
      </div>

      {/* Role cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
        gap: 24, maxWidth: 720, width: "100%",
      }}>
        {roles.map((role, i) => {
          const isHovered = hoveredCard === role.id;
          return (
            <button
              key={role.id}
              id={`role-${role.id}`}
              onClick={() => handleSelect(role.id)}
              onMouseEnter={() => setHoveredCard(role.id)}
              onMouseLeave={() => setHoveredCard(null)}
              disabled={selecting}
              style={{
                padding: 0, border: "none", background: "none",
                textAlign: "left", cursor: selecting ? "default" : "pointer",
                animation: `fadeSlide 0.6s ease ${0.2 + i * 0.1}s both`,
              }}
            >
              <div style={{
                padding: "32px 28px", borderRadius: 20,
                background: isHovered ? "rgba(255,255,255,0.06)" : "var(--bg-glass)",
                border: `1px solid ${isHovered ? role.borderColor : "var(--border-secondary)"}`,
                backdropFilter: "blur(12px)",
                transition: "all 0.3s ease",
                transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                boxShadow: isHovered ? `0 12px 40px rgba(0,0,0,0.4), 0 0 40px ${role.glowColor}` : "0 4px 16px rgba(0,0,0,0.2)",
                position: "relative", overflow: "hidden",
              }}>
                {/* Glow effect */}
                {isHovered && (
                  <div style={{
                    position: "absolute", top: -40, right: -40,
                    width: 160, height: 160, borderRadius: "50%",
                    background: role.glowColor, pointerEvents: "none",
                    transition: "opacity 0.3s",
                  }} />
                )}

                {/* Icon */}
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: role.gradient,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, marginBottom: 20,
                  boxShadow: `0 4px 20px ${role.glowColor}`,
                  transition: "transform 0.3s",
                  transform: isHovered ? "scale(1.1)" : "scale(1)",
                }}>{role.icon}</div>

                {/* Title */}
                <h2 style={{
                  fontSize: 22, fontWeight: 700, color: "var(--text-primary)",
                  marginBottom: 4, fontFamily: "var(--font-display)",
                }}>{role.title}</h2>
                <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 16 }}>
                  {role.subtitle}
                </p>

                {/* Description */}
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
                  {role.description}
                </p>

                {/* Features */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {role.features.map((f, j) => (
                    <div key={j} style={{
                      fontSize: 13, color: "var(--text-secondary)",
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      {f}
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div style={{
                  marginTop: 24, padding: "12px 0",
                  textAlign: "center", borderRadius: 12,
                  background: isHovered ? role.gradient : "var(--bg-tertiary)",
                  color: isHovered ? "white" : "var(--text-secondary)",
                  fontSize: 14, fontWeight: 600,
                  transition: "all 0.3s",
                }}>
                  {selecting ? "Setting up..." : `Continue as ${role.id === "user" ? "Patient" : "Doctor"} →`}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <p style={{
        marginTop: 40, fontSize: 12, color: "var(--text-tertiary)",
        textAlign: "center", animation: "fadeSlide 0.6s ease 0.5s both",
      }}>
        You can always change this later from your settings
      </p>
    </div>
  );
}
