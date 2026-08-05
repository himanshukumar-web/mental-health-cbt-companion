"use client";

import { useState, useEffect, useCallback } from "react";
import { getApiUrl } from "@/lib/config";

export interface Conversation {
  id: string;
  user_id: string;
  persona_id: string;
  title: string;
  is_pinned: boolean;
  is_archived: boolean;
  message_count: number;
  last_message_preview?: string;
  created_at: string;
  updated_at: string;
}

export function useChatHistory(userId?: string, activePersonaId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showArchived, setShowArchived] = useState<boolean>(false);

  const API_URL = getApiUrl();

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activePersonaId) params.set("persona_id", activePersonaId);
      if (showArchived) params.set("archived", "true");
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`${API_URL}/conversations/${userId}?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("[useChatHistory] Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, activePersonaId, showArchived, searchQuery, API_URL]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = async (personaId: string, title?: string): Promise<Conversation | null> => {
    if (!userId) return null;
    try {
      const res = await fetch(`${API_URL}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          persona_id: personaId,
          title: title || "New Therapy Chat",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newConv = data.conversation;
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        return newConv;
      }
    } catch (err) {
      console.error("[useChatHistory] Error creating conversation:", err);
    }
    return null;
  };

  const renameConversation = async (convId: string, newTitle: string) => {
    if (!userId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, title: newTitle } : c))
    );
    try {
      await fetch(`${API_URL}/conversations/${convId}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, title: newTitle }),
      });
    } catch (err) {
      console.error("[useChatHistory] Error renaming conversation:", err);
    }
  };

  const pinConversation = async (convId: string, isPinned: boolean) => {
    if (!userId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, is_pinned: isPinned } : c))
    );
    try {
      await fetch(`${API_URL}/conversations/${convId}/pin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, is_pinned: isPinned }),
      });
    } catch (err) {
      console.error("[useChatHistory] Error pinning conversation:", err);
    }
  };

  const archiveConversation = async (convId: string, isArchived: boolean) => {
    if (!userId) return;
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    try {
      await fetch(`${API_URL}/conversations/${convId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, is_archived: isArchived }),
      });
    } catch (err) {
      console.error("[useChatHistory] Error archiving conversation:", err);
    }
  };

  const deleteConversation = async (convId: string) => {
    if (!userId) return;
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConversationId === convId) {
      setActiveConversationId(null);
    }
    try {
      await fetch(`${API_URL}/conversations/${convId}?user_id=${userId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("[useChatHistory] Error deleting conversation:", err);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  return {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    loading,
    searchQuery,
    setSearchQuery,
    showArchived,
    setShowArchived,
    fetchConversations,
    createConversation,
    renameConversation,
    pinConversation,
    archiveConversation,
    deleteConversation,
  };
}
