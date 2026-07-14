"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ThemeSelector from "@/components/ThemeSelector";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Appointment {
  id: string;
  doctor_id: string;
  patient_name: string;
  patient_email: string;
  date: string;
  time_slot: string;
  status: string;
  notes: string;
  created_at: string;
  doctors?: {
    full_name: string;
    specialization: string;
    user_id: string;
  };
}

interface ChatPartner {
  user_id: string;
  name: string;
  role: string;
  is_online?: boolean;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
}

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    pending: { bg: "var(--warning-bg)", text: "var(--warning-text)", border: "var(--warning-border)", icon: "⏳" },
    confirmed: { bg: "var(--info-bg)", text: "var(--info-text)", border: "var(--info-border)", icon: "✓" },
    completed: { bg: "var(--success-bg)", text: "var(--success-text)", border: "var(--success-border)", icon: "✅" },
    cancelled: { bg: "var(--crisis-bg)", text: "var(--crisis-text)", border: "var(--crisis-border)", icon: "✕" },
  };
  const s = styles[status] || styles.pending;
  return (
    <span style={{
      padding: "5px 12px", borderRadius: 8,
      background: s.bg, color: s.text,
      border: `0.5px solid ${s.border}`,
      fontSize: 12, fontWeight: 600,
      display: "flex", alignItems: "center", gap: 5,
    }}>
      {s.icon} {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Notification Bell Component ──────────────────────────────────────────

function NotificationBell({ userId, isMobile }: { userId: string; isMobile: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Poll notifications
  useEffect(() => {
    if (!userId) return;
    const fetchNotifs = async () => {
      try {
        const res = await fetch(`${API_URL}/notifications/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unread_count || 0);
        }
      } catch { /* ignore */ }
    };
    fetchNotifs();
    const t = setInterval(fetchNotifs, 5000);
    return () => clearInterval(t);
  }, [userId]);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, { method: "PATCH" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch(`${API_URL}/notifications/read-all/${userId}`, { method: "PATCH" });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div ref={bellRef} style={{ position: "relative" }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: "relative", width: isMobile ? 34 : 38, height: isMobile ? 34 : 38,
          borderRadius: 10, border: "0.5px solid var(--border-secondary)",
          background: "var(--bg-glass)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: isMobile ? 16 : 18, transition: "all 0.2s",
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            width: 18, height: 18, borderRadius: "50%",
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            color: "white", fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
            animation: "scaleIn 0.3s ease",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: isMobile ? "calc(100vw - 32px)" : 360, maxHeight: 420,
          borderRadius: 16, background: "var(--bg-secondary)",
          border: "0.5px solid var(--border-secondary)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
          zIndex: 1000, overflow: "hidden",
          animation: "fadeIn 0.2s ease",
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 16px", borderBottom: "0.5px solid var(--border-tertiary)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: "none", border: "none", color: "#86efac",
                  fontSize: 12, fontWeight: 500, cursor: "pointer",
                }}
              >Mark all read</button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <Link
                  key={n.id}
                  href={n.link || "#"}
                  onClick={() => { handleMarkRead(n.id); setShowDropdown(false); }}
                  style={{
                    display: "flex", gap: 12, padding: "12px 16px",
                    borderBottom: "0.5px solid var(--border-tertiary)",
                    background: n.is_read ? "transparent" : "rgba(34,197,94,0.04)",
                    transition: "background 0.2s",
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: n.type === "appointment_confirmed" ? "rgba(34,197,94,0.15)"
                      : n.type === "appointment_cancelled" ? "rgba(239,68,68,0.12)"
                      : "rgba(59,130,246,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>
                    {n.type === "appointment_confirmed" ? "✅" : n.type === "appointment_cancelled" ? "❌" : "📅"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: n.is_read ? 400 : 600,
                      color: "var(--text-primary)", marginBottom: 2,
                    }}>{n.title}</div>
                    <div style={{
                      fontSize: 12, color: "var(--text-secondary)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{n.message}</div>
                    <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 4 }}>
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                  {!n.is_read && (
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      background: "#22c55e", alignSelf: "center",
                      boxShadow: "0 0 6px rgba(34,197,94,0.5)",
                    }} />
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Typing Indicator Component ──────────────────────────────────────────

function TypingIndicator({ name }: { name: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "6px 0", animation: "fadeIn 0.3s ease",
    }}>
      <div style={{
        padding: "8px 14px", borderRadius: "14px 14px 14px 0",
        background: "var(--bg-secondary)",
        border: "0.5px solid var(--border-secondary)",
        display: "flex", alignItems: "center", gap: 4,
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--text-tertiary)",
            animation: `bounce 1.2s ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontStyle: "italic" }}>
        Dr. {name} is typing...
      </span>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

function MyAppointmentsPageInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "all";
  const initialDoctorUserId = searchParams.get("doctorUserId");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState(initialTab);

  // Chat states
  const [chatPartners, setChatPartners] = useState<ChatPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [activePartnerHover, setActivePartnerHover] = useState<string | null>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);

  // Typing debounce
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef(0);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(34,197,94,0.3)", borderTopColor: "#22c55e", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  // Load appointments
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/appointments/user/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setAppointments(data.appointments || []);
        }
      } catch { /* ignore */ }
      setLoadingData(false);
    })();
  }, [user]);

  // Heartbeat for online presence
  useEffect(() => {
    if (!user) return;
    const sendHeartbeat = () => {
      fetch(`${API_URL}/users/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      }).catch(() => {});
    };
    sendHeartbeat();
    const t = setInterval(sendHeartbeat, 15000);
    return () => clearInterval(t);
  }, [user]);

  // Load chat partners and handle query parameter select
  useEffect(() => {
    if (!user || filter !== "chat") return;
    const loadPartners = async () => {
      try {
        const res = await fetch(`${API_URL}/messages/partners/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          const partners = data.partners || [];
          setChatPartners(partners);
          
          // Auto select from query params
          if (initialDoctorUserId && partners.length > 0) {
            const match = partners.find((p: ChatPartner) => p.user_id === initialDoctorUserId);
            if (match) setSelectedPartner(match);
          }
        }
      } catch (e) {
        console.error("Failed to load chat partners:", e);
      }
    };
    loadPartners();
    const t = setInterval(loadPartners, 4000);
    return () => clearInterval(t);
  }, [user, filter, initialDoctorUserId]);

  // Load messages + typing status
  useEffect(() => {
    if (!user || !selectedPartner || filter !== "chat") return;
    const loadHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/messages/history?user1=${user.id}&user2=${selectedPartner.user_id}`);
        if (res.ok) {
          const data = await res.json();
          setChatMessages(data.messages || []);
          setPartnerTyping(data.is_typing || false);
        }
      } catch (e) {
        console.error("Failed to load message history:", e);
      }
    };
    loadHistory();
    const t = setInterval(loadHistory, 3000);
    return () => clearInterval(t);
  }, [user, selectedPartner, filter]);

  // Scroll chat to end
  useEffect(() => {
    if (filter === "chat" && selectedPartner) {
      const el = document.getElementById("patient-chat-end");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, filter, selectedPartner, partnerTyping]);

  // Send typing indicator (debounced)
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!user || !selectedPartner) return;
    const now = Date.now();
    if (isTyping && now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;
    fetch(`${API_URL}/messages/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender_id: user.id,
        receiver_id: selectedPartner.user_id,
        is_typing: isTyping,
      }),
    }).catch(() => {});
  }, [user, selectedPartner]);

  const handleInputChange = (val: string) => {
    setChatInput(val);
    if (val.trim()) {
      sendTypingIndicator(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => sendTypingIndicator(false), 3000);
    } else {
      sendTypingIndicator(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await fetch(`${API_URL}/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "cancelled" } : a));
    } catch { /* ignore */ }
  };

  const handleSend = async () => {
    if (!chatInput.trim() || !user || !selectedPartner || sendingMsg) return;
    setSendingMsg(true);
    sendTypingIndicator(false);
    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_id: selectedPartner.user_id,
          content: chatInput.trim()
        })
      });
      if (res.ok) {
        const newMsg = await res.json();
        setChatMessages(prev => [...prev, newMsg]);
        setChatInput("");
      }
    } catch (e) {
      console.error("Failed to send message:", e);
    }
    setSendingMsg(false);
  };

  const filtered = appointments;

  const filters = [
    { id: "all", label: "📅 Booked Sessions", count: appointments.length },
    { id: "chat", label: "💬 Chat with Doctor", count: chatPartners.length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "0 16px 60px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scaleIn { from { transform: scale(0.8); opacity:0; } to { transform: scale(1); opacity:1; } }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @media (max-width: 768px) {
          .my-chat-layout { height: calc(100vh - 250px) !important; min-height: 450px !important; }
          .my-chat-sidebar { width: 100% !important; height: 100% !important; max-height: none !important; }
          .my-chat-main { height: 100% !important; min-height: none !important; }
        }
      `}</style>

      {/* Navbar */}
      <nav style={{
        maxWidth: 900, margin: "0 auto", padding: "16px 0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 14 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10 }}>
            <div style={{
              width: isMobile ? 28 : 34, height: isMobile ? 28 : 34, borderRadius: "50%",
              background: "linear-gradient(135deg, #a7f3d0, #6ee7b7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: isMobile ? 14 : 16, boxShadow: "0 0 20px rgba(34,197,94,0.3)",
            }}>🌿</div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: isMobile ? 16 : 18, color: "var(--text-primary)" }}>Sera</span>
          </Link>
          <ThemeSelector />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <NotificationBell userId={user.id} isMobile={isMobile} />
          <Link href="/appointments" style={{
            padding: isMobile ? "5px 12px" : "7px 16px", borderRadius: 10,
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "white", fontSize: isMobile ? 12 : 13, fontWeight: 600,
          }}>+ Book New</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: isMobile ? 20 : 32, animation: "fadeIn 0.4s ease" }}>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(22px, 4vw, 32px)",
            fontWeight: 700, color: "var(--text-primary)", marginBottom: 8,
          }}>My Appointments 📋</h1>
          <p style={{ fontSize: isMobile ? 13 : 15, color: "var(--text-secondary)" }}>
            Track your bookings and chat live with your doctor
          </p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: isMobile ? 16 : 24, flexWrap: "wrap", animation: "fadeIn 0.4s ease 0.1s both" }}>
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id); setSelectedPartner(null); }}
              style={{
                padding: isMobile ? "7px 12px" : "8px 16px", borderRadius: 10, border: "none",
                background: filter === f.id ? "rgba(34,197,94,0.15)" : "var(--bg-glass)",
                color: filter === f.id ? "#86efac" : "var(--text-secondary)",
                fontSize: isMobile ? 12 : 13, fontWeight: filter === f.id ? 600 : 400,
                cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {f.label}
              <span style={{
                padding: "1px 6px", borderRadius: 6,
                background: filter === f.id ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)",
                fontSize: 11,
              }}>{f.count}</span>
            </button>
          ))}
        </div>

        {/* Direct Messages Chat View */}
        {filter === "chat" ? (
          <div className="my-chat-layout" style={{ display: "flex", gap: 16, height: 480, animation: "fadeIn 0.4s ease" }}>
            {/* Doctors list (Left Column) */}
            {(!isMobile || !selectedPartner) && (
              <div className="my-chat-sidebar" style={{
                width: isMobile ? "100%" : 240, background: "var(--bg-glass)", border: "0.5px solid var(--border-secondary)",
                borderRadius: 16, padding: 12, display: "flex", flexDirection: "column", gap: 8
              }}>
              <h4 style={{ fontSize: 13, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", paddingBottom: 8, borderBottom: "0.5px solid var(--border-tertiary)" }}>
                Your Doctors
              </h4>
              {chatPartners.length === 0 ? (
                <div style={{ color: "var(--text-tertiary)", fontSize: 12, padding: "20px 0", textAlign: "center" }}>
                  Book an appointment first to open a chat channel with your doctor.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, overflowY: "auto", flex: 1 }}>
                  {chatPartners.map(p => {
                    const isSelected = selectedPartner?.user_id === p.user_id;
                    const isHovered = activePartnerHover === p.user_id;
                    return (
                      <button
                        key={p.user_id}
                        onClick={() => setSelectedPartner(p)}
                        onMouseEnter={() => setActivePartnerHover(p.user_id)}
                        onMouseLeave={() => setActivePartnerHover(null)}
                        style={{
                          padding: "10px 12px", borderRadius: 10, border: "none",
                          background: isSelected ? "var(--success-bg)" : isHovered ? "var(--bg-glass-hover)" : "transparent",
                          color: isSelected ? "var(--success-text)" : "var(--text-secondary)",
                          textAlign: "left", cursor: "pointer", transition: "all 0.2s"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ position: "relative" }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: "50%",
                              background: isSelected ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: isSelected ? "white" : "var(--text-secondary)", fontSize: 12, fontWeight: "bold"
                            }}>{p.name.charAt(0)}</div>
                            <span style={{
                              position: "absolute", bottom: -1, right: -1,
                              width: 9, height: 9, borderRadius: "50%",
                              background: p.is_online ? "#22c55e" : "#6b7280",
                              border: "2px solid var(--bg-primary)",
                              boxShadow: p.is_online ? "0 0 6px rgba(34,197,94,0.5)" : "none",
                            }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>Dr. {p.name}</div>
                            <div style={{ fontSize: 10, color: p.is_online ? "#22c55e" : "var(--text-tertiary)" }}>
                              {p.is_online ? "● Online" : "○ Offline"}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            )}

            {/* Chat Box (Right Column) */}
            {(!isMobile || selectedPartner) && (
              <div className="my-chat-main" style={{
                flex: 1, background: "var(--bg-glass)", border: "0.5px solid var(--border-secondary)",
                borderRadius: 16, display: isMobile && !selectedPartner ? "none" : "flex", flexDirection: "column", overflow: "hidden",
                width: isMobile ? "100%" : "auto"
              }}>
                {selectedPartner ? (
                  <>
                    {/* Header */}
                    <div style={{ padding: "12px 18px", borderBottom: "0.5px solid var(--border-tertiary)", display: "flex", alignItems: "center", gap: 12 }}>
                      {isMobile && (
                        <button
                          onClick={() => setSelectedPartner(null)}
                          style={{
                            background: "none", border: "none", color: "var(--text-primary)",
                            fontSize: 18, cursor: "pointer", marginRight: 8,
                            display: "flex", alignItems: "center", justifyContent: "center"
                          }}
                          title="Back to list"
                        >
                          ←
                        </button>
                      )}
                    <div style={{ position: "relative" }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: "50%",
                        background: "linear-gradient(135deg, #22c55e, #16a34a)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontWeight: "bold", fontSize: 14
                      }}>{selectedPartner.name.charAt(0)}</div>
                      <span style={{
                        position: "absolute", bottom: -1, right: -1,
                        width: 9, height: 9, borderRadius: "50%",
                        background: selectedPartner.is_online ? "#22c55e" : "#6b7280",
                        border: "2px solid var(--bg-primary)",
                        boxShadow: selectedPartner.is_online ? "0 0 6px rgba(34,197,94,0.5)" : "none",
                      }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                        Dr. {selectedPartner.name}
                      </div>
                      <div style={{ fontSize: 10, color: selectedPartner.is_online ? "#22c55e" : "#6b7280", display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: selectedPartner.is_online ? "#22c55e" : "#6b7280", display: "inline-block" }}></span>
                        {partnerTyping ? (
                          <span style={{ color: "#86efac", fontStyle: "italic" }}>typing...</span>
                        ) : (
                          selectedPartner.is_online ? "Online" : "Offline"
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Message feed */}
                  <div style={{ flex: 1, padding: isMobile ? "12px 14px" : "16px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                    {(() => {
                      let lastDateStr = "";
                      return chatMessages.map(m => {
                        const isOwn = m.sender_id === user?.id;
                        const msgDate = new Date(m.timestamp);
                        const dateStr = msgDate.toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                        const showDateSeparator = dateStr !== lastDateStr;
                        lastDateStr = dateStr;

                        return (
                          <div key={m.id} style={{ display: "flex", flexDirection: "column", width: "100%", gap: 6 }}>
                            {showDateSeparator && (
                              <div style={{
                                alignSelf: "center",
                                margin: "18px 0 8px",
                                padding: "4px 12px",
                                borderRadius: 20,
                                background: "rgba(255, 255, 255, 0.05)",
                                border: "0.5px solid var(--border-secondary)",
                                color: "var(--text-tertiary)",
                                fontSize: 10,
                                fontWeight: 500,
                                letterSpacing: "0.03em"
                              }}>
                                {dateStr}
                              </div>
                            )}
                            <div
                              style={{
                                alignSelf: isOwn ? "flex-end" : "flex-start",
                                maxWidth: isMobile ? "85%" : "70%",
                                padding: "10px 14px",
                                borderRadius: isOwn ? "14px 14px 0 14px" : "14px 14px 14px 0",
                                background: isOwn ? "rgba(34,197,94,0.15)" : "var(--bg-secondary)",
                                border: isOwn ? "0.5px solid rgba(34,197,94,0.3)" : "0.5px solid var(--border-secondary)",
                                color: "var(--text-primary)",
                                fontSize: 13,
                                lineHeight: 1.5
                              }}
                            >
                              <div style={{
                                fontSize: 9,
                                fontWeight: 600,
                                color: isOwn ? "#86efac" : "#93c5fd",
                                marginBottom: 3
                              }}>
                                {isOwn ? "You" : `Dr. ${selectedPartner.name}`}
                              </div>
                              <div>{m.content}</div>
                              <div style={{ fontSize: 9, color: "var(--text-tertiary)", marginTop: 4, textAlign: isOwn ? "right" : "left" }}>
                                {msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                    {/* Typing indicator */}
                    {partnerTyping && selectedPartner && (
                      <TypingIndicator name={selectedPartner.name} />
                    )}
                    <div id="patient-chat-end" />
                  </div>

                  {/* Input form */}
                  <div style={{ padding: "12px 16px", borderTop: "0.5px solid var(--border-tertiary)", display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => handleInputChange(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
                      placeholder={`Message Dr. ${selectedPartner.name}...`}
                      style={{
                        flex: 1, padding: "10px 14px", borderRadius: 10,
                        border: "0.5px solid var(--border-secondary)",
                        background: "var(--bg-secondary)", color: "var(--text-primary)",
                        fontSize: 13, fontFamily: "inherit"
                      }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={sendingMsg || !chatInput.trim()}
                      style={{
                        padding: "10px 16px", borderRadius: 10, border: "none",
                        background: chatInput.trim() ? "linear-gradient(135deg, #22c55e, #16a34a)" : "rgba(255,255,255,0.05)",
                        color: chatInput.trim() ? "white" : "var(--text-tertiary)",
                        fontSize: 13, fontWeight: 600, cursor: chatInput.trim() ? "pointer" : "default"
                      }}
                    >
                      {sendingMsg ? "..." : "Send"}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ margin: "auto", textAlign: "center", color: "var(--text-tertiary)" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>No Active Chat</div>
                  <div style={{ fontSize: 12 }}>Select a doctor on the left to start live chat.</div>
                </div>
              )}
            </div>
            )}
          </div>
        ) : (
          /* Normal Appointments Lists */
          <>
            {loadingData ? (
              <div style={{ textAlign: "center", padding: 60, color: "var(--text-tertiary)" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2.5px solid rgba(22,163,74,0.3)", borderTopColor: "#22c55e", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
                Loading your appointments...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{
                textAlign: "center", padding: isMobile ? "40px 16px" : "60px 24px", borderRadius: 20,
                background: "var(--bg-glass)", border: "0.5px solid var(--border-secondary)",
                animation: "fadeIn 0.4s ease 0.2s both",
              }}>
                <div style={{ fontSize: isMobile ? 40 : 52, marginBottom: 16 }}>📅</div>
                <h3 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8, fontFamily: "var(--font-display)" }}>
                  No Appointments
                </h3>
                <p style={{ fontSize: isMobile ? 13 : 14, color: "var(--text-secondary)", marginBottom: 24 }}>
                  {filter !== "all" ? `No ${filter} appointments found` : "You haven't booked any appointments yet"}
                </p>
                <Link href="/appointments" style={{
                  display: "inline-block", padding: "12px 28px", borderRadius: 12,
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "white", fontSize: 14, fontWeight: 600,
                  boxShadow: "0 4px 20px rgba(34,197,94,0.3)",
                }}>Book Your First Appointment →</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filtered.map((appt, i) => {
                  const isPast = new Date(appt.date) < new Date(new Date().toDateString());
                  return (
                    <div key={appt.id} style={{
                      padding: isMobile ? "16px" : "22px 24px", borderRadius: 16,
                      background: "var(--bg-glass)", backdropFilter: "blur(12px)",
                      border: "0.5px solid var(--border-secondary)",
                      animation: `fadeIn 0.3s ease ${i * 0.04}s both`,
                      transition: "all 0.2s",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: isMobile ? 12 : 16 }}>
                        <div style={{ display: "flex", gap: isMobile ? 12 : 16, flex: 1, minWidth: 0 }}>
                          <div style={{
                            width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius: isMobile ? 12 : 14, flexShrink: 0,
                            background: "linear-gradient(135deg, #22c55e, #16a34a)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: isMobile ? 16 : 20, color: "white", fontWeight: 700,
                          }}>
                            {appt.doctors?.full_name?.charAt(0) || "D"}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <h3 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                              Dr. {appt.doctors?.full_name || "Doctor"}
                            </h3>
                            <div style={{ fontSize: isMobile ? 11 : 12, color: "var(--text-tertiary)", marginBottom: 10 }}>
                              {appt.doctors?.specialization || "CBT Therapist"}
                            </div>
                            <div style={{ display: "flex", gap: isMobile ? 10 : 16, flexWrap: "wrap" }}>
                              <span style={{ fontSize: isMobile ? 12 : 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 5 }}>
                                📅 {new Date(appt.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                              <span style={{ fontSize: isMobile ? 12 : 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 5 }}>
                                🕐 {appt.time_slot}
                              </span>
                              {isPast && (
                                <span style={{ fontSize: 11, color: "#fca5a5", padding: "2px 8px", borderRadius: 6, background: "rgba(239,68,68,0.1)" }}>
                                  Past date
                                </span>
                              )}
                            </div>
                            {appt.notes && (
                              <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 8, lineHeight: 1.5 }}>
                                💬 {appt.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", alignItems: isMobile ? "center" : "flex-end", gap: 10, flexWrap: "wrap" }}>
                          <StatusBadge status={appt.status} />
                          {appt.doctors?.user_id && (
                            <button
                              onClick={() => {
                                setFilter("chat");
                                setSelectedPartner({
                                  user_id: appt.doctors!.user_id,
                                  name: appt.doctors!.full_name,
                                  role: "doctor"
                                });
                              }}
                              style={{
                                padding: "8px 16px", borderRadius: 10, border: "none",
                                background: "rgba(34,197,94,0.15)", color: "#86efac",
                                fontSize: isMobile ? 12 : 13, fontWeight: 500, cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                            >💬 Chat</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function MyAppointmentsPage() {
  return (
    <Suspense fallback={
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(34,197,94,0.3)", borderTopColor: "#22c55e", animation: "spin 0.8s linear infinite" }} />
      </div>
    }>
      <MyAppointmentsPageInner />
    </Suspense>
  );
}
