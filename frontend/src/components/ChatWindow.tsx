"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { AgentStatus, ChatMessage, WSState } from "@/hooks/useWebSocket";
import { useAuth } from "@/contexts/AuthContext";
import VoiceController from "@/components/VoiceController";
import PersonaSelector from "@/components/PersonaSelector";
import WellnessPanel from "@/components/WellnessPanel";
import MobileBottomNav from "@/components/MobileBottomNav";
import { usePersona } from "@/hooks/usePersona";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// ── Lightweight Markdown Renderer ──────────────────────────────────────────────
function renderMarkdown(text: string) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { i++; continue; }

    const numMatch = trimmed.match(/^(\d+)[.)\-]\s+(.+)/);
    if (numMatch) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length) {
        const cur = lines[i].trim();
        const m = cur.match(/^(\d+)[.)\-]\s+(.+)/);
        if (!m) break;
        listItems.push(
          <li key={i} style={{ marginBottom: 4, lineHeight: 1.6 }}>
            {formatInline(m[2])}
          </li>
        );
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ margin: "6px 0", paddingLeft: 20, listStyleType: "decimal" }}>
          {listItems}
        </ol>
      );
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length) {
        const cur = lines[i].trim();
        const m = cur.match(/^[-*•]\s+(.+)/);
        if (!m) break;
        listItems.push(
          <li key={i} style={{ marginBottom: 4, lineHeight: 1.6 }}>
            {formatInline(m[1])}
          </li>
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: "6px 0", paddingLeft: 20, listStyleType: "disc" }}>
          {listItems}
        </ul>
      );
      continue;
    }

    elements.push(
      <p key={i} style={{ margin: "4px 0", lineHeight: 1.6 }}>
        {formatInline(trimmed)}
      </p>
    );
    i++;
  }

  return <>{elements}</>;
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

const QUICK_ACTIONS = [
  { icon: "🧘", title: "Talk About Anxiety", prompt: "I'm feeling overwhelmed by anxiety right now and need guidance." },
  { icon: "😴", title: "Sleep Better", prompt: "Help me unwind and relax so I can sleep better tonight." },
  { icon: "🎓", title: "Exam & Study Stress", prompt: "I have exam stress and need help managing my study focus." },
  { icon: "🧠", title: "Challenge Negative Thought", prompt: "Help me reframe an unhelpful negative automatic thought." },
  { icon: "🫁", title: "Grounding Exercise", prompt: "Guide me through a quick 5-4-3-2-1 sensory grounding exercise." },
];

interface ChatWindowProps {
  messages: ChatMessage[];
  wsState: WSState;
  isStreaming: boolean;
  crisis: boolean;
  onSend: (text: string, personaId?: string) => void;
  onDismissCrisis: () => void;
  onReconnect?: () => void;
  user?: User | null;
  sessionId: string;
}

export default function ChatWindow({
  messages,
  wsState,
  isStreaming,
  crisis,
  onSend,
  onDismissCrisis,
  onReconnect,
  user,
  sessionId,
}: ChatWindowProps) {
  const router = useRouter();
  const { personas, activePersona, selectPersona, selectedPersonaId } = usePersona(user?.id);
  const [input, setInput] = useState("");
  const [sessionTime, setSessionTime] = useState(0);
  const [showPersonaBar, setShowPersonaBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarkedIndexes, setBookmarkedIndexes] = useState<number[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Timer for session duration
  useEffect(() => {
    const t = setInterval(() => setSessionTime((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto scroll on new message or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Auto grow textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming || crisis) return;
    setInput("");
    onSend(text, selectedPersonaId);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [input, isStreaming, crisis, onSend, selectedPersonaId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyMessageContent = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Message copied to clipboard! 📋");
  };

  const toggleBookmark = (index: number) => {
    if (bookmarkedIndexes.includes(index)) {
      setBookmarkedIndexes(prev => prev.filter(i => i !== index));
      toast("Bookmark removed", { icon: "🔖" });
    } else {
      setBookmarkedIndexes(prev => [...prev, index]);
      toast.success("Saved to Bookmarked Therapy Insights! 📌");
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Friend";

  const filteredMessages = searchQuery
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        flexDirection: "row",
        position: "relative",
        background: "var(--bg-primary)",
        overflow: "hidden",
      }}
    >
      <style>{`
        @media (max-width: 767px) {
          .chat-messages-container {
            padding: 12px 12px 165px !important;
          }
          .chat-floating-input-container {
            bottom: calc(82px + env(safe-area-inset-bottom, 0px)) !important;
            left: 10px !important;
            right: 10px !important;
          }
        }
      `}</style>

      {/* Main Chat Conversation Center Column */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          position: "relative",
          minWidth: 0,
        }}
      >
        {/* Sleek Top Header Bar (56px) */}
        <header
          style={{
            height: 56,
            padding: "0 20px",
            background: "rgba(11, 15, 26, 0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid var(--border-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          {/* Active Therapist Persona Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              onClick={() => setShowPersonaBar(!showPersonaBar)}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${activePersona.color}40, ${activePersona.color}90)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                border: `2px solid ${activePersona.color}`,
                cursor: "pointer",
                boxShadow: `0 0 12px ${activePersona.color}40`,
              }}
            >
              {activePersona.avatar}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>
                  {activePersona.name}
                </span>
                <button
                  onClick={() => setShowPersonaBar(!showPersonaBar)}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 8,
                    background: `${activePersona.color}20`,
                    border: `1px solid ${activePersona.color}50`,
                    color: activePersona.color,
                    cursor: "pointer",
                  }}
                >
                  {showPersonaBar ? "Hide Switcher" : "Switch Persona ▾"}
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 500 }}>
                {activePersona.title}
              </div>
            </div>
          </div>

          {/* Search Chat Input & Timer */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="text"
              placeholder="🔍 Search chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "5px 10px",
                borderRadius: 10,
                background: "var(--bg-glass)",
                border: "1px solid var(--border-secondary)",
                color: "var(--text-primary)",
                fontSize: 12,
                outline: "none",
                width: 130,
              }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-tertiary)" }}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: wsState.isConnected ? "#22c55e" : "#ef4444",
                  boxShadow: wsState.isConnected ? "0 0 8px #22c55e" : "none",
                }}
              />
              <span>{wsState.isConnected ? "Online" : "Connecting..."}</span>
            </div>

            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-secondary)",
                padding: "4px 10px",
                borderRadius: 8,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-secondary)",
              }}
            >
              ⏱️ {formatTime(sessionTime)}
            </div>
          </div>
        </header>

        {/* Collapsible Persona Selector Cards Header */}
        <AnimatePresence>
          {showPersonaBar && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                padding: 16,
                background: "var(--bg-secondary)",
                borderBottom: "1px solid var(--border-secondary)",
                zIndex: 9,
              }}
            >
              <PersonaSelector
                personas={personas}
                activePersonaId={selectedPersonaId}
                onSelectPersona={(id) => {
                  selectPersona(id);
                  setShowPersonaBar(false);
                }}
                compact={false}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Container Area */}
        <div
          className="custom-scrollbar chat-messages-container"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 20px 100px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxWidth: 860,
            width: "100%",
            margin: "0 auto",
          }}
        >
          {/* Hero Welcome Card (Shown when messages.length === 0) */}
          {messages.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 10 }}>
              {/* Hero Card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: 24,
                  borderRadius: 24,
                  background: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(59,130,246,0.08))",
                  border: "1px solid rgba(34,197,94,0.25)",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${activePersona.color}40, ${activePersona.color}90)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                      boxShadow: `0 0 16px ${activePersona.color}40`,
                    }}
                  >
                    {activePersona.avatar}
                  </div>

                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-display)" }}>
                      Welcome back, {displayName} ✨
                    </h2>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 0" }}>
                      I am <strong>{activePersona.name}</strong>, your active {activePersona.title.toLowerCase()}. How can I support your mind today?
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Quick Action Prompt Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-tertiary)", letterSpacing: "0.08em" }}>
                  Quick Therapy Starters
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                  {QUICK_ACTIONS.map((item, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSend(item.prompt, selectedPersonaId)}
                      style={{
                        padding: "14px 16px",
                        borderRadius: 16,
                        background: "var(--bg-glass)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid var(--border-secondary)",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{item.icon}</span>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.3 }}>{item.prompt}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Render Conversation Messages */
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {filteredMessages.map((msg, index) => {
                const isUser = msg.role === "user";
                const isBookmarked = bookmarkedIndexes.includes(index);

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignSelf: isUser ? "flex-end" : "flex-start",
                      maxWidth: "85%",
                      flexDirection: isUser ? "row-reverse" : "row",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: isUser
                          ? "linear-gradient(135deg, #3b82f6, #1d4ed8)"
                          : `linear-gradient(135deg, ${activePersona.color}40, ${activePersona.color}90)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        flexShrink: 0,
                        color: "#fff",
                        boxShadow: isUser ? "0 0 10px rgba(59,130,246,0.3)" : `0 0 10px ${activePersona.color}40`,
                        border: isUser ? "1px solid #3b82f6" : `1px solid ${activePersona.color}`,
                      }}
                    >
                      {isUser ? "👤" : activePersona.avatar}
                    </div>

                    {/* Message Content Bubble */}
                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                        background: isUser
                          ? "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(29,78,216,0.12))"
                          : "var(--bg-glass)",
                        backdropFilter: "blur(14px)",
                        border: isUser ? "1px solid rgba(59,130,246,0.3)" : "1px solid var(--border-secondary)",
                        color: "var(--text-primary)",
                        fontSize: 14,
                        lineHeight: 1.6,
                        boxShadow: isUser ? "0 4px 16px rgba(59,130,246,0.1)" : "0 4px 16px rgba(0,0,0,0.15)",
                        position: "relative",
                      }}
                    >
                      {/* Name Label & Actions */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: isUser ? "#3b82f6" : activePersona.color,
                          }}
                        >
                          {isUser ? "You" : activePersona.name}
                        </span>

                        <div style={{ display: "flex", gap: 6, opacity: 0.8 }}>
                          <button
                            onClick={() => copyMessageContent(msg.content)}
                            title="Copy text"
                            style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: 11, cursor: "pointer" }}
                          >
                            📋
                          </button>
                          <button
                            onClick={() => toggleBookmark(index)}
                            title="Bookmark insight"
                            style={{ background: "none", border: "none", color: isBookmarked ? "#f59e0b" : "var(--text-tertiary)", fontSize: 11, cursor: "pointer" }}
                          >
                            {isBookmarked ? "⭐" : "📌"}
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div>
                        {isUser
                          ? msg.content
                          : renderMarkdown(
                              index === 0 && msg.content.includes("Hi, I'm Sera") && activePersona.greeting
                                ? activePersona.greeting
                                : msg.content
                            )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Streaming / Typing Indicator */}
              {isStreaming && (
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${activePersona.color}40, ${activePersona.color}90)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                    }}
                  >
                    {activePersona.avatar}
                  </div>
                  <div
                    style={{
                      padding: "10px 16px",
                      borderRadius: "20px 20px 20px 4px",
                      background: "var(--bg-glass)",
                      border: "1px solid var(--border-secondary)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: activePersona.color,
                    }}
                  >
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span style={{ fontSize: 11, marginLeft: 6, color: "var(--text-tertiary)" }}>
                      {activePersona.name} is formulating response...
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Glass Input Bar */}
        <div
          className="chat-floating-input-container"
          style={{
            position: "absolute",
            bottom: 16,
            left: 20,
            right: 20,
            maxWidth: 820,
            margin: "0 auto",
            zIndex: 20,
          }}
        >
          <div
            className="floating-input-bar"
            style={{
              padding: "8px 12px",
              borderRadius: 20,
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            {/* Voice Controller Button */}
            <VoiceController
              onTranscript={(spokenText: string) => {
                setInput((prev) => (prev ? `${prev} ${spokenText}` : spokenText));
              }}
              isStreaming={isStreaming}
            />

            {/* Auto Growing Textarea Input */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${activePersona.name}... (Press Enter to send, Shift+Enter for newline)`}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text-primary)",
                fontSize: 14,
                lineHeight: 1.5,
                resize: "none",
                padding: "8px 4px",
                maxHeight: 140,
                fontFamily: "var(--font-sans)",
              }}
            />

            {/* Send Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim() || isStreaming || crisis}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                border: "none",
                background: input.trim() && !isStreaming
                  ? `linear-gradient(135deg, ${activePersona.color}, #16a34a)`
                  : "var(--bg-secondary)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                cursor: input.trim() && !isStreaming ? "pointer" : "default",
                opacity: input.trim() && !isStreaming ? 1 : 0.4,
                boxShadow: input.trim() && !isStreaming ? `0 0 16px ${activePersona.color}50` : "none",
                transition: "all 0.15s ease",
              }}
            >
              ➔
            </motion.button>
          </div>

          <div style={{ fontSize: 10, color: "var(--text-tertiary)", textAlign: "center", marginTop: 4 }}>
            💡 Shift + Enter for new lines • Press Enter to send • Confidential AI Therapy
          </div>
        </div>
      </div>

      {/* Right Desktop Wellness Panel */}
      <WellnessPanel userId={user?.id} />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
