"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/contexts/AuthContext";
import ChatWindow from "@/components/ChatWindow";
import CrisisPanel from "@/components/CrisisPanel";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasSupabase = typeof window !== "undefined" && !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    // If Supabase is configured and user is not logged in, redirect to login
    if (!loading && !user && hasSupabase) {
      router.replace("/login");
    }
  }, [user, loading, router, hasSupabase]);

  if (loading) {
    return (
      <div style={{
        height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-primary)",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg,#a7f3d0,#6ee7b7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, margin: "0 auto 16px",
            boxShadow: "0 0 20px rgba(34,197,94,0.3)",
          }}>🌿</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Loading your session…</div>
        </div>
      </div>
    );
  }

  if (hasSupabase && !user) {
    return (
      <div style={{
        height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-primary)",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid rgba(34,197,94,0.3)", borderTopColor: "#22c55e", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Redirecting to login…</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function ChatPageInner() {
  const params = useSearchParams();
  const [sessionId] = useState(() => params.get("session") ?? crypto.randomUUID());
  const { user } = useAuth();

  const { messages, wsState, crisis, sendMessage, dismissCrisis } =
    useWebSocket(sessionId);

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      fontFamily: "var(--font-sans)",
      overflow: "hidden",
      background: "var(--bg-primary)",
      position: "relative",
    }}>
      <style>{`
        @keyframes pulse   { 0%,100%{opacity:1}   50%{opacity:0.3}       }
        @keyframes bounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes slideUp { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>

      {/* Crisis overlay */}
      {crisis && <CrisisPanel onDismiss={dismissCrisis} />}

      {/* Main chat layout (sidebar + chat) */}
      <ChatWindow
        messages={messages}
        wsState={wsState}
        isStreaming={wsState.isStreaming}
        crisis={crisis}
        onSend={sendMessage}
        onDismissCrisis={dismissCrisis}
        user={user}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div style={{
        height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-primary)", color: "var(--text-secondary)", fontSize: 14,
      }}>
        Starting session…
      </div>
    }>
      <AuthGate>
        <ChatPageInner />
      </AuthGate>
    </Suspense>
  );
}
