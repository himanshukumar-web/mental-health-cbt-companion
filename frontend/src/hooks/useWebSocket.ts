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
const MAX_RECONNECT_ATTEMPTS = 10;

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
  // Track if we intentionally closed the connection (cleanup / manual reconnect)
  const intentionalClose = useRef(false);
  // Track the sessionId that the current WS connection belongs to
  const activeSessionRef = useRef<string>("");

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

  // Close existing WS cleanly (without triggering auto-reconnect)
  const closeExistingWs = useCallback(() => {
    clearPing();
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    const ws = wsRef.current;
    if (ws) {
      intentionalClose.current = true;
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      ws.onopen = null;
      ws.close();
      wsRef.current = null;
    }
  }, [clearPing]);

  const connect = useCallback(() => {
    // Skip if sessionId is empty — wait for it to be set
    if (!sessionId) {
      console.log("[Sera WS] Skipping connect — no sessionId yet");
      return;
    }

    const urls = urlsRef.current;
    if (!urls) return;

    // Close any existing connection cleanly before creating a new one
    closeExistingWs();

    // Mark this session as active
    activeSessionRef.current = sessionId;
    intentionalClose.current = false;

    // Reset reconnect counter for fresh connections (but not for auto-reconnects)
    // This is handled by the caller

    setWsState((s) => ({
      ...s,
      isConnected: false,
      isStreaming: false,
      monitorStatus: "idle",
      therapistStatus: "idle",
      // Preserve existing connectionError during reconnect attempts
      // so the user can still see the error message
      connectionError: reconnectAttempts.current === 0 ? null : s.connectionError,
    }));

    const queryParams = userId ? `?user_id=${userId}` : "";
    const wsUrl = `${urls.wsUrl}/ws/${sessionId}${queryParams}`;
    console.log("[Sera WS] Connecting to:", wsUrl, `(attempt ${reconnectAttempts.current + 1})`);

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch (err) {
      console.error("[Sera WS] WebSocket constructor failed:", err);
      setWsState((s) => ({
        ...s,
        connectionError: `Failed to create WebSocket connection. Make sure the backend is running at ${urls.wsUrl}.`,
      }));
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      // If session changed while we were connecting, discard this connection
      if (activeSessionRef.current !== sessionId) {
        console.log("[Sera WS] Session changed during connect, closing stale WS");
        ws.close();
        return;
      }

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

      // If we intentionally closed, don't auto-reconnect
      if (intentionalClose.current) {
        console.log("[Sera WS] Intentional close — not reconnecting");
        return;
      }

      // If session changed, don't reconnect for the old session
      if (activeSessionRef.current !== sessionId) {
        console.log("[Sera WS] Session changed — not reconnecting old session");
        return;
      }

      setWsState((s) => ({
        ...s,
        isConnected: false,
        isStreaming: false,
        monitorStatus: "idle",
        therapistStatus: "idle",
      }));

      // Check if we've exhausted reconnect attempts
      if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        console.log("[Sera WS] Max reconnect attempts reached, giving up");
        setWsState((s) => ({
          ...s,
          connectionError: `Unable to connect to backend after ${MAX_RECONNECT_ATTEMPTS} attempts. Please check if the backend is running and click "Retry Connection".`,
        }));
        return;
      }

      // Exponential backoff: 2s → 4s → 8s → 16s → max 30s
      const delay = Math.min(
        RECONNECT_BASE_MS * Math.pow(2, reconnectAttempts.current),
        RECONNECT_MAX_MS,
      );
      reconnectAttempts.current += 1;

      if (reconnectAttempts.current >= 3) {
        setWsState((s) => ({
          ...s,
          connectionError: `Trying to connect to backend... (attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`,
        }));
      }

      console.log(`[Sera WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = (event) => {
      console.error("[Sera WS] WebSocket error:", event);
      // Don't manually close — let the browser fire onclose naturally after onerror
      // This prevents double-reconnect issues
    };

    ws.onmessage = (event) => {
      // Ignore messages from stale sessions
      if (activeSessionRef.current !== sessionId) return;

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
  }, [sessionId, userId, startPing, clearPing, closeExistingWs]);

  // Connect when sessionId changes (and is non-empty)
  useEffect(() => {
    if (!sessionId) {
      // Don't attempt connection with empty sessionId
      return;
    }

    // Reset reconnect counter for a fresh session
    reconnectAttempts.current = 0;
    connect();

    return () => {
      closeExistingWs();
    };
  }, [sessionId, userId]); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: We intentionally exclude `connect` and `closeExistingWs` from deps
  // because they change on every sessionId/userId change, which would cause
  // an infinite loop. The effect already re-runs when sessionId/userId changes.

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
    closeExistingWs();
    // Clear error state before reconnecting
    setWsState((s) => ({
      ...s,
      connectionError: null,
    }));
    // Small delay to ensure cleanup is complete
    setTimeout(() => {
      connect();
    }, 100);
  }, [connect, closeExistingWs]);

  return { messages, wsState, crisis, sendMessage, dismissCrisis, manualReconnect };
}
