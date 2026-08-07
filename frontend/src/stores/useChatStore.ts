import { create } from "zustand";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  agent?: string;
  streaming?: boolean;
}

interface ChatStoreState {
  messages: ChatMessage[];
  sessionId: string | null;
  activePersonaId: string;
  isStreaming: boolean;
  threatLevel: "normal" | "distress" | "crisis";
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
  updateLastMessage: (content: string) => void;
  setSessionId: (id: string | null) => void;
  setActivePersonaId: (id: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  setThreatLevel: (level: "normal" | "distress" | "crisis") => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStoreState>((set) => ({
  messages: [],
  sessionId: null,
  activePersonaId: "sera-cbt",
  isStreaming: false,
  threatLevel: "normal",
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  updateLastMessage: (content) =>
    set((state) => {
      if (state.messages.length === 0) return state;
      const updated = [...state.messages];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        content,
      };
      return { messages: updated };
    }),
  setSessionId: (sessionId) => set({ sessionId }),
  setActivePersonaId: (activePersonaId) => set({ activePersonaId }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setThreatLevel: (threatLevel) => set({ threatLevel }),
  clearMessages: () => set({ messages: [] }),
}));
