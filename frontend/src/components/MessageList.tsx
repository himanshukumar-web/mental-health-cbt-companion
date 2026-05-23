"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/hooks/useWebSocket";

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "12px 16px", alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "var(--text-tertiary)",
            animation: `bounce 1.2s ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function SeraAvatar() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, #a7f3d0, #6ee7b7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, alignSelf: "flex-end",
      boxShadow: "0 0 10px rgba(34,197,94,0.2)",
    }}>🌿</div>
  );
}

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export default function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const showTyping =
    isStreaming && messages[messages.length - 1]?.role === "user";

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
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
          {msg.role === "assistant" && <SeraAvatar />}
          <div
            style={{
              maxWidth: "72%",
              padding: "10px 14px",
              borderRadius:
                msg.role === "user"
                  ? "16px 16px 4px 16px"
                  : "16px 16px 16px 4px",
              background:
                msg.role === "user"
                  ? "var(--color-background-info)"
                  : "var(--bg-secondary)",
              color:
                msg.role === "user"
                  ? "var(--color-text-info)"
                  : "var(--text-primary)",
              fontSize: 14, lineHeight: 1.65,
              border:
                msg.role === "user"
                  ? "0.5px solid var(--color-border-info)"
                  : "0.5px solid var(--border-secondary)",
            }}
          >
            {msg.content}
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

      {showTyping && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <SeraAvatar />
          <div style={{
            background: "var(--bg-secondary)",
            borderRadius: "16px 16px 16px 4px",
            border: "0.5px solid var(--border-secondary)",
          }}>
            <TypingDots />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
