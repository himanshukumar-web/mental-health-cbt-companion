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
  connectionError: string | null;
}

// ── Smart backend URL detection ─────────────────────────────────────────────
// Handles: Web browser, Capacitor on physical device, Android emulator

function getBackendUrls(): { wsUrl: string; httpUrl: string } {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "";

  // Running in a browser (Next.js dev or production)
  if (typeof window !== "undefined") {
    // Check if running inside Capacitor native app
    const isCapacitor =
      (window as any).Capacitor !== undefined ||
      window.location.protocol === "capacitor:";

    if (isCapacitor) {
      // In Capacitor, use the env URL (should point to the backend server IP)
      // If no env URL, try common local dev addresses
      const baseUrl = envUrl || "http://10.0.2.2:8000";
      const wsBase = baseUrl.replace(/^http/, "ws");
      return { wsUrl: wsBase, httpUrl: baseUrl };
    }
  }

  // Default: use env URL or localhost
  const baseUrl = envUrl || "http://localhost:8000";
  const wsBase = baseUrl.replace(/^http/, "ws");
  return { wsUrl: wsBase, httpUrl: baseUrl };
}

// Ping interval to keep WebSocket alive on proxy environments (Render/Vercel)
const PING_INTERVAL_MS = 25_000;

// Exponential backoff constants
const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS = 30_000;

export function useWebSocket(sessionId: string, userId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [wsState, setWsState] = useState<WSState>({
    isConnected: false,
    isStreaming: false,
    monitorStatus: "idle",
    therapistStatus: "idle",
    threatLevel: "normal",
    connectionError: null,
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
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttempts = useRef(0);

  // History ref so sendMessage always reads latest
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  // Resolve URLs once
  const urlsRef = useRef<{ wsUrl: string; httpUrl: string } | null>(null);
  if (typeof window !== "undefined" && !urlsRef.current) {
    urlsRef.current = getBackendUrls();
    console.log("[Sera WS] Backend URLs:", urlsRef.current);
  }

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
      const urls = urlsRef.current;
      if (!urls) return;
      try {
        const res = await fetch(`${urls.httpUrl}/sessions/${sessionId}/history`);
        if (res.ok) {
          const data = await res.json();
          if (active && data.messages && data.messages.length > 0) {
            setMessages(data.messages);
            historyRef.current = data.messages.map((m: any) => ({ role: m.role, content: m.content }));
          }
        }
      } catch (err) {
        if (active) {
          console.error("[Sera WS] Failed to load session history:", err);
        }
      }
    };
    loadHistory();

    return () => {
      active = false;
    };
  }, [sessionId]);

  // Clear ping interval helper
  const clearPing = useCallback(() => {
    if (pingTimer.current) {
      clearInterval(pingTimer.current);
      pingTimer.current = null;
    }
  }, []);

  // Start ping interval — keeps WS alive on Render/Vercel proxies
  const startPing = useCallback(() => {
    clearPing();
    pingTimer.current = setInterval(() => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: "ping" }));
        } catch {
          // Ignore — connection may have just closed
        }
      }
    }, PING_INTERVAL_MS);
  }, [clearPing]);

  const connect = useCallback(() => {
    if (!sessionId) return;

    const urls = urlsRef.current;
    if (!urls) return;

    setWsState({
      isConnected: false,
      isStreaming: false,
      monitorStatus: "idle",
      therapistStatus: "idle",
      threatLevel: "normal",
      connectionError: null,
    });

    const queryParams = userId ? `?user_id=${userId}` : "";
    const wsUrl = `${urls.wsUrl}/ws/${sessionId}${queryParams}`;
    console.log("[Sera WS] Connecting to:", wsUrl);

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch (err) {
      console.error("[Sera WS] WebSocket constructor failed:", err);
      setWsState((s) => ({
        ...s,
        connectionError: `Failed to create WebSocket connection to ${urls.wsUrl}. Make sure the backend is running.`,
      }));
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[Sera WS] Connected successfully!");
      reconnectAttempts.current = 0; // Reset backoff on successful connect
      setWsState((s) => ({
        ...s,
        isConnected: true,
        monitorStatus: "active",
        therapistStatus: "active",
        connectionError: null,
      }));
      startPing();
    };

    ws.onclose = (event) => {
      console.log("[Sera WS] Connection closed:", event.code, event.reason);
      clearPing();
      setWsState((s) => ({
        ...s,
        isConnected: false,
        monitorStatus: "idle",
        therapistStatus: "idle",
      }));
      // Exponential backoff: 2s → 4s → 8s → 16s → max 30s
      const delay = Math.min(
        RECONNECT_BASE_MS * Math.pow(2, reconnectAttempts.current),
        RECONNECT_MAX_MS,
      );
      reconnectAttempts.current += 1;

      if (reconnectAttempts.current >= 3) {
        setWsState((s) => ({
          ...s,
          connectionError: `Cannot connect to backend at ${urls.wsUrl}. Please ensure the backend server is running.`,
        }));
      }

      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = (event) => {
      console.error("[Sera WS] WebSocket error:", event);
      ws.close();
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as {
        type: string;
        content?: string;
        threat_level?: string;
        agent?: string;
      };

      // Ignore pong messages (keep-alive responses)
      if (data.type === "pong") return;

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
  }, [sessionId, userId, startPing, clearPing]);

  useEffect(() => {
    connect();
    return () => {
      clearPing();
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

  // Manual reconnect — allows user to retry from the UI
  const manualReconnect = useCallback(() => {
    console.log("[Sera WS] Manual reconnect triggered");
    reconnectAttempts.current = 0;
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    const ws = wsRef.current;
    if (ws) {
      ws.onclose = null;
      ws.close();
    }
    connect();
  }, [connect]);

  return { messages, wsState, crisis, sendMessage, dismissCrisis, manualReconnect };
}

