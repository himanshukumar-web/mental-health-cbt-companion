"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { AgentStatus, ChatMessage, WSState } from "@/hooks/useWebSocket";
import { useAuth } from "@/contexts/AuthContext";
import ThemeSelector from "@/components/ThemeSelector";

// ── Lightweight Markdown renderer for Sera AI messages ─────────────────────────
function renderMarkdown(text: string) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) { i++; continue; }

    // Numbered list: 1. or 1) pattern
    const numMatch = trimmed.match(/^(\d+)[.)\-]\s+(.+)/);
    if (numMatch) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length) {
        const cur = lines[i].trim();
        const m = cur.match(/^(\d+)[.)\-]\s+(.+)/);
        if (!m) break;
        listItems.push(
          <li key={i} style={{ marginBottom: 6, lineHeight: 1.6 }}>
            {formatInline(m[2])}
          </li>
        );
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ margin: "8px 0", paddingLeft: 20, listStyleType: "decimal" }}>
          {listItems}
        </ol>
      );
      continue;
    }

    // Bullet list: - or * or • pattern
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
        <ul key={`ul-${i}`} style={{ margin: "8px 0", paddingLeft: 20, listStyleType: "disc" }}>
          {listItems}
        </ul>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} style={{ margin: "4px 0", lineHeight: 1.65 }}>
        {formatInline(trimmed)}
      </p>
    );
    i++;
  }

  return <>{elements}</>;
}

// Format inline markdown: **bold**
function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, "ws") ?? "ws://localhost:8000";
const HTTP_API_URL = API_URL.replace(/^ws/, "http");

// ── Sub-components ─────────────────────────────────────────────────────────────

function AgentStatusBadge({ label, status, pulse }: {
  label: string; status: AgentStatus; pulse?: boolean;
}) {
  const dotColor =
    status === "active" ? "#22c55e" :
    status === "alert"  ? "#ef4444" : "#555";
  const dotShadow =
    status === "active" ? "0 0 0 3px rgba(34,197,94,0.15)" :
    status === "alert"  ? "0 0 0 3px rgba(239,68,68,0.15)" : "none";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 20,
      border: "0.5px solid var(--border-secondary)",
      background: "var(--bg-glass)", fontSize: 11,
      color: "var(--text-secondary)",
    }}>
      <div style={{
        width: 7, height: 7, borderRadius: "50%",
        background: dotColor, boxShadow: dotShadow,
        animation: pulse ? "pulse 1.5s infinite" : "none",
        transition: "background 0.3s",
      }} />
      {label}
    </div>
  );
}

function MoodMeter({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const labels = ["Very low", "Low", "Neutral", "Good", "Great"];
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];
  return (
    <div style={{ padding: "12px 16px 4px" }}>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>
        How are you feeling right now?
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {labels.map((l, i) => (
          <button
            key={i}
            id={`mood-${i}`}
            onClick={() => onChange(i)}
            style={{
              flex: 1, padding: "7px 4px", borderRadius: 8, fontSize: 11,
              border: value === i ? `1.5px solid ${colors[i]}` : "0.5px solid var(--border-secondary)",
              background: value === i ? `${colors[i]}18` : "var(--bg-secondary)",
              color: value === i ? colors[i] : "var(--text-secondary)",
              cursor: "pointer", fontWeight: value === i ? 600 : 400,
              transition: "all 0.15s",
            }}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface ChatWindowProps {
  messages: ChatMessage[];
  wsState: WSState;
  isStreaming: boolean;
  crisis: boolean;
  onSend: (text: string) => void;
  onDismissCrisis: () => void;
  user?: User | null;
  sessionId: string;
}

// ── Main component ─────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "I've been feeling really anxious lately",
  "I keep having negative thoughts",
  "I'm struggling to sleep",
  "Help me challenge a thought",
];

const MOOD_LABELS = ["Very low 😔", "Low 😟", "Neutral 😐", "Good 🙂", "Great 😊"];

export default function ChatWindow({
  messages, wsState, isStreaming, crisis, onSend, onDismissCrisis, user, sessionId,
}: ChatWindowProps) {
  const { signOut, userRole } = useAuth();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [sessionTime, setSessionTime] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [mood, setMood] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionsList, setSessionsList] = useState<{ id: string; title: string }[]>([]);

  // Reset session-specific state when sessionId changes
  useEffect(() => {
    setSessionTime(0);
    setMood(null);
  }, [sessionId]);

  // Auto scroll to bottom when messages or isStreaming changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Load chat session history list
  useEffect(() => {
    if (!user) return;
    const fetchSessions = async () => {
      try {
        const res = await fetch(`${HTTP_API_URL}/users/${user.id}/sessions`);
        if (res.ok) {
          const data = await res.json();
          setSessionsList(data.sessions || []);
        }
      } catch (err) {
        console.error("Failed to fetch user sessions:", err);
      }
    };
    fetchSessions();
  }, [user, messages]);

  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  useEffect(() => {
    const t = setInterval(() => setSessionTime((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Count user messages
  useEffect(() => {
    setMsgCount(messages.filter((m) => m.role === "user").length);
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming || crisis) return;
    setInput("");
    onSend(text);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [input, isStreaming, crisis, onSend]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = !!input.trim() && !isStreaming && !crisis && wsState.isConnected;

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 99, backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease"
          }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        width: 220, borderRight: "0.5px solid var(--border-secondary)",
        display: "flex", flexDirection: "column", padding: "16px 12px",
        background: "var(--bg-secondary)", flexShrink: 0,
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: isMobile ? "absolute" : "relative",
        top: 0, bottom: 0, left: 0,
        zIndex: 100,
        transform: isMobile ? (sidebarOpen ? "translateX(0)" : "translateX(-100%)") : "none",
        boxShadow: isMobile && sidebarOpen ? "5px 0 25px rgba(0,0,0,0.5)" : "none",
      }}>
        {/* Brand & Go to Home */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg,#a7f3d0,#6ee7b7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, boxShadow: "0 0 12px rgba(34,197,94,0.25)",
            }}>🌿</div>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Sera</span>
          </div>
          
          <button
            onClick={() => router.push("/")}
            style={{
              width: "100%", padding: "8px 10px", borderRadius: 8,
              background: "var(--bg-glass)", border: "0.5px solid var(--border-secondary)",
              color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all 0.2s"
            }}
          >
            🏠 Go to Home
          </button>
          <button
            onClick={() => router.push(`/chat?session=${crypto.randomUUID()}`)}
            style={{
              width: "100%", padding: "8px 10px", borderRadius: 8,
              background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none",
              color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all 0.2s", marginTop: 8
            }}
          >
            ➕ New Chat
          </button>
        </div>

        {/* Agents */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)",
            textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8,
          }}>Agents</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <AgentStatusBadge label="Therapist" status={wsState.therapistStatus} pulse={isStreaming} />
            <AgentStatusBadge label="Monitor" status={wsState.monitorStatus} pulse={wsState.monitorStatus === "alert"} />
          </div>
        </div>

        {/* Stats */}
        <div style={{
          borderTop: "0.5px solid var(--border-tertiary)", paddingTop: 16, marginBottom: 20,
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          {[
            { label: "Session", value: formatTime(sessionTime), mono: true },
            { label: "Messages", value: String(msgCount), mono: false },
          ].map(({ label, value, mono }) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginBottom: 3 }}>{label}</div>
              <div style={{
                fontSize: 20, fontWeight: 600, color: "var(--text-primary)",
                fontVariantNumeric: mono ? "tabular-nums" : undefined,
                letterSpacing: mono ? "-0.02em" : undefined,
              }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Mood */}
        {mood !== null && (
          <div style={{ borderTop: "0.5px solid var(--border-tertiary)", paddingTop: 16 }}>
            <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginBottom: 6 }}>Today's mood</div>
            <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
              {MOOD_LABELS[mood]}
            </div>
          </div>
        )}

        {/* Chat with Doctor/Patient Option */}
        {user && (
          <div style={{ borderTop: "0.5px solid var(--border-tertiary)", paddingTop: 12, marginBottom: 12 }}>
            <button
              onClick={() => router.push(userRole === "admin" ? "/admin?tab=chat" : "/appointments/my?tab=chat")}
              style={{
                width: "100%", padding: "8px 10px", borderRadius: 8,
                background: "rgba(59,130,246,0.12)", border: "0.5px solid rgba(59,130,246,0.3)",
                color: "#93c5fd", fontSize: 11, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                transition: "all 0.2s"
              }}
            >
              💬 {userRole === "admin" ? "Chat with Patient" : "Chat with Doctor"}
            </button>
          </div>
        )}

        {/* Recent Chats list */}
        {user && (
          <div style={{ flex: 1, overflowY: "auto", margin: "16px 0", borderTop: "0.5px solid var(--border-tertiary)", paddingTop: 12 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)",
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8,
            }}>Recent Chats</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {sessionsList.map(s => {
                const isSelected = s.id === sessionId;
                return (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/chat?session=${s.id}`)}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: 8,
                      border: "none",
                      background: isSelected ? "rgba(34, 197, 94, 0.12)" : "transparent",
                      color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                      fontSize: 12, textAlign: "left", cursor: "pointer",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      transition: "all 0.15s"
                    }}
                    title={s.title}
                  >
                    💬 {s.title}
                  </button>
                );
              })}
              {sessionsList.length === 0 && (
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", textAlign: "center", padding: "12px 0" }}>
                  No previous chats
                </div>
              )}
            </div>
          </div>
        )}

        {/* User + Connection */}
        <div style={{ marginTop: "auto" }}>
          {/* Signed-in user */}
          {user && (
            <div style={{
              borderTop: "0.5px solid var(--border-tertiary)", paddingTop: 12, marginBottom: 12,
            }}>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.user_metadata?.full_name ?? user.email}
              </div>
              <button
                id="chat-signout"
                onClick={async () => { await signOut(); router.push("/"); }}
                style={{
                  fontSize: 10, color: "var(--text-tertiary)", background: "none",
                  border: "0.5px solid var(--border-tertiary)", borderRadius: 6,
                  padding: "3px 8px", cursor: "pointer", marginTop: 4,
                }}
              >
                Sign out
              </button>
            </div>
          )}
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 10, color: wsState.isConnected ? "#22c55e" : "#ef4444",
            marginBottom: 8,
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%",
              background: wsState.isConnected ? "#22c55e" : "#ef4444",
            }} />
            {wsState.isConnected ? "Connected" : "Reconnecting…"}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)", lineHeight: 1.5 }}>
            Not a replacement for professional therapy. Crisis? Call 9152987821
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
        {/* Header */}
        <div style={{
          padding: "12px 16px", borderBottom: "0.5px solid var(--border-secondary)",
          display: "flex", alignItems: "center", gap: 10, background: "var(--bg-secondary)",
          flexShrink: 0,
        }}>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: "none", border: "none", color: "var(--text-primary)",
                fontSize: 20, padding: "4px 8px", cursor: "pointer", marginRight: 4,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              ☰
            </button>
          )}
          <div style={{
            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg,#a7f3d0,#6ee7b7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, boxShadow: "0 0 14px rgba(34,197,94,0.2)",
          }}>🌿</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Sera</div>
            <div style={{ fontSize: 11, color: isStreaming ? "#86efac" : "#22c55e" }}>
              {isStreaming ? "typing…" : "Active · CBT Companion"}
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {!isMobile && (
              <div style={{
                fontSize: 11, color: "var(--text-tertiary)",
                padding: "4px 10px", borderRadius: 8,
                border: "0.5px solid var(--border-secondary)",
                background: "var(--bg-glass)",
              }}>
                Multi-agent · Encrypted
              </div>
            )}
            <ThemeSelector />
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {/* Mood meter — only shown at start */}
          {messages.length <= 1 && (
            <div style={{ marginBottom: 16, animation: "fadeIn 0.5s ease" }}>
              <MoodMeter value={mood} onChange={setMood} />
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                gap: 8, marginBottom: 12,
                animation: "fadeIn 0.3s ease",
              }}
            >
              {msg.role === "assistant" && (
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg,#a7f3d0,#6ee7b7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, alignSelf: "flex-end",
                }}>🌿</div>
              )}
              <div style={{
                maxWidth: isMobile ? "88%" : "72%", padding: isMobile ? "10px 12px" : "10px 14px",
                borderRadius: msg.role === "user"
                  ? "16px 16px 4px 16px"
                  : "16px 16px 16px 4px",
                background: msg.role === "user"
                  ? "var(--color-background-info)"
                  : "var(--bg-secondary)",
                color: msg.role === "user"
                  ? "var(--color-text-info)"
                  : "var(--text-primary)",
                fontSize: isMobile ? 13 : 14, lineHeight: 1.65,
                border: msg.role === "user"
                  ? "0.5px solid var(--color-border-info)"
                  : "0.5px solid var(--border-secondary)",
              }}>
                {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                {msg.streaming && (
                  <span style={{
                    display: "inline-block", width: 2, height: 14,
                    background: "currentColor", marginLeft: 2,
                    animation: "pulse 0.8s infinite",
                    verticalAlign: "middle",
                  }} />
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isStreaming && messages[messages.length - 1]?.role === "user" && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "linear-gradient(135deg,#a7f3d0,#6ee7b7)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
              }}>🌿</div>
              <div style={{
                background: "var(--bg-secondary)",
                borderRadius: "16px 16px 16px 4px",
                border: "0.5px solid var(--border-secondary)",
                padding: "12px 16px", display: "flex", gap: 4, alignItems: "center",
              }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: "var(--text-tertiary)",
                    animation: `bounce 1.2s ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          {/* Scroll anchor */}
          <div ref={messagesEndRef} id="messages-bottom" />
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div style={{
            padding: "0 16px 10px",
            display: "flex", gap: 6, flexWrap: "wrap",
          }}>
            {QUICK_PROMPTS.map((p, i) => (
              <button
                key={i}
                id={`quick-${i}`}
                onClick={() => { setInput(p); inputRef.current?.focus(); }}
                style={{
                  padding: "6px 13px", borderRadius: 16, fontSize: 12,
                  border: "0.5px solid var(--border-secondary)",
                  background: "var(--bg-glass)",
                  color: "var(--text-secondary)", cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: isMobile ? "10px 12px" : "12px 16px", borderTop: "0.5px solid var(--border-secondary)",
          display: "flex", gap: 8, alignItems: "flex-end",
          background: "var(--bg-secondary)", flexShrink: 0,
        }}>
          <textarea
            ref={inputRef}
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={crisis ? "Crisis support mode active…" : "Share what's on your mind…"}
            rows={2}
            disabled={isStreaming || crisis}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 12,
              border: "0.5px solid var(--border-secondary)",
              background: "var(--bg-primary)",
              color: "var(--text-primary)", fontSize: 14,
              fontFamily: "var(--font-sans)", lineHeight: 1.5,
              opacity: isStreaming || crisis ? 0.45 : 1,
              transition: "opacity 0.2s",
            }}
          />
          <button
            id="send-btn"
            onClick={handleSend}
            disabled={!canSend}
            style={{
              width: 42, height: 42, borderRadius: 11, flexShrink: 0,
              background: canSend
                ? "linear-gradient(135deg,#22c55e,#16a34a)"
                : "var(--bg-elevated)",
              border: "0.5px solid var(--border-secondary)",
              color: canSend ? "white" : "var(--text-tertiary)",
              cursor: canSend ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, transition: "all 0.2s",
              boxShadow: canSend ? "0 2px 12px rgba(34,197,94,0.3)" : "none",
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </>
  );
}
