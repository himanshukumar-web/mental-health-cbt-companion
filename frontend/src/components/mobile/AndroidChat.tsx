"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { usePersona } from "@/hooks/usePersona";
import { useChatHistory } from "@/hooks/useChatHistory";
import AndroidMobileLayout from "./AndroidMobileLayout";
import VoiceController from "@/components/VoiceController";

const SUGGESTIONS = [
  "I'm feeling overwhelmed by work.",
  "Can we do a quick breathing exercise?",
  "Help me challenge a negative thought.",
  "I need help managing my anxiety.",
];

function formatInline(text: string): React.ReactNode {
  if (!text) return "";
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={i} style={{ fontWeight: 700, color: "inherit" }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={i}
          style={{
            background: "rgba(255, 255, 255, 0.12)",
            color: "#86efac",
            padding: "2px 6px",
            borderRadius: "6px",
            fontSize: "0.88em",
            fontFamily: "monospace",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={i} style={{ fontStyle: "italic" }}>
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

function renderMobileMarkdown(text: string) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Fenced Code Block: ```lang ... ```
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      const codeStr = codeLines.join("\n");
      elements.push(
        <div
          key={`code-${i}`}
          style={{
            margin: "10px 0",
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "#0f172a",
          }}
        >
          {lang && (
            <div
              style={{
                padding: "6px 12px",
                background: "rgba(255, 255, 255, 0.05)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                fontSize: "11px",
                color: "#94a3b8",
                fontWeight: 600,
              }}
            >
              {lang}
            </div>
          )}
          <pre
            style={{
              margin: 0,
              padding: "12px",
              overflowX: "auto",
              fontSize: "12px",
              color: "#e2e8f0",
              fontFamily: "monospace",
              lineHeight: 1.45,
            }}
          >
            <code>{codeStr}</code>
          </pre>
        </div>
      );
      continue;
    }

    // 2. Markdown Table: | Col 1 | Col 2 | -> converted to Mobile Cards
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const rowLine = lines[i].trim();
        // Skip separator row like |---|---|
        if (!rowLine.match(/^\|[\s:-]+(?:\|[\s:-]+)*\|$/)) {
          const cells = rowLine
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim());
          tableRows.push(cells);
        }
        i++;
      }

      if (tableRows.length > 0) {
        const headers = tableRows[0];
        const dataRows = tableRows.slice(1);

        elements.push(
          <div
            key={`table-cards-${i}`}
            style={{
              margin: "10px 0",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {dataRows.length > 0 ? (
              dataRows.map((row, rIdx) => (
                <div
                  key={rIdx}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  {row.map((cell, cIdx) => (
                    <div
                      key={cIdx}
                      style={{
                        fontSize: "13.5px",
                        lineHeight: 1.45,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "4px",
                      }}
                    >
                      {headers[cIdx] && (
                        <span
                          style={{
                            color: "#86efac",
                            fontWeight: 700,
                            marginRight: "4px",
                          }}
                        >
                          {headers[cIdx]}:
                        </span>
                      )}
                      <span style={{ color: "#e8edf5" }}>{formatInline(cell)}</span>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                {headers.map((cell, cIdx) => (
                  <div key={cIdx} style={{ fontSize: "13.5px", color: "#86efac", fontWeight: 700 }}>
                    {formatInline(cell)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      continue;
    }

    // 3. Blockquotes: > text
    if (trimmed.startsWith(">")) {
      elements.push(
        <div
          key={`quote-${i}`}
          style={{
            margin: "8px 0",
            padding: "8px 12px",
            borderLeft: "3px solid #22c55e",
            background: "rgba(34, 197, 94, 0.08)",
            borderRadius: "0 10px 10px 0",
            fontStyle: "italic",
            fontSize: "14px",
            color: "#d1fae5",
            lineHeight: 1.5,
          }}
        >
          {formatInline(trimmed.slice(1).trim())}
        </div>
      );
      i++;
      continue;
    }

    // 4. Headings: #, ##, ###
    if (trimmed.startsWith("### ")) {
      elements.push(
        <div
          key={`h3-${i}`}
          style={{
            margin: "12px 0 4px",
            fontSize: "15px",
            fontWeight: 800,
            color: "#86efac",
            letterSpacing: "-0.01em",
          }}
        >
          {formatInline(trimmed.slice(4))}
        </div>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <div
          key={`h2-${i}`}
          style={{
            margin: "14px 0 6px",
            fontSize: "16px",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.01em",
          }}
        >
          {formatInline(trimmed.slice(3))}
        </div>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <div
          key={`h1-${i}`}
          style={{
            margin: "16px 0 8px",
            fontSize: "17px",
            fontWeight: 800,
            color: "#ffffff",
          }}
        >
          {formatInline(trimmed.slice(2))}
        </div>
      );
      i++;
      continue;
    }

    // 5. Numbered list: 1. Item
    const numMatch = trimmed.match(/^(\d+)[.)\-]\s+(.+)/);
    if (numMatch) {
      const listItems: { num: string; text: string }[] = [];
      while (i < lines.length) {
        const cur = lines[i].trim();
        const m = cur.match(/^(\d+)[.)\-]\s+(.+)/);
        if (!m) break;
        listItems.push({ num: m[1], text: m[2] });
        i++;
      }
      elements.push(
        <div
          key={`ol-${i}`}
          style={{
            margin: "6px 0",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {listItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                fontSize: "14.5px",
                lineHeight: 1.5,
              }}
            >
              <span
                style={{
                  color: "#86efac",
                  fontWeight: 700,
                  fontSize: "13px",
                  minWidth: "18px",
                  paddingTop: "1px",
                }}
              >
                {item.num}.
              </span>
              <div style={{ flex: 1 }}>{formatInline(item.text)}</div>
            </div>
          ))}
        </div>
      );
      continue;
    }

    // 6. Bullet lists: - Item, * Item, • Item
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const cur = lines[i].trim();
        const m = cur.match(/^[-*•]\s+(.+)/);
        if (!m) break;
        listItems.push(m[1]);
        i++;
      }
      elements.push(
        <div
          key={`ul-${i}`}
          style={{
            margin: "6px 0",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {listItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                fontSize: "14.5px",
                lineHeight: 1.5,
              }}
            >
              <span
                style={{
                  color: "#4ade80",
                  fontSize: "16px",
                  lineHeight: "1",
                  marginTop: "2px",
                }}
              >
                •
              </span>
              <div style={{ flex: 1 }}>{formatInline(item)}</div>
            </div>
          ))}
        </div>
      );
      continue;
    }

    // 7. Regular paragraph
    elements.push(
      <p
        key={`p-${i}`}
        style={{
          margin: "4px 0",
          lineHeight: 1.55,
          fontSize: "14.5px",
        }}
      >
        {formatInline(trimmed)}
      </p>
    );
    i++;
  }

  return <>{elements}</>;
}

const AndroidChatMessageBubble = React.memo(function AndroidChatMessageBubble({
  message,
}: {
  message: { role: string; content: string };
}) {
  const isUser = message.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: "85%",
          padding: "14px 18px",
          borderRadius: isUser ? "22px 22px 4px 22px" : "22px 22px 22px 4px",
          background: isUser
            ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
            : "rgba(255, 255, 255, 0.06)",
          border: isUser ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
          color: isUser ? "#ffffff" : "#e8edf5",
          fontSize: "15px",
          lineHeight: 1.5,
          boxShadow: isUser ? "0 4px 12px rgba(34, 197, 94, 0.25)" : "none",
          whiteSpace: isUser ? "pre-wrap" : "normal",
          wordBreak: "break-word",
        }}
      >
        {isUser ? message.content : renderMobileMarkdown(message.content)}
      </div>
    </div>
  );
});

export default function AndroidChat() {
  const { user } = useAuth();
  const { personas, activePersona, selectPersona, selectedPersonaId } = usePersona(user?.id);
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    loading: historyLoading,
  } = useChatHistory(user?.id, selectedPersonaId);

  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    if (activeConversationId) {
      setSessionId(activeConversationId);
      return;
    }

    if (user && !historyLoading) {
      if (conversations.length > 0) {
        setActiveConversationId(conversations[0].id);
        setSessionId(conversations[0].id);
      } else {
        createConversation(selectedPersonaId).then((newConv) => {
          if (newConv) {
            setActiveConversationId(newConv.id);
            setSessionId(newConv.id);
          }
        });
      }
    } else if (!user) {
      let localSession = localStorage.getItem("sera_guest_android_session");
      if (!localSession) {
        localSession = crypto.randomUUID();
        localStorage.setItem("sera_guest_android_session", localSession);
      }
      setSessionId(localSession);
    }
  }, [user, activeConversationId, conversations, historyLoading, selectedPersonaId, createConversation, setActiveConversationId]);

  const activeConvId = activeConversationId || (user && sessionId && sessionId !== user.id ? sessionId : null);
  const currentSession = sessionId || user?.id || "guest_android_session";

  const { messages, wsState, sendMessage } = useWebSocket(currentSession, user?.id, undefined, activeConvId);
  const isStreaming = wsState.isStreaming;

  const [input, setInput] = useState("");
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Auto-grow textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    sendMessage(text, selectedPersonaId);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AndroidMobileLayout hasBottomNav={true} style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Compact Android Chat Top Bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: "rgba(11, 15, 26, 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setShowPersonaPicker(!showPersonaPicker)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(34, 197, 94, 0.12)",
              border: "1px solid rgba(34, 197, 94, 0.25)",
              borderRadius: "100px",
              padding: "6px 14px",
              color: "#4ade80",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <span>{activePersona?.avatar || "🤖"}</span>
            <span>{activePersona?.name || "Dr. MindMate"}</span>
            <span style={{ fontSize: "10px" }}>▼</span>
          </button>

          {wsState.threatLevel === "crisis" && (
            <span
              style={{
                fontSize: "11px",
                background: "#ef4444",
                color: "#ffffff",
                padding: "2px 8px",
                borderRadius: "100px",
                fontWeight: 700,
              }}
            >
              CRISIS ALERT
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: wsState.isConnected ? "#22c55e" : "#ef4444",
              display: "inline-block",
            }}
          />
          <button
            onClick={async () => {
              if (user) {
                const newConv = await createConversation(selectedPersonaId);
                if (newConv) {
                  setActiveConversationId(newConv.id);
                  setSessionId(newConv.id);
                }
              } else {
                const newSession = crypto.randomUUID();
                localStorage.setItem("sera_guest_android_session", newSession);
                setSessionId(newSession);
              }
            }}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "8px",
              color: "#e2e8f0",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              padding: "4px 10px",
            }}
          >
            + New
          </button>
        </div>
      </div>

      {/* Persona Picker Drawer */}
      {showPersonaPicker && (
        <div
          style={{
            background: "#111827",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "12px 16px",
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            flexShrink: 0,
          }}
        >
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                selectPersona(p.id);
                setShowPersonaPicker(false);
              }}
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "16px",
                border: activePersona?.id === p.id ? "1.5px solid #22c55e" : "1px solid rgba(255,255,255,0.1)",
                background: activePersona?.id === p.id ? "rgba(34, 197, 94, 0.15)" : "rgba(255,255,255,0.04)",
                color: "#e8edf5",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <span>{p.avatar}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Scrollable Message List */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "40px 20px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "24px",
                background: "rgba(34, 197, 94, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                marginBottom: "16px",
              }}
            >
              🌿
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#e8edf5", margin: "0 0 8px 0" }}>
              How can I support you right now?
            </h2>
            <p style={{ fontSize: "13px", color: "#8b95a7", maxWidth: "300px", lineHeight: 1.5, margin: "0 0 24px 0" }}>
              Select a quick topic or type your message below.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxWidth: "340px" }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s, selectedPersonaId)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "14px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    background: "rgba(255, 255, 255, 0.04)",
                    color: "#e8edf5",
                    fontSize: "13px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  💬 {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, idx) => (
            <AndroidChatMessageBubble key={idx} message={m} />
          ))
        )}

        {isStreaming && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "20px",
                background: "rgba(255, 255, 255, 0.05)",
                color: "#4ade80",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#4ade80",
                  animation: "md3Pulse 1s infinite alternate",
                }}
              />
              MindMate is typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom Composer Above Bottom Navigation */}
      <div
        style={{
          position: "relative",
          bottom: "auto",
          zIndex: 1100,
          background: "#0b0f1a",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "8px 14px 10px",
          display: "flex",
          alignItems: "flex-end",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.06)",
            borderRadius: "22px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            padding: "4px 12px",
            minHeight: "44px",
            boxSizing: "border-box",
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={(e) => e.target.scrollIntoView({ behavior: "smooth", block: "center" })}
            placeholder="Type your message..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#e8edf5",
              fontSize: "15px",
              lineHeight: 1.4,
              resize: "none",
              padding: "8px 0",
              maxHeight: "120px",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />

          <VoiceController
            compact={true}
            onTranscript={(text) => setInput((prev) => (prev ? `${prev} ${text}` : text))}
          />
        </div>

        <button
          type="button"
          id="android-chat-send-btn"
          aria-label="Send message"
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: "none",
            background: input.trim() && !isStreaming
              ? "linear-gradient(135deg, #22c55e, #16a34a)"
              : "rgba(255, 255, 255, 0.08)",
            color: input.trim() && !isStreaming ? "#ffffff" : "rgba(255, 255, 255, 0.35)",
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: input.trim() && !isStreaming ? "pointer" : "default",
            opacity: input.trim() && !isStreaming ? 1 : 0.45,
            transition: "all 0.2s ease",
            flexShrink: 0,
            WebkitTapHighlightColor: "transparent",
            boxShadow: input.trim() && !isStreaming ? "0 2px 10px rgba(34, 197, 94, 0.35)" : "none",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: "translateX(1px)" }}
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes md3Pulse {
          from { opacity: 0.3; }
          to { opacity: 1; }
        }
      `}</style>
    </AndroidMobileLayout>
  );
}
