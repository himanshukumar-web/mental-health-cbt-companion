"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket, ChatMessage } from "@/hooks/useWebSocket";
import { usePersona } from "@/hooks/usePersona";
import AndroidMobileLayout from "./AndroidMobileLayout";
import VoiceController from "@/components/VoiceController";

const SUGGESTIONS = [
  "I'm feeling overwhelmed by work.",
  "Can we do a quick breathing exercise?",
  "Help me challenge a negative thought.",
  "I need help managing my anxiety.",
];

export default function AndroidChat() {
  const { user } = useAuth();
  const sessionId = user?.id || "guest_android_session";
  const { messages, wsState, sendMessage } = useWebSocket(sessionId, user?.id);
  const { personas, activePersona, selectPersona } = usePersona(user?.id);
  const isStreaming = wsState.isStreaming;

  const [input, setInput] = useState("");
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AndroidMobileLayout hasBottomNav={true} style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Compact Android Chat Top Bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: "rgba(11, 15, 26, 0.95)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "calc(10px + env(safe-area-inset-top, 0px)) 16px 10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
              padding: "6px 12px",
              color: "#4ade80",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <span>{activePersona?.avatar || "🤖"}</span>
            <span>{activePersona?.name || "Dr. Sera"}</span>
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
            onClick={() => window.location.reload()}
            style={{
              background: "none",
              border: "none",
              color: "#8b95a7",
              fontSize: "13px",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            Clear
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

      {/* ChatGPT Style Message List */}
      <div
        style={{
          flex: 1,
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
                  onClick={() => sendMessage(s)}
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
          messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div
                key={idx}
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
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {m.content}
                </div>
              </div>
            );
          })
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
              Sera is typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom Composer */}
      <div
        style={{
          position: "sticky",
          bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
          zIndex: 1100,
          background: "#0b0f1a",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.06)",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            padding: "4px 14px",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#e8edf5",
              fontSize: "15px",
              padding: "10px 0",
              fontFamily: "inherit",
            }}
          />

          <VoiceController
            onTranscript={(text) => setInput((prev) => (prev ? `${prev} ${text}` : text))}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: "none",
            background: input.trim() && !isStreaming ? "linear-gradient(135deg, #22c55e, #16a34a)" : "rgba(255,255,255,0.08)",
            color: "#ffffff",
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: input.trim() && !isStreaming ? "pointer" : "default",
            opacity: input.trim() && !isStreaming ? 1 : 0.4,
            transition: "all 0.2s ease",
            flexShrink: 0,
          }}
        >
          ➔
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
