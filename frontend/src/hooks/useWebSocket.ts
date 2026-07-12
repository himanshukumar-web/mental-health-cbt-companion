"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  agent?: "therapist";
  streaming?: boolean;
  threatLevel?: string;
}

export type ThreatLevel = "normal" | "distress" | "crisis";
export type AgentStatus = "active" | "alert" | "idle";

export interface WSState {
  isConnected: boolean;
  isStreaming: boolean;
  monitorStatus: AgentStatus;
  therapistStatus: AgentStatus;
  threatLevel: ThreatLevel;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, "ws") ?? "ws://localhost:8000";

const HTTP_API_URL = API_URL.replace(/^ws/, "http");

export function useWebSocket(sessionId: string, userId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [wsState, setWsState] = useState<WSState>({
    isConnected: false,
    isStreaming: false,
    monitorStatus: "idle",
    therapistStatus: "idle",
    threatLevel: "normal",
  });
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi, I'm Sera — your CBT companion. 🌿 This is a safe space to talk through whatever's on your mind. I use evidence-based CBT techniques to help you explore your thoughts and feelings. How are you doing today?",
      agent: "therapist",
    },
  ]);
  const [crisis, setCrisis] = useState(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // History ref so sendMessage always reads latest
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  // Load session history on mount or when sessionId changes
  useEffect(() => {
    if (!sessionId) return;

    // Reset messages, history, and crisis state immediately when sessionId changes
    const defaultMessages: ChatMessage[] = [
      {
        role: "assistant",
        content:
          "Hi, I'm Sera — your CBT companion. 🌿 This is a safe space to talk through whatever's on your mind. I use evidence-based CBT techniques to help you explore your thoughts and feelings. How are you doing today?",
        agent: "therapist",
      },
    ];
    setMessages(defaultMessages);
    historyRef.current = [];
    setCrisis(false);

    let active = true;

    const loadHistory = async () => {
      try {
        const res = await fetch(`${HTTP_API_URL}/sessions/${sessionId}/history`);
        if (res.ok) {
          const data = await res.json();
          if (active && data.messages && data.messages.length > 0) {
            setMessages(data.messages);
            historyRef.current = data.messages.map((m: any) => ({ role: m.role, content: m.content }));
          }
        }
      } catch (err) {
        if (active) {
          console.error("Failed to load session history:", err);
        }
      }
    };
    loadHistory();

    return () => {
      active = false;
    };
  }, [sessionId]);

  const connect = useCallback(() => {
    if (!sessionId) return;
    setWsState({
      isConnected: false,
      isStreaming: false,
      monitorStatus: "idle",
      therapistStatus: "idle",
      threatLevel: "normal",
    });
    const queryParams = userId ? `?user_id=${userId}` : "";
    const ws = new WebSocket(`${API_URL}/ws/${sessionId}${queryParams}`);
    wsRef.current = ws;

    ws.onopen = () =>
      setWsState((s) => ({ ...s, isConnected: true, monitorStatus: "active", therapistStatus: "active" }));

    ws.onclose = () => {
      setWsState((s) => ({ ...s, isConnected: false, monitorStatus: "idle", therapistStatus: "idle" }));
      // Reconnect after 3 s
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as {
        type: string;
        content?: string;
        threat_level?: string;
        agent?: string;
      };

      switch (data.type) {
        case "monitor_result": {
          const tl = (data.threat_level ?? "normal") as ThreatLevel;
          setWsState((s) => ({
            ...s,
            threatLevel: tl,
            monitorStatus: tl === "crisis" ? "alert" : "active",
          }));
          // Reset monitor badge after 2 s
          if (tl !== "crisis") {
            setTimeout(
              () => setWsState((s) => ({ ...s, monitorStatus: "active" })),
              2000
            );
          }
          break;
        }

        case "crisis":
          setCrisis(true);
          setWsState((s) => ({ ...s, isStreaming: false, monitorStatus: "alert" }));
          break;

        case "stream_start":
          setWsState((s) => ({ ...s, isStreaming: true, therapistStatus: "active" }));
          // Push empty streaming assistant bubble
          setMessages((m) => [
            ...m,
            { role: "assistant", content: "", agent: "therapist", streaming: true },
          ]);
          break;

        case "token":
          setMessages((m) => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant" && last.streaming) {
              copy[copy.length - 1] = { ...last, content: last.content + (data.content ?? "") };
            }
            return copy;
          });
          break;

        case "stream_end":
          setMessages((m) => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant" && last.streaming) {
              // Update historyRef with full assistant reply
              historyRef.current = [
                ...historyRef.current,
                { role: "assistant", content: last.content },
              ];
              copy[copy.length - 1] = { ...last, streaming: false, threatLevel: data.threat_level };
            }
            return copy;
          });
          setWsState((s) => ({ ...s, isStreaming: false, therapistStatus: "active" }));
          break;

        case "error":
          setMessages((m) => [
            ...m,
            {
              role: "assistant",
              content:
                data.content ??
                "I'm having trouble connecting right now. Please try again.",
              agent: "therapist",
            },
          ]);
          setWsState((s) => ({ ...s, isStreaming: false }));
          break;
      }
    };
  }, [sessionId]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      const ws = wsRef.current;
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback(
    (content: string) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || wsState.isStreaming || crisis) return;

      // Optimistically add user message
      setMessages((m) => [...m, { role: "user", content }]);
      historyRef.current = [...historyRef.current, { role: "user", content }];

      ws.send(
        JSON.stringify({
          type: "message",
          content,
          history: historyRef.current.slice(-20), // send last 20 turns
        })
      );
    },
    [wsState.isStreaming, crisis]
  );

  const dismissCrisis = useCallback(() => {
    setCrisis(false);
    setWsState((s) => ({ ...s, monitorStatus: "active", threatLevel: "normal" }));
  }, []);

  return { messages, wsState, crisis, sendMessage, dismissCrisis };
}
