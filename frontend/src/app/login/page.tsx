"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";

const TAGLINES = [
  "A safe space to think clearly.",
  "CBT-guided. Always listening.",
  "Your mind, supported.",
];

function Leaf({ x, y, size, opacity, rotate }: {
  x: string; y: string; size: number; opacity: number; rotate: number;
}) {
  return (
    <div style={{
      position: "absolute", left: x, top: y,
      width: size, height: size, opacity,
      transform: `rotate(${rotate}deg)`,
      borderRadius: "50% 0 50% 0",
      background: "linear-gradient(135deg, rgba(34,197,94,0.4), rgba(22,163,74,0.3))",
      pointerEvents: "none",
    }} />
  );
}

function InputField({ label, type, value, onChange, placeholder, icon }: {
  label: string; type: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string; icon: string;
}) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#8b95a7", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </label>
      <div style={{
        display: "flex", alignItems: "center",
        border: focused ? "1.5px solid #22c55e" : "1px solid rgba(255,255,255,0.10)",
        borderRadius: 12, overflow: "hidden",
        background: focused ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.04)",
        transition: "all 0.2s",
      }}>
        <span style={{ padding: "0 12px", color: focused ? "#22c55e" : "#4b5563", fontSize: 16 }}>{icon}</span>
        <input
          type={type === "password" && show ? "text" : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, padding: "12px 0", fontSize: 14,
            border: "none", background: "transparent", outline: "none",
            color: "#e8edf5", fontFamily: "inherit",
          }}
        />
        {type === "password" && (
          <button onClick={() => setShow(s => !s)} style={{
            padding: "0 12px", background: "none", border: "none",
            cursor: "pointer", color: "#8b95a7", fontSize: 14,
          }}>
            {show ? "Hide" : "Show"}
          </button>
        )}
      </div>
    </div>
  );
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setError("");
    setLoading(true);
    const err = await signIn(email, password);
    if (err) { setError(err); setLoading(false); }
    else { setDone(true); setTimeout(() => router.push("/role-select"), 800); }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: "#e8edf5", margin: "0 0 6px" }}>Welcome back</h2>
        <p style={{ fontSize: 14, color: "#8b95a7", margin: 0 }}>Continue your journey with Sera</p>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 16, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 13, color: "#fca5a5" }}>
          ⚠ {error}
        </div>
      )}

      <InputField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" icon="✉" />
      <InputField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" icon="🔒" />

      <div style={{ textAlign: "right", marginBottom: 20 }}>
        <button style={{ background: "none", border: "none", fontSize: 13, color: "#22c55e", cursor: "pointer", fontFamily: "inherit" }}>
          Forgot password?
        </button>
      </div>

      <button
        id="login-submit"
        onClick={handleLogin}
        disabled={loading || done}
        style={{
          width: "100%", padding: "13px", borderRadius: 12, border: "none",
          background: done ? "rgba(34,197,94,0.2)" : loading ? "rgba(34,197,94,0.4)" : "linear-gradient(135deg, #22c55e, #16a34a)",
          color: done ? "#86efac" : "white",
          fontSize: 15, fontWeight: 600, cursor: loading || done ? "default" : "pointer",
          fontFamily: "inherit", transition: "all 0.3s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: done || loading ? "none" : "0 4px 24px rgba(34,197,94,0.25)",
        }}
      >
        {done ? "✓ Signed in — redirecting..." : loading ? (
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            Signing in...
          </span>
        ) : "Sign in"}
      </button>

      <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        <span style={{ fontSize: 12, color: "#4b5563" }}>or</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
      </div>

      <button style={{
        width: "100%", marginTop: 16, padding: "12px", borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)",
        fontSize: 14, color: "#e8edf5", cursor: "pointer",
        fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        transition: "background 0.2s",
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#8b95a7" }}>
        New here?{" "}
        <button onClick={onSwitch} style={{ background: "none", border: "none", color: "#22c55e", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>
          Create an account
        </button>
      </p>
    </div>
  );
}

function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const valid = !!(name && email && password.length >= 6 && agreed);

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColor = ["#4b5563", "#ef4444", "#f59e0b", "#22c55e"][strength];
  const strengthLabel = ["", "Weak", "Fair", "Strong"][strength];

  const handleSignup = async () => {
    if (!valid) return;
    setError("");
    setLoading(true);
    const err = await signUp(email, password, name, role);
    if (err) { setError(err); setLoading(false); }
    else setDone(true);
  };

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>📬</div>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: "#e8edf5", marginBottom: 12 }}>Check your email</h3>
        <p style={{ fontSize: 14, color: "#8b95a7", lineHeight: 1.7, marginBottom: 24 }}>
          We sent a confirmation link to <strong style={{ color: "#e8edf5" }}>{email}</strong>.<br />
          Click it to activate your account, then sign in.
        </p>
        <button onClick={onSwitch} style={{
          padding: "10px 24px", borderRadius: 10, border: "none",
          background: "linear-gradient(135deg,#22c55e,#16a34a)",
          color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
          boxShadow: "0 4px 24px rgba(34,197,94,0.25)",
        }}>
          Go to Sign in →
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: "#e8edf5", margin: "0 0 6px" }}>Start your journey</h2>
        <p style={{ fontSize: 14, color: "#8b95a7", margin: 0 }}>Free, private, and always available</p>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 16, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 13, color: "#fca5a5" }}>
          ⚠ {error}
        </div>
      )}

      {/* Role toggle */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#8b95a7", marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          I am a
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          {([
            { id: "user" as const, icon: "👤", label: "Patient", desc: "Seeking support" },
            { id: "admin" as const, icon: "🩺", label: "Doctor", desc: "Mental health professional" },
          ]).map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              style={{
                flex: 1, padding: "14px 12px", borderRadius: 12,
                border: role === r.id
                  ? r.id === "admin" ? "1.5px solid rgba(245,158,11,0.5)" : "1.5px solid rgba(34,197,94,0.5)"
                  : "1px solid rgba(255,255,255,0.10)",
                background: role === r.id
                  ? r.id === "admin" ? "rgba(245,158,11,0.08)" : "rgba(34,197,94,0.08)"
                  : "rgba(255,255,255,0.04)",
                cursor: "pointer", textAlign: "left",
                transition: "all 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>{r.icon}</span>
                <span style={{
                  fontSize: 14, fontWeight: 600,
                  color: role === r.id ? "#e8edf5" : "#8b95a7",
                }}>{r.label}</span>
              </div>
              <div style={{ fontSize: 11, color: "#4b5563", paddingLeft: 26 }}>{r.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <InputField label="Full name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" icon="👤" />
      <InputField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" icon="✉" />

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#8b95a7", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Password
        </label>
        <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, overflow: "hidden", background: "rgba(255,255,255,0.04)" }}>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            style={{ width: "100%", padding: "12px 14px", fontSize: 14, border: "none", background: "transparent", outline: "none", color: "#e8edf5", fontFamily: "inherit", boxSizing: "border-box" }}
          />
        </div>
        {password.length > 0 && (
          <div style={{ marginTop: 8, display: "flex", gap: 4, alignItems: "center" }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 4, background: i <= strength ? strengthColor : "rgba(255,255,255,0.08)", transition: "background 0.3s" }} />
            ))}
            <span style={{ fontSize: 11, color: strengthColor, marginLeft: 6, fontWeight: 500, minWidth: 36 }}>{strengthLabel}</span>
          </div>
        )}
      </div>

      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 20, cursor: "pointer" }}>
        <div
          onClick={() => setAgreed(a => !a)}
          style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
            border: agreed ? "none" : "1.5px solid rgba(255,255,255,0.15)",
            background: agreed ? "#22c55e" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s", cursor: "pointer",
          }}
        >
          {agreed && <span style={{ color: "white", fontSize: 11, fontWeight: 700 }}>✓</span>}
        </div>
        <span style={{ fontSize: 13, color: "#8b95a7", lineHeight: 1.5 }}>
          I understand Sera is a supportive tool, not a replacement for professional mental health care.
        </span>
      </label>

      <button
        id="signup-submit"
        onClick={handleSignup}
        disabled={!valid || loading}
        style={{
          width: "100%", padding: "13px", borderRadius: 12, border: "none",
          background: !valid ? "rgba(255,255,255,0.06)" : loading ? "rgba(34,197,94,0.4)" : "linear-gradient(135deg, #22c55e, #16a34a)",
          color: !valid ? "#4b5563" : "white",
          fontSize: 15, fontWeight: 600, cursor: valid && !loading ? "pointer" : "default",
          fontFamily: "inherit", transition: "all 0.3s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: valid && !loading ? "0 4px 24px rgba(34,197,94,0.25)" : "none",
        }}
      >
        {loading ? (
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            Creating account...
          </span>
        ) : "Create account"}
      </button>

      <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#8b95a7" }}>
        Already have an account?{" "}
        <button onClick={onSwitch} style={{ background: "none", border: "none", color: "#22c55e", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>
          Sign in
        </button>
      </p>
    </div>
  );
}

// ── Reads ?mode=signup from URL to pre-select tab ─────────────────────────────

function AuthPageInner() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(
    params.get("mode") === "signup" ? "signup" : "login"
  );
  const [tagline] = useState(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)]);

  // Already signed in — redirect based on role
  useEffect(() => {
    if (!loading && user) {
      if (userRole) {
        if (userRole === "admin") router.replace("/admin");
        else router.replace("/");
      } else {
        router.replace("/role-select");
      }
    }
  }, [user, userRole, loading, router]);

  const leaves = [
    { x: "8%", y: "12%", size: 40, opacity: 0.15, rotate: 20 },
    { x: "88%", y: "8%", size: 28, opacity: 0.12, rotate: -15 },
    { x: "5%", y: "75%", size: 22, opacity: 0.1, rotate: 45 },
    { x: "91%", y: "65%", size: 50, opacity: 0.08, rotate: -30 },
    { x: "50%", y: "88%", size: 18, opacity: 0.1, rotate: 10 },
    { x: "75%", y: "30%", size: 14, opacity: 0.12, rotate: 60 },
  ];

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg, #0b0f1a 0%, #111827 50%, #0b0f1a 100%)",
      padding: 20, fontFamily: "'system-ui', sans-serif", position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes fadeSlide { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @media (max-width: 640px) {
          .login-left-panel { display: none !important; }
          .login-card { flex-direction: column !important; max-width: 100% !important; border-radius: 16px !important; }
          .login-form-panel { padding: 24px 20px !important; }
        }
      `}</style>

      {/* Ambient glow orbs */}
      <div style={{ position: "absolute", top: "10%", left: "15%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

      {leaves.map((l, i) => <Leaf key={i} {...l} />)}

      <div className="login-card" style={{
        display: "flex", width: "100%", maxWidth: 880,
        borderRadius: 24, overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)",
        border: "0.5px solid rgba(255,255,255,0.06)",
        animation: "fadeSlide 0.5s ease",
      }}>
        {/* Left green panel */}
        <div className="login-left-panel" style={{
          width: 340, flexShrink: 0,
          background: "linear-gradient(160deg, #059669 0%, #047857 50%, #065f46 100%)",
          padding: "48px 36px", display: "flex", flexDirection: "column",
          justifyContent: "space-between", position: "relative", overflow: "hidden",
        }}>
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "absolute", bottom: -60, left: -40, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, animation: "float 3s ease infinite",
              }}>🌿</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>Sera</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em" }}>CBT COMPANION</div>
              </div>
            </div>

            <h1 style={{ fontSize: 28, fontWeight: 700, color: "white", lineHeight: 1.3, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              Think clearer.<br />Feel better.
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, margin: 0 }}>
              {tagline}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: "🧠", text: "Evidence-based CBT techniques" },
              { icon: "🛡", text: "Real-time crisis detection" },
              { icon: "📅", text: "Doctor appointment booking" },
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                }}>{f.icon}</div>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{f.text}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.6 }}>
            Not a substitute for professional mental health care.<br />
            In crisis, call 9152987821 (India).
          </p>
        </div>

        {/* Right form panel — DARK */}
        <div className="login-form-panel" style={{ flex: 1, background: "#111827", padding: "48px 40px", overflowY: "auto" }}>
          {/* Tab switcher */}
          <div style={{ display: "flex", marginBottom: 32, gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
            {(["login", "signup"] as const).map(m => (
              <button
                key={m}
                id={`tab-${m}`}
                onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: "8px", borderRadius: 8, border: "none",
                  background: mode === m ? "rgba(255,255,255,0.08)" : "transparent",
                  color: mode === m ? "#e8edf5" : "#4b5563",
                  fontSize: 13, fontWeight: mode === m ? 600 : 400,
                  cursor: "pointer", fontFamily: "inherit",
                  boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
                  transition: "all 0.2s",
                }}
              >
                {m === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {/* Animated form swap */}
          <div key={mode} style={{ animation: "fadeSlide 0.3s ease" }}>
            {mode === "login"
              ? <LoginForm onSwitch={() => setMode("signup")} />
              : <SignupForm onSwitch={() => setMode("login")} />
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  );
}
