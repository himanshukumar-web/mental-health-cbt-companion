"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/contexts/AuthContext";
import ChatWindow from "@/components/ChatWindow";
import CrisisPanel from "@/components/CrisisPanel";
import Sidebar from "@/components/Sidebar";
import ChatHistorySidebar from "@/components/ChatHistorySidebar";
import { useChatHistory } from "@/hooks/useChatHistory";
import { usePersona } from "@/hooks/usePersona";

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
  const { user, loading } = useAuth();
  const [sessionId, setSessionId] = useState("");

  const { personas, activePersona, selectPersona, selectedPersonaId } = usePersona(user?.id);

  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    searchQuery,
    setSearchQuery,
    createConversation,
    renameConversation,
    pinConversation,
    archiveConversation,
    deleteConversation,
  } = useChatHistory(user?.id, selectedPersonaId);

  useEffect(() => {
    if (loading) return;

    const querySession = params.get("session") || params.get("conversation");
    if (querySession) {
      setSessionId(querySession);
    } else if (activeConversationId) {
      setSessionId(activeConversationId);
    } else if (user) {
      setSessionId(user.id);
    } else {
      let localSession = localStorage.getItem("sera_guest_session");
      if (!localSession) {
        localSession = crypto.randomUUID();
        localStorage.setItem("sera_guest_session", localSession);
      }
      setSessionId(localSession);
    }
  }, [user, loading, params, activeConversationId]);

  const { messages, wsState, crisis, routerSuggestion, sendMessage, dismissCrisis, dismissRouterSuggestion, manualReconnect } =
    useWebSocket(sessionId, user?.id);

  const handleNewChat = async () => {
    const newConv = await createConversation(selectedPersonaId);
    if (newConv) {
      setSessionId(newConv.id);
    }
  };

  const handleSelectConversation = (convId: string) => {
    setActiveConversationId(convId);
    setSessionId(convId);
  };

  if (!sessionId) {
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

  return (
    <div className="chat-root" style={{
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
        @supports (height: 100dvh) {
          .chat-root { height: 100dvh !important; }
        }
      `}</style>

      <style>{`
        @media (max-width: 767px) {
          .chat-main-wrapper { margin-left: 0 !important; }
          .chat-history-sidebar-wrapper { display: none !important; }
        }
      `}</style>

      {/* Main Global Sidebar */}
      <Sidebar />

      {/* Crisis overlay */}
      {crisis && <CrisisPanel onDismiss={dismissCrisis} userId={user?.id} sessionId={sessionId} />}

      <div className="chat-main-wrapper" style={{ flex: 1, marginLeft: user ? 250 : 0, height: "100%", overflow: "hidden", display: "flex" }}>
        {/* ChatGPT-style History Panel */}
        {user && (
          <div className="chat-history-sidebar-wrapper">
            <ChatHistorySidebar
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={handleSelectConversation}
              onNewChat={handleNewChat}
              onRename={renameConversation}
              onPin={pinConversation}
              onArchive={archiveConversation}
              onDelete={deleteConversation}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              personas={personas}
              activePersonaId={selectedPersonaId}
              onSelectPersona={selectPersona}
            />
          </div>
        )}

        {/* Main Conversation Window */}
        <div style={{ flex: 1, height: "100%", overflow: "hidden", position: "relative" }}>
          <ChatWindow
            messages={messages}
            wsState={wsState}
            isStreaming={wsState.isStreaming}
            crisis={crisis}
            onSend={(text, pId) => sendMessage(text, pId || selectedPersonaId)}
            onDismissCrisis={dismissCrisis}
            onReconnect={manualReconnect}
            user={user}
            sessionId={sessionId}
            routerSuggestion={routerSuggestion}
            onDismissRouterSuggestion={dismissRouterSuggestion}
          />
        </div>
      </div>
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
