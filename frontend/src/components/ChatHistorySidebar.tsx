"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Conversation } from "@/hooks/useChatHistory";
import { Persona } from "@/types/persona";

interface ChatHistorySidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, newTitle: string) => void;
  onPin: (id: string, isPinned: boolean) => void;
  onArchive: (id: string, isArchived: boolean) => void;
  onDelete: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  personas: Persona[];
  activePersonaId: string;
  onSelectPersona: (id: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function ChatHistorySidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRename,
  onPin,
  onArchive,
  onDelete,
  searchQuery,
  onSearchChange,
  personas,
  activePersonaId,
  onSelectPersona,
  isMobileOpen = false,
  onCloseMobile,
}: ChatHistorySidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const activePersona = personas.find((p) => p.id === activePersonaId) || personas[0];

  const handleStartRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditingTitle(conv.title);
    setMenuOpenId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editingTitle.trim()) {
      onRename(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const pinnedConversations = conversations.filter((c) => c.is_pinned);
  const recentConversations = conversations.filter((c) => !c.is_pinned);

  return (
    <aside
      className="custom-scrollbar"
      style={{
        width: 280,
        height: "100%",
        background: "rgba(11, 15, 26, 0.95)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid var(--border-secondary)",
        display: "flex",
        flexDirection: "column",
        padding: "16px 12px",
        flexShrink: 0,
        zIndex: 100,
      }}
    >
      {/* Header with Active Persona Badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${activePersona.color}40, ${activePersona.color}90)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              border: `1px solid ${activePersona.color}`,
            }}
          >
            {activePersona.avatar}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>
              {activePersona.name}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>
              Chat History
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: 16, cursor: "pointer" }}
          >
            ✕
          </button>
        )}
      </div>

      {/* New Chat Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onNewChat}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 14,
          background: `linear-gradient(135deg, ${activePersona.color}25, ${activePersona.color}50)`,
          border: `1px solid ${activePersona.color}50`,
          color: "#fff",
          fontWeight: 700,
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: "pointer",
          marginBottom: 12,
          boxShadow: `0 4px 14px ${activePersona.color}20`,
        }}
      >
        <span>✨</span>
        <span>New Chat with {activePersona.name}</span>
      </motion.button>

      {/* Search Input */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="🔍 Search conversations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 12,
            background: "var(--bg-glass)",
            border: "1px solid var(--border-secondary)",
            color: "var(--text-primary)",
            fontSize: 12,
            outline: "none",
          }}
        />
      </div>

      {/* Persona Selector Tabs (Small Filter Bar) */}
      <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 8, marginBottom: 8 }} className="no-scrollbar">
        {personas.map((p) => {
          const isSel = p.id === activePersonaId;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPersona(p.id)}
              title={p.name}
              style={{
                padding: "4px 8px",
                borderRadius: 8,
                background: isSel ? `${p.color}30` : "transparent",
                border: isSel ? `1px solid ${p.color}` : "1px solid transparent",
                color: isSel ? p.color : "var(--text-tertiary)",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                whiteSpace: "nowrap",
              }}
            >
              <span>{p.avatar}</span>
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Conversation List Container */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Pinned Section */}
        {pinnedConversations.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#f59e0b", letterSpacing: "0.08em", padding: "0 4px 6px" }}>
              📌 Pinned Chats
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {pinnedConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={conv.id === activeConversationId}
                  isEditing={editingId === conv.id}
                  editingTitle={editingTitle}
                  setEditingTitle={setEditingTitle}
                  menuOpen={menuOpenId === conv.id}
                  setMenuOpen={(open) => setMenuOpenId(open ? conv.id : null)}
                  onSelect={() => onSelectConversation(conv.id)}
                  onSaveRename={() => handleSaveRename(conv.id)}
                  onStartRename={() => handleStartRename(conv)}
                  onPin={() => onPin(conv.id, false)}
                  onArchive={() => onArchive(conv.id, true)}
                  onDelete={() => onDelete(conv.id)}
                  persona={personas.find((p) => p.id === conv.persona_id) || activePersona}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Section */}
        <div>
          {pinnedConversations.length > 0 && (
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--text-tertiary)", letterSpacing: "0.08em", padding: "0 4px 6px" }}>
              💬 Recent Chats
            </div>
          )}
          {recentConversations.length === 0 && pinnedConversations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 12px", color: "var(--text-tertiary)", fontSize: 12 }}>
              No chats yet. Start a new conversation!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {recentConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={conv.id === activeConversationId}
                  isEditing={editingId === conv.id}
                  editingTitle={editingTitle}
                  setEditingTitle={setEditingTitle}
                  menuOpen={menuOpenId === conv.id}
                  setMenuOpen={(open) => setMenuOpenId(open ? conv.id : null)}
                  onSelect={() => onSelectConversation(conv.id)}
                  onSaveRename={() => handleSaveRename(conv.id)}
                  onStartRename={() => handleStartRename(conv)}
                  onPin={() => onPin(conv.id, true)}
                  onArchive={() => onArchive(conv.id, true)}
                  onDelete={() => onDelete(conv.id)}
                  persona={personas.find((p) => p.id === conv.persona_id) || activePersona}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function ConversationItem({
  conv,
  isActive,
  isEditing,
  editingTitle,
  setEditingTitle,
  menuOpen,
  setMenuOpen,
  onSelect,
  onSaveRename,
  onStartRename,
  onPin,
  onArchive,
  onDelete,
  persona,
}: {
  conv: Conversation;
  isActive: boolean;
  isEditing: boolean;
  editingTitle: string;
  setEditingTitle: (t: string) => void;
  menuOpen: boolean;
  setMenuOpen: (o: boolean) => void;
  onSelect: () => void;
  onSaveRename: () => void;
  onStartRename: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
  persona: Persona;
}) {
  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={onSelect}
        style={{
          padding: "8px 10px",
          borderRadius: 10,
          background: isActive ? "rgba(34,197,94,0.15)" : "transparent",
          border: isActive ? "1px solid rgba(34,197,94,0.3)" : "1px solid transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14 }}>{persona.avatar}</span>
          {isEditing ? (
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveRename();
                if (e.key === "Escape") setEditingTitle(conv.title);
              }}
              onBlur={onSaveRename}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                background: "var(--bg-glass)",
                border: "1px solid var(--border-secondary)",
                color: "var(--text-primary)",
                borderRadius: 6,
                padding: "2px 6px",
                fontSize: 12,
                outline: "none",
              }}
            />
          ) : (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {conv.title}
              </div>
              {conv.last_message_preview && (
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-tertiary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {conv.last_message_preview}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Options Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-tertiary)",
            fontSize: 12,
            cursor: "pointer",
            padding: "2px 4px",
          }}
        >
          ⋮
        </button>
      </div>

      {/* Options Menu Popover */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: "absolute",
              right: 0,
              top: "100%",
              zIndex: 1000,
              background: "rgba(15, 23, 42, 0.95)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--border-secondary)",
              borderRadius: 10,
              padding: 4,
              boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
              minWidth: 130,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setMenuOpen(false);
                onStartRename();
              }}
              style={menuButtonStyle}
            >
              ✏️ Rename
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onPin();
              }}
              style={menuButtonStyle}
            >
              {conv.is_pinned ? "📌 Unpin" : "📌 Pin to Top"}
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onArchive();
              }}
              style={menuButtonStyle}
            >
              📁 Archive
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
              style={{ ...menuButtonStyle, color: "#ef4444" }}
            >
              🗑️ Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const menuButtonStyle = {
  width: "100%",
  padding: "6px 10px",
  borderRadius: 6,
  background: "none",
  border: "none",
  color: "var(--text-secondary)",
  fontSize: 11,
  fontWeight: 600,
  textAlign: "left" as const,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
};
