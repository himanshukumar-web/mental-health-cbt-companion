"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AndroidMobileLayout from "./AndroidMobileLayout";
import { MD3Button } from "./ui/Button";
import { MD3Input } from "./ui/Input";
import { MD3Card } from "./ui/Card";

export default function AndroidAuth({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [agreed, setAgreed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in email and password.");
      return;
    }
    setError("");
    setLoading(true);
    const err = await signIn(email, password);
    if (err) {
      setError(err);
      setLoading(false);
    } else {
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 400);
    }
  };

  const handleSignup = async () => {
    if (!name || !email || password.length < 6 || !agreed) {
      setError("Please complete all required fields.");
      return;
    }
    setError("");
    setLoading(true);
    const err = await signUp(email, password, name, role);
    if (err) {
      setError(err);
      setLoading(false);
    } else {
      setDone(true);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    const err = await signInWithGoogle();
    if (err) setError(err);
  };

  return (
    <AndroidMobileLayout hasBottomNav={false}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px 16px",
          minHeight: "100dvh",
          boxSizing: "border-box",
        }}
      >
        {/* Mobile Header Branding */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              boxShadow: "0 8px 24px rgba(34, 197, 94, 0.3)",
              marginBottom: "12px",
            }}
          >
            🌿
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#e8edf5", margin: "0 0 4px 0", letterSpacing: "-0.02em" }}>
            Sera Companion
          </h1>
          <p style={{ fontSize: "14px", color: "#8b95a7", margin: 0 }}>Your personal CBT mental health space</p>
        </div>

        {/* Auth Mode Toggle Pill */}
        <div
          style={{
            display: "flex",
            width: "92%",
            maxWidth: "420px",
            background: "rgba(255, 255, 255, 0.06)",
            borderRadius: "100px",
            padding: "4px",
            marginBottom: "20px",
            boxSizing: "border-box",
          }}
        >
          <button
            onClick={() => {
              setMode("login");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "100px",
              border: "none",
              background: mode === "login" ? "linear-gradient(135deg, #22c55e, #16a34a)" : "transparent",
              color: mode === "login" ? "#ffffff" : "#8b95a7",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode("signup");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "100px",
              border: "none",
              background: mode === "signup" ? "linear-gradient(135deg, #22c55e, #16a34a)" : "transparent",
              color: mode === "signup" ? "#ffffff" : "#8b95a7",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Main Material 3 Auth Card - 92% width, max 420dp, 24dp padding, 24dp radius */}
        <MD3Card
          variant="elevated"
          style={{
            width: "92%",
            maxWidth: "420px",
            padding: "24px",
            borderRadius: "24px",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.45)",
            boxSizing: "border-box",
          }}
        >
          {error && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "14px",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#fca5a5",
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {done && mode === "signup" ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📬</div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#e8edf5", marginBottom: "8px" }}>Check your email</h3>
              <p style={{ fontSize: "13px", color: "#8b95a7", lineHeight: 1.5, marginBottom: "20px" }}>
                We sent a confirmation link to <strong style={{ color: "#e8edf5" }}>{email}</strong>.
              </p>
              <MD3Button fullWidth onClick={() => setMode("login")}>
                Return to Sign In
              </MD3Button>
            </div>
          ) : mode === "login" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <MD3Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leadingIcon="✉"
                autoCapitalize="none"
                autoCorrect="off"
              />
              <MD3Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leadingIcon="🔒"
              />

              <MD3Button fullWidth loading={loading} onClick={handleLogin} style={{ marginTop: "8px" }}>
                {done ? "Signed In! Redirecting..." : "Sign In"}
              </MD3Button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  margin: "18px 0",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1, height: "1px", background: "rgba(255, 255, 255, 0.1)" }} />
                <span style={{ fontSize: "12px", color: "#8b95a7" }}>or</span>
                <div style={{ flex: 1, height: "1px", background: "rgba(255, 255, 255, 0.1)" }} />
              </div>

              <MD3Button variant="outlined" fullWidth onClick={handleGoogleSignIn} icon="🌐">
                Continue with Google
              </MD3Button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {/* Role Picker */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#8b95a7", display: "block", marginBottom: "8px" }}>
                  I AM A
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setRole("user")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "14px",
                      border: role === "user" ? "1.5px solid #22c55e" : "1px solid rgba(255, 255, 255, 0.1)",
                      background: role === "user" ? "rgba(34, 197, 94, 0.1)" : "rgba(255, 255, 255, 0.04)",
                      color: role === "user" ? "#4ade80" : "#8b95a7",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    👤 Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "14px",
                      border: role === "admin" ? "1.5px solid #f59e0b" : "1px solid rgba(255, 255, 255, 0.1)",
                      background: role === "admin" ? "rgba(245, 158, 11, 0.1)" : "rgba(255, 255, 255, 0.04)",
                      color: role === "admin" ? "#fbbf24" : "#8b95a7",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🩺 Doctor
                  </button>
                </div>
              </div>

              <MD3Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leadingIcon="👤"
              />
              <MD3Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leadingIcon="✉"
                autoCapitalize="none"
                autoCorrect="off"
              />
              <MD3Input
                label="Password"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leadingIcon="🔒"
              />

              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  margin: "8px 0 16px 0",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{ marginTop: "3px", accentColor: "#22c55e" }}
                />
                <span style={{ fontSize: "12px", color: "#8b95a7", lineHeight: 1.4 }}>
                  I understand Sera is a supportive CBT tool, not a medical emergency service.
                </span>
              </label>

              <MD3Button fullWidth loading={loading} onClick={handleSignup}>
                Create Account
              </MD3Button>
            </div>
          )}
        </MD3Card>
      </div>
    </AndroidMobileLayout>
  );
}
