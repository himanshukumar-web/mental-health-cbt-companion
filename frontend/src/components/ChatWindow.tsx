"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { ChatMessage, WSState, RouterSuggestion } from "@/hooks/useWebSocket";
// import { useAuth } from "@/contexts/AuthContext";
import VoiceController from "@/components/VoiceController";
// import PersonaSelector from "@/components/PersonaSelector";
import WellnessPanel from "@/components/WellnessPanel";
import MobileBottomNav from "@/components/MobileBottomNav";
import { usePersona } from "@/hooks/usePersona";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// ── Enhanced Markdown Renderer ──────────────────────────────────────────────
function renderMarkdown(text: string) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    // Fenced Code Block: ```lang ... ```
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
        <div key={`code-${i}`} style={{ margin: "10px 0", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-secondary)", background: "#0f172a" }}>
          <div style={{ padding: "6px 12px", background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "var(--text-tertiary)" }}>
            <span>{lang || "code"}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(codeStr); toast.success("Code copied!"); }}
              style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 11, cursor: "pointer" }}
            >
              📋 Copy
            </button>
          </div>
          <pre style={{ margin: 0, padding: 12, overflowX: "auto", fontSize: 12, color: "#e2e8f0", fontFamily: "monospace", lineHeight: 1.5 }}>
            <code>{codeStr}</code>
          </pre>
        </div>
      );
      continue;
    }

    // Markdown Table: | Col 1 | Col 2 |
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const rowLine = lines[i].trim();
        // Skip separator row |---|---|
        if (!rowLine.match(/^\|[\s:-]+(?:\|[\s:-]+)*\|$/)) {
          const cells = rowLine.split("|").slice(1, -1).map((c) => c.trim());
          tableRows.push(cells);
        }
        i++;
      }
      if (tableRows.length > 0) {
        const header = tableRows[0];
        const body = tableRows.slice(1);
        elements.push(
          <div key={`table-${i}`} style={{ overflowX: "auto", margin: "10px 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.08)", borderBottom: "2px solid var(--border-secondary)" }}>
                  {header.map((cell, idx) => (
                    <th key={idx} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700 }}>{formatInline(cell)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: "1px solid var(--border-secondary)", background: rIdx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} style={{ padding: "8px 12px" }}>{formatInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Blockquote: > text
    if (trimmed.startsWith(">")) {
      elements.push(
        <blockquote key={`quote-${i}`} style={{ margin: "8px 0", paddingLeft: 14, borderLeft: "3px solid #22c55e", fontStyle: "italic", color: "var(--text-secondary)" }}>
          {formatInline(trimmed.slice(1).trim())}
        </blockquote>
      );
      i++;
      continue;
    }

    // Headings: ### Header
    if (trimmed.startsWith("### ")) {
      elements.push(<h4 key={i} style={{ margin: "12px 0 6px", fontSize: 15, fontWeight: 800 }}>{formatInline(trimmed.slice(4))}</h4>);
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(<h3 key={i} style={{ margin: "14px 0 6px", fontSize: 17, fontWeight: 800 }}>{formatInline(trimmed.slice(3))}</h3>);
      i++;
      continue;
    }

    // Numbered lists: 1. Item
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

    // Bullet lists: - Item
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
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4, fontSize: "0.9em", fontFamily: "monospace" }}>
          {part.slice(1, -1)}
        </code>
      );
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
  routerSuggestion?: RouterSuggestion | null;
  onDismissRouterSuggestion?: () => void;
}

export default function ChatWindow({
  messages,
  wsState,
  isStreaming,
  crisis,
  onSend,
  user,
  routerSuggestion,
  onDismissRouterSuggestion,
}: ChatWindowProps) {
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
            padding: 12px 12px 140px !important;
            -webkit-overflow-scrolling: touch;
          }
          .chat-floating-input-container {
            bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important;
            left: 10px !important;
            right: 10px !important;
            transition: bottom 0.2s ease-out;
          }
          body.keyboard-open .mobile-bottom-nav {
            display: none !important;
          }
          body.keyboard-open .chat-floating-input-container {
            bottom: 10px !important;
            left: 0 !important;
            right: 0 !important;
          }
          body.keyboard-open .floating-input-bar {
            border-radius: 0 !important;
            border-left: none !important;
            border-right: none !important;
          }
          body.keyboard-open .chat-messages-container {
            padding-bottom: 80px !important;
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
          {/* Active Therapist Persona Header Card & Dropdown */}
          <div style={{ position: "relative" }}>
            <div
              onClick={() => setShowPersonaBar(!showPersonaBar)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "6px 12px 6px 8px",
                borderRadius: 16,
                background: "var(--bg-glass)",
                border: `1px solid ${activePersona.color}40`,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: `0 2px 12px ${activePersona.color}15`,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${activePersona.color}40, ${activePersona.color}90)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 19,
                  border: `2px solid ${activePersona.color}`,
                  flexShrink: 0,
                  boxShadow: `0 0 10px ${activePersona.color}40`,
                }}
              >
                {activePersona.avatar}
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                    {activePersona.name}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 6,
                      background: `${activePersona.color}20`,
                      border: `1px solid ${activePersona.color}40`,
                      color: activePersona.color,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {activePersona.title}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>
                    {showPersonaBar ? "▲" : "▾"}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 500, lineHeight: 1.2 }}>
                  {activePersona.description ? activePersona.description.slice(0, 50) + "..." : activePersona.title}
                </div>
              </div>
            </div>

            {/* Dropdown Menu Overlay */}
            <AnimatePresence>
              {showPersonaBar && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    width: 340,
                    zIndex: 100,
                    background: "rgba(11, 15, 26, 0.96)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: "1px solid var(--border-secondary)",
                    borderRadius: 20,
                    padding: 12,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-tertiary)", letterSpacing: "0.08em", padding: "4px 8px" }}>
                    Select Therapist Specialist
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 380, overflowY: "auto" }} className="custom-scrollbar">
                    {personas.map((p) => {
                      const isSel = p.id === selectedPersonaId;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            selectPersona(p.id);
                            setShowPersonaBar(false);
                            toast.success(`Switched to ${p.name} (${p.title})`);
                          }}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 14,
                            background: isSel ? `${p.color}20` : "var(--bg-glass)",
                            border: isSel ? `1px solid ${p.color}60` : "1px solid var(--border-secondary)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div
                            style={{
                              width: 34, height: 34, borderRadius: "50%",
                              background: `linear-gradient(135deg, ${p.color}40, ${p.color}90)`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 18, border: `1px solid ${p.color}`, flexShrink: 0,
                            }}
                          >
                            {p.avatar}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: isSel ? p.color : "var(--text-primary)" }}>
                                {p.name}
                              </span>
                              {isSel && (
                                <span style={{ fontSize: 10, fontWeight: 800, color: p.color, background: `${p.color}30`, padding: "2px 6px", borderRadius: 6 }}>
                                  Active
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 10, color: "var(--text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {p.title} • {p.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Chat Input & Timer Controls */}
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
                width: 120,
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

            {/* Export & Share Action Buttons */}
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => {
                  const transcript = messages.map((m) => `**${m.role === "user" ? "You" : activePersona.name}**: ${m.content}`).join("\n\n");
                  navigator.clipboard.writeText(transcript);
                  toast.success("Chat copied to clipboard!");
                }}
                title="Share / Copy Chat"
                style={{
                  padding: "5px 10px",
                  borderRadius: 10,
                  background: "var(--bg-glass)",
                  border: "1px solid var(--border-secondary)",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span>📤 Share</span>
              </button>
              <button
                onClick={() => {
                  const transcript = `# Therapy Session with ${activePersona.name} (${activePersona.title})\nDate: ${new Date().toLocaleString()}\n\n` +
                    messages.map((m) => `### ${m.role === "user" ? "User" : activePersona.name}\n${m.content}`).join("\n\n");
                  const blob = new Blob([transcript], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `therapy_chat_${activePersona.id}_${Date.now()}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Exported session to Markdown!");
                }}
                title="Export Chat as Markdown"
                style={{
                  padding: "5px 10px",
                  borderRadius: 10,
                  background: "var(--bg-glass)",
                  border: "1px solid var(--border-secondary)",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span>📥 Export</span>
              </button>
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

        {/* AI Router Suggestion Banner */}
        <AnimatePresence>
          {routerSuggestion && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{
                margin: "0 20px",
                padding: "12px 16px",
                borderRadius: 16,
                background: `linear-gradient(135deg, ${routerSuggestion.personaColor}15, ${routerSuggestion.personaColor}08)`,
                border: `1px solid ${routerSuggestion.personaColor}40`,
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 8,
                boxShadow: `0 4px 20px ${routerSuggestion.personaColor}15`,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: `linear-gradient(135deg, ${routerSuggestion.personaColor}40, ${routerSuggestion.personaColor}90)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0,
                border: `2px solid ${routerSuggestion.personaColor}`,
              }}>
                {routerSuggestion.personaAvatar}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: routerSuggestion.personaColor, marginBottom: 2 }}>
                  🧭 Smart Suggestion
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  {routerSuggestion.reason}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    selectPersona(routerSuggestion.suggestedPersona);
                    onDismissRouterSuggestion?.();
                    toast.success(`Switched to ${routerSuggestion.personaName}!`);
                  }}
                  style={{
                    padding: "6px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                    background: routerSuggestion.personaColor, color: "#fff", border: "none",
                    cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >
                  Switch to {routerSuggestion.personaName}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDismissRouterSuggestion?.()}
                  style={{
                    padding: "6px 12px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                    background: "var(--bg-glass)", color: "var(--text-secondary)",
                    border: "1px solid var(--border-secondary)", cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >
                  Stay
                </motion.button>
              </div>
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

                      {/* Assistant Actions: Regenerate & Continue (for last assistant message) */}
                      {!isUser && index === messages.length - 1 && !isStreaming && (
                        <div style={{ display: "flex", gap: 8, marginTop: 8, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                          <button
                            onClick={() => {
                              // Find last user message
                              const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
                              if (lastUserMsg) {
                                onSend(lastUserMsg.content, selectedPersonaId);
                              }
                            }}
                            title="Regenerate last response"
                            style={{
                              background: "none",
                              border: "1px solid var(--border-secondary)",
                              borderRadius: 6,
                              padding: "2px 8px",
                              color: "var(--text-tertiary)",
                              fontSize: 10,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            🔄 Regenerate
                          </button>
                          <button
                            onClick={() => {
                              onSend("Please continue from where you left off.", selectedPersonaId);
                            }}
                            title="Continue response"
                            style={{
                              background: "none",
                              border: "1px solid var(--border-secondary)",
                              borderRadius: 6,
                              padding: "2px 8px",
                              color: "var(--text-tertiary)",
                              fontSize: 10,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            ⏩ Continue
                          </button>
                        </div>
                      )}
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
