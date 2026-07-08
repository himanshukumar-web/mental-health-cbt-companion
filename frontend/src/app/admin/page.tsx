"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface DoctorProfile {
  id: string;
  user_id: string;
  full_name: string;
  specialization: string;
  bio: string;
  experience_years: number;
  available: boolean;
}

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
}

interface Stats {
  total_patients: number;
  today_appointments: number;
  completed: number;
  pending: number;
}

interface ChatPartner {
  user_id: string;
  name: string;
  role: string;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
}

function StatCard({ icon, label, value, color, delay }: {
  icon: string; label: string; value: number; color: string; delay: number;
}) {
  return (
    <div style={{
      padding: "24px 20px", borderRadius: 16,
      background: "var(--bg-glass)", backdropFilter: "blur(12px)",
      border: "0.5px solid var(--border-secondary)",
      animation: `fadeIn 0.5s ease ${delay}s both`,
      transition: "all 0.25s",
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: color, display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: 20, marginBottom: 14,
      }}>{icon}</div>
      <div style={{
        fontSize: 28, fontWeight: 700, color: "var(--text-primary)",
        fontFamily: "var(--font-display)", marginBottom: 4,
        animation: `countUp 0.6s ease ${delay + 0.2}s both`,
      }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    pending: { bg: "rgba(245,158,11,0.12)", text: "#fcd34d", border: "rgba(245,158,11,0.3)" },
    confirmed: { bg: "rgba(59,130,246,0.12)", text: "#93c5fd", border: "rgba(59,130,246,0.3)" },
    completed: { bg: "rgba(34,197,94,0.12)", text: "#86efac", border: "rgba(34,197,94,0.3)" },
    cancelled: { bg: "rgba(239,68,68,0.12)", text: "#fca5a5", border: "rgba(239,68,68,0.3)" },
  };
  const s = styles[status] || styles.pending;
  return (
    <span style={{
      padding: "4px 10px", borderRadius: 8,
      background: s.bg, color: s.text,
      border: `0.5px solid ${s.border}`,
      fontSize: 11, fontWeight: 600,
      textTransform: "uppercase", letterSpacing: "0.05em",
    }}>{status}</span>
  );
}

export default function AdminDashboard() {
  const { user, userRole, loading, signOut } = useAuth();
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [stats, setStats] = useState<Stats>({ total_patients: 0, today_appointments: 0, completed: 0, pending: 0 });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "appointments" | "chat" | "profile">("dashboard");
  const [loadingData, setLoadingData] = useState(true);

  // Chat states
  const [chatPartners, setChatPartners] = useState<ChatPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!loading && (!user || userRole !== "admin")) {
      router.replace("/");
    }
  }, [user, userRole, loading, router]);

  // Fetch doctor profile & data
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      let docData = null;
      try {
        // Try getting doctor profile
        const docRes = await fetch(`${API_URL}/doctors/user/${user.id}`);
        if (docRes.ok) {
          docData = await docRes.json();
        } else {
          // If not found, try to auto-create doctor profile
          const createRes = await fetch(`${API_URL}/doctors`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: user.id,
              full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Doctor",
              specialization: "General CBT Therapist",
              bio: "Experienced CBT professional.",
              experience_years: 5,
            }),
          });
          if (createRes.ok) {
            docData = await createRes.json();
          }
        }
      } catch (err) {
        console.error("Error with doctor profile endpoint:", err);
      }

      // Fallback object to prevent blank screen
      if (!docData) {
        docData = {
          id: user.id,
          user_id: user.id,
          full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Doctor",
          specialization: "General CBT Therapist",
          bio: "Experienced CBT professional.",
          experience_years: 5,
          available: true
        };
      }
      
      setDoctor(docData);

      // Fetch stats
      try {
        const statsRes = await fetch(`${API_URL}/admin/stats/${docData.id}`);
        if (statsRes.ok) setStats(await statsRes.json());
      } catch (e) {
        console.error("Failed to load stats:", e);
      }

      // Fetch appointments
      try {
        const apptsRes = await fetch(`${API_URL}/appointments/doctor/${docData.id}`);
        if (apptsRes.ok) {
          const apptsData = await apptsRes.json();
          setAppointments(apptsData.appointments || []);
        }
      } catch (e) {
        console.error("Failed to load appointments:", e);
      }

    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    }
    setLoadingData(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load chat partners
  useEffect(() => {
    if (!user || activeTab !== "chat") return;
    const loadPartners = async () => {
      try {
        const res = await fetch(`${API_URL}/messages/partners/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setChatPartners(data.partners || []);
        }
      } catch (e) {
        console.error("Failed to load partners:", e);
      }
    };
    loadPartners();
    const t = setInterval(loadPartners, 4000);
    return () => clearInterval(t);
  }, [user, activeTab]);

  // Load message history
  useEffect(() => {
    if (!user || !selectedPartner || activeTab !== "chat") return;
    const loadHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/messages/history?user1=${user.id}&user2=${selectedPartner.user_id}`);
        if (res.ok) {
          const data = await res.json();
          setChatMessages(data.messages || []);
        }
      } catch (e) {
        console.error("Failed to load messages:", e);
      }
    };
    loadHistory();
    const t = setInterval(loadHistory, 3000);
    return () => clearInterval(t);
  }, [user, selectedPartner, activeTab]);

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      await fetch(`${API_URL}/appointments/${appointmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !user || !selectedPartner || sendingMsg) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_id: selectedPartner.user_id,
          content: chatInput.trim()
        }),
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

  if (loading || !user) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(245,158,11,0.3)", borderTopColor: "#f59e0b", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  // Resolve Doctor Name dynamically with fallback to metadata/email
  const doctorName = doctor?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Doctor";
  const todayAppts = appointments.filter(a => a.date === new Date().toISOString().split("T")[0]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)", fontFamily: "var(--font-sans)" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes countUp { from { transform:translateY(10px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        @keyframes slideIn { from { transform:translateX(-20px); opacity:0; } to { transform:translateX(0); opacity:1; } }
      `}</style>

      {/* Sidebar */}
      <aside style={{
        width: 260, flexShrink: 0, background: "var(--bg-secondary)",
        borderRight: "0.5px solid var(--border-secondary)",
        padding: "28px 16px", display: "flex", flexDirection: "column",
        animation: "slideIn 0.4s ease",
      }}>
        {/* Logo - Dr. Name on Top Left */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40, padding: "0 8px" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: "0 4px 16px rgba(245,158,11,0.3)",
          }}>🩺</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 170 }}>
              Dr. {doctorName}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Doctor Portal</div>
          </div>
        </div>

        {/* Home link at the very top of sidebar navigation options, above Dashboard */}
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 14px", borderRadius: 10,
          color: "var(--text-secondary)", fontSize: 14,
          marginBottom: 4, transition: "all 0.2s",
        }}>
          <span style={{ fontSize: 18 }}>🏠</span>
          Home
        </Link>

        {/* Nav items */}
        {[
          { id: "dashboard" as const, icon: "📊", label: "Dashboard" },
          { id: "appointments" as const, icon: "📅", label: "Appointments" },
          { id: "chat" as const, icon: "💬", label: "Chat with Patient" },
          { id: "profile" as const, icon: "👤", label: "Edit Profile" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px", borderRadius: 10,
              border: "none", width: "100%", textAlign: "left",
              background: activeTab === item.id ? "rgba(245,158,11,0.12)" : "transparent",
              color: activeTab === item.id ? "#fcd34d" : "var(--text-secondary)",
              fontSize: 14, fontWeight: activeTab === item.id ? 600 : 400,
              cursor: "pointer", marginBottom: 4,
              transition: "all 0.2s",
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}

        {/* Option for Sera AI Chat (not named Home) */}
        <Link href="/chat" style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 14px", borderRadius: 10,
          color: "var(--text-secondary)", fontSize: 14,
          marginBottom: 4, transition: "all 0.2s",
        }}>
          <span style={{ fontSize: 18 }}>🌿</span>
          Sera AI Chat
        </Link>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Doctor info at Down Side */}
        <div style={{
          padding: "16px 14px", borderRadius: 12,
          background: "var(--bg-glass)",
          border: "0.5px solid var(--border-secondary)",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, marginBottom: 10, color: "white", fontWeight: "bold"
          }}>
            {doctorName.charAt(0)}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Dr. {doctorName}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 12 }}>
            {doctor?.specialization || "CBT Therapist"}
          </div>
          <button
            onClick={() => signOut()}
            style={{
              width: "100%", padding: "8px", borderRadius: 8,
              border: "0.5px solid var(--border-secondary)",
              background: "transparent", color: "var(--text-tertiary)",
              fontSize: 12, cursor: "pointer", transition: "all 0.2s",
            }}
          >Sign out</button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {activeTab === "dashboard" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            {/* Header - Greeting Dr. Name */}
            <div style={{ marginBottom: 32 }}>
              <h1 style={{
                fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700,
                color: "var(--text-primary)", marginBottom: 8,
              }}>
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, Dr. {doctorName} 👋
              </h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                Here&apos;s your dashboard overview for today
              </p>
            </div>

            {/* Stats grid */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16, marginBottom: 32,
            }}>
              <StatCard icon="👥" label="Total Patients" value={stats.total_patients} color="rgba(59,130,246,0.15)" delay={0} />
              <StatCard icon="📅" label="Today's Appointments" value={stats.today_appointments} color="rgba(245,158,11,0.15)" delay={0.1} />
              <StatCard icon="✅" label="Completed Sessions" value={stats.completed} color="rgba(34,197,94,0.15)" delay={0.2} />
              <StatCard icon="⏳" label="Pending Requests" value={stats.pending} color="rgba(168,85,247,0.15)" delay={0.3} />
            </div>

            {/* Today's appointments */}
            <div style={{
              padding: "24px", borderRadius: 16,
              background: "var(--bg-glass)", backdropFilter: "blur(12px)",
              border: "0.5px solid var(--border-secondary)",
              animation: "fadeIn 0.5s ease 0.3s both",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                  Today&apos;s Appointments
                </h2>
                <button
                  onClick={() => setActiveTab("appointments")}
                  style={{
                    padding: "6px 14px", borderRadius: 8,
                    background: "rgba(245,158,11,0.12)", border: "0.5px solid rgba(245,158,11,0.3)",
                    color: "#fcd34d", fontSize: 12, fontWeight: 500, cursor: "pointer",
                  }}
                >View all →</button>
              </div>

              {loadingData ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-tertiary)" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid rgba(245,158,11,0.3)", borderTopColor: "#f59e0b", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                  Loading...
                </div>
              ) : todayAppts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-tertiary)" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  <div style={{ fontSize: 14 }}>No appointments scheduled for today</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {todayAppts.map((appt, i) => (
                    <div key={appt.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 16px", borderRadius: 12,
                      background: "var(--bg-secondary)",
                      border: "0.5px solid var(--border-tertiary)",
                      animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: "50%",
                          background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.1))",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 16, color: "#93c5fd", fontWeight: 600,
                        }}>{appt.patient_name.charAt(0)}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{appt.patient_name}</div>
                          <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{appt.time_slot}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <StatusBadge status={appt.status} />
                        {appt.status === "pending" && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => handleStatusUpdate(appt.id, "confirmed")}
                              style={{
                                padding: "6px 12px", borderRadius: 8, border: "none",
                                background: "rgba(34,197,94,0.15)", color: "#86efac",
                                fontSize: 12, fontWeight: 500, cursor: "pointer",
                              }}
                            >✓ Confirm</button>
                            <button
                              onClick={() => handleStatusUpdate(appt.id, "cancelled")}
                              style={{
                                padding: "6px 12px", borderRadius: 8, border: "none",
                                background: "rgba(239,68,68,0.12)", color: "#fca5a5",
                                fontSize: 12, fontWeight: 500, cursor: "pointer",
                              }}
                            >✕ Cancel</button>
                          </div>
                        )}
                        {appt.status === "confirmed" && (
                          <button
                            onClick={() => handleStatusUpdate(appt.id, "completed")}
                            style={{
                              padding: "6px 12px", borderRadius: 8, border: "none",
                              background: "rgba(34,197,94,0.15)", color: "#86efac",
                              fontSize: 12, fontWeight: 500, cursor: "pointer",
                            }}
                          >✓ Complete</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "appointments" && (
          <AdminAppointmentsView
            appointments={appointments}
            loading={loadingData}
            onStatusUpdate={handleStatusUpdate}
          />
        )}

        {activeTab === "chat" && (
          <AdminChatView
            partners={chatPartners}
            selectedPartner={selectedPartner}
            onSelectPartner={setSelectedPartner}
            messages={chatMessages}
            input={chatInput}
            setInput={setChatInput}
            onSend={handleSendMessage}
            sending={sendingMsg}
            userId={user.id}
          />
        )}

        {activeTab === "profile" && (
          <AdminProfileEditView
            doctor={doctor}
            setDoctor={setDoctor}
            user={user}
          />
        )}
      </main>
    </div>
  );
}

// ── Admin Appointments View ──────────────────────────────────────────

function AdminAppointmentsView({ appointments, loading: loadingData, onStatusUpdate }: {
  appointments: Appointment[];
  loading: boolean;
  onStatusUpdate: (id: string, status: string) => void;
}) {
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? appointments : appointments.filter(a => a.status === filter);

  const filters = [
    { id: "all", label: "All", count: appointments.length },
    { id: "pending", label: "Pending", count: appointments.filter(a => a.status === "pending").length },
    { id: "confirmed", label: "Confirmed", count: appointments.filter(a => a.status === "confirmed").length },
    { id: "completed", label: "Completed", count: appointments.filter(a => a.status === "completed").length },
    { id: "cancelled", label: "Cancelled", count: appointments.filter(a => a.status === "cancelled").length },
  ];

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700,
          color: "var(--text-primary)", marginBottom: 8,
        }}>Appointments</h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Manage all your patient appointments
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: "8px 16px", borderRadius: 10, border: "none",
              background: filter === f.id ? "rgba(245,158,11,0.15)" : "var(--bg-glass)",
              color: filter === f.id ? "#fcd34d" : "var(--text-secondary)",
              fontSize: 13, fontWeight: filter === f.id ? 600 : 400,
              cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {f.label}
            <span style={{
              padding: "1px 6px", borderRadius: 6,
              background: filter === f.id ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)",
              fontSize: 11,
            }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Appointments list */}
      {loadingData ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-tertiary)" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2.5px solid rgba(245,158,11,0.3)", borderTopColor: "#f59e0b", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          Loading appointments...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          borderRadius: 16, background: "var(--bg-glass)",
          border: "0.5px solid var(--border-secondary)",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 6 }}>No appointments found</div>
          <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
            {filter !== "all" ? `No ${filter} appointments` : "Appointments will show up here when patients book them"}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((appt, i) => (
            <div key={appt.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 20px", borderRadius: 14,
              background: "var(--bg-glass)", backdropFilter: "blur(12px)",
              border: "0.5px solid var(--border-secondary)",
              animation: `fadeIn 0.3s ease ${i * 0.03}s both`,
              transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 600, color: "#93c5fd",
                }}>{appt.patient_name.charAt(0)}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", marginBottom: 3 }}>
                    {appt.patient_name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)", display: "flex", gap: 12 }}>
                    <span>📅 {new Date(appt.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span>🕐 {appt.time_slot}</span>
                    <span>✉ {appt.patient_email}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <StatusBadge status={appt.status} />
                {appt.status === "pending" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => onStatusUpdate(appt.id, "confirmed")}
                      style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "rgba(34,197,94,0.15)", color: "#86efac", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                      ✓ Confirm
                    </button>
                    <button onClick={() => onStatusUpdate(appt.id, "cancelled")}
                      style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "rgba(239,68,68,0.12)", color: "#fca5a5", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                      ✕ Cancel
                    </button>
                  </div>
                )}
                {appt.status === "confirmed" && (
                  <button onClick={() => onStatusUpdate(appt.id, "completed")}
                    style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "rgba(34,197,94,0.15)", color: "#86efac", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                    ✓ Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Admin Chat View (Live Chat) ──────────────────────────────────────────

function AdminChatView({
  partners, selectedPartner, onSelectPartner, messages, input, setInput, onSend, sending, userId
}: {
  partners: ChatPartner[];
  selectedPartner: ChatPartner | null;
  onSelectPartner: (partner: ChatPartner | null) => void;
  messages: ChatMessage[];
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  sending: boolean;
  userId: string;
}) {
  const [activePartnerHover, setActivePartnerHover] = useState<string | null>(null);
  const msgEndRef = useState<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    const el = document.getElementById("chat-feed-end");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ display: "flex", flex: 1, gap: 20, height: "calc(100vh - 120px)", animation: "fadeIn 0.4s ease" }}>
      {/* Partners List (Left Panel) */}
      <div style={{
        width: 280, background: "var(--bg-glass)", border: "0.5px solid var(--border-secondary)",
        borderRadius: 20, padding: 16, display: "flex", flexDirection: "column", gap: 12,
        backdropFilter: "blur(12px)"
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", paddingBottom: 10, borderBottom: "0.5px solid var(--border-tertiary)" }}>
          Patients / Chats
        </h3>
        
        {partners.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--text-tertiary)", fontSize: 13 }}>
            No chat history found. Chats will appear when patients message you or book sessions.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, overflowY: "auto", flex: 1 }}>
            {partners.map(p => {
              const isSelected = selectedPartner?.user_id === p.user_id;
              const isHovered = activePartnerHover === p.user_id;
              return (
                <button
                  key={p.user_id}
                  onClick={() => onSelectPartner(p)}
                  onMouseEnter={() => setActivePartnerHover(p.user_id)}
                  onMouseLeave={() => setActivePartnerHover(null)}
                  style={{
                    padding: "12px 14px", borderRadius: 12, border: "none",
                    background: isSelected ? "rgba(245,158,11,0.15)" : isHovered ? "rgba(255,255,255,0.05)" : "transparent",
                    color: isSelected ? "#fcd34d" : "var(--text-secondary)",
                    cursor: "pointer", transition: "all 0.2s", textAlign: "left"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: isSelected ? "linear-gradient(135deg, #f59e0b, #d97706)" : "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: isSelected ? "white" : "var(--text-secondary)", fontSize: 13, fontWeight: "bold"
                    }}>{p.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: isSelected ? "#fcd34d" : "var(--text-primary)" }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "capitalize" }}>{p.role}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat Conversation (Right Panel) */}
      <div style={{
        flex: 1, background: "var(--bg-glass)", border: "0.5px solid var(--border-secondary)",
        borderRadius: 20, display: "flex", flexDirection: "column", overflow: "hidden",
        backdropFilter: "blur(12px)"
      }}>
        {selectedPartner ? (
          <>
            {/* Header */}
            <div style={{
              padding: "16px 20px", borderBottom: "0.5px solid var(--border-tertiary)",
              display: "flex", alignItems: "center", justifyItems: "center", gap: 12
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: "bold", fontSize: 14
              }}>{selectedPartner.name.charAt(0)}</div>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{selectedPartner.name}</h4>
                <div style={{ fontSize: 11, color: "#22c55e", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }}></span>
                  Active Chat
                </div>
              </div>
            </div>

            {/* Messages Feed */}
            <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.length === 0 ? (
                <div style={{ margin: "auto", color: "var(--text-tertiary)", fontSize: 13 }}>
                  No messages yet. Send a message to start the conversation!
                </div>
              ) : (() => {
                let lastDateStr = "";
                return messages.map(m => {
                  const isOwn = m.sender_id === userId;
                  const msgDate = new Date(m.timestamp);
                  const dateStr = msgDate.toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                  const showDateSeparator = dateStr !== lastDateStr;
                  lastDateStr = dateStr;

                  return (
                    <div key={m.id} style={{ display: "flex", flexDirection: "column", width: "100%", gap: 6 }}>
                      {showDateSeparator && (
                        <div style={{
                          alignSelf: "center",
                          margin: "20px 0 10px",
                          padding: "6px 16px",
                          borderRadius: 20,
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "0.5px solid var(--border-secondary)",
                          color: "var(--text-tertiary)",
                          fontSize: 11,
                          fontWeight: 500,
                          letterSpacing: "0.03em"
                        }}>
                          {dateStr}
                        </div>
                      )}
                      <div
                        style={{
                          alignSelf: isOwn ? "flex-end" : "flex-start",
                          maxWidth: "70%",
                          padding: "12px 16px",
                          borderRadius: isOwn ? "16px 16px 0 16px" : "16px 16px 16px 0",
                          background: isOwn ? "rgba(245,158,11,0.16)" : "var(--bg-secondary)",
                          border: isOwn ? "0.5px solid rgba(245,158,11,0.3)" : "0.5px solid var(--border-secondary)",
                          color: "var(--text-primary)",
                          fontSize: 14,
                          lineHeight: 1.5,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                          animation: "fadeIn 0.3s ease"
                        }}
                      >
                        <div style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: isOwn ? "#fcd34d" : "#93c5fd",
                          marginBottom: 4
                        }}>
                          {isOwn ? "You" : selectedPartner.name}
                        </div>
                        <div>{m.content}</div>
                        <div style={{
                          fontSize: 10, color: "var(--text-tertiary)", marginTop: 6,
                          textAlign: isOwn ? "right" : "left"
                        }}>
                          {msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
              <div id="chat-feed-end" />
            </div>

            {/* Footer Input */}
            <div style={{
              padding: "16px 20px", borderTop: "0.5px solid var(--border-tertiary)",
              display: "flex", gap: 10, alignItems: "center"
            }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") onSend(); }}
                placeholder={`Message ${selectedPartner.name}...`}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 12,
                  border: "0.5px solid var(--border-secondary)",
                  background: "var(--bg-secondary)", color: "var(--text-primary)",
                  fontSize: 14, fontFamily: "inherit"
                }}
              />
              <button
                onClick={onSend}
                disabled={sending || !input.trim()}
                style={{
                  padding: "12px 20px", borderRadius: 12, border: "none",
                  background: input.trim() ? "linear-gradient(135deg, #f59e0b, #d97706)" : "rgba(255,255,255,0.05)",
                  color: input.trim() ? "white" : "var(--text-tertiary)",
                  fontSize: 14, fontWeight: 600, cursor: input.trim() ? "pointer" : "default",
                  transition: "all 0.2s"
                }}
              >
                {sending ? "..." : "Send ➔"}
              </button>
            </div>
          </>
        ) : (
          <div style={{ margin: "auto", textAlign: "center", color: "var(--text-tertiary)", padding: 20 }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>💬</div>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>No Active Chat</h4>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Select a patient from the list on the left to start live messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}


// ── Admin Profile Edit View ──────────────────────────────────────────────

interface AdminProfileEditViewProps {
  doctor: DoctorProfile | null;
  setDoctor: (doc: DoctorProfile | null) => void;
  user: any;
}

function AdminProfileEditView({ doctor, setDoctor, user }: AdminProfileEditViewProps) {
  const [fullName, setFullName] = useState(doctor?.full_name || "");
  const [specialization, setSpecialization] = useState(doctor?.specialization || "");
  const [bio, setBio] = useState(doctor?.bio || "");
  const [experienceYears, setExperienceYears] = useState(doctor?.experience_years || 0);
  const [available, setAvailable] = useState(doctor?.available ?? true);
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync if doctor loads late
  useEffect(() => {
    if (doctor) {
      setFullName(doctor.full_name);
      setSpecialization(doctor.specialization);
      setBio(doctor.bio);
      setExperienceYears(doctor.experience_years);
      setAvailable(doctor.available);
    }
  }, [doctor]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !specialization.trim()) {
      setMessage({ type: "error", text: "Name and Specialization are required." });
      return;
    }
    
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/doctors/user/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          specialization: specialization.trim(),
          bio: bio.trim(),
          experience_years: Number(experienceYears),
          available: available
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setDoctor(updated);
        setMessage({ type: "success", text: "Profile updated successfully! 🎉" });
      } else {
        setMessage({ type: "error", text: "Failed to update profile. Please try again." });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Network error occurred." });
    }
    setSaving(false);
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease", maxWidth: 600 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700,
          color: "var(--text-primary)", marginBottom: 8,
        }}>Edit Profile 👤</h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Update your qualifications, specialization, and availability
        </p>
      </div>

      <form onSubmit={handleSave} style={{
        padding: "28px", borderRadius: 20,
        background: "var(--bg-glass)", backdropFilter: "blur(12px)",
        border: "0.5px solid var(--border-secondary)",
        display: "flex", flexDirection: "column", gap: 20
      }}>
        {message && (
          <div style={{
            padding: "12px 16px", borderRadius: 10,
            background: message.type === "success" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
            border: message.type === "success" ? "0.5px solid rgba(34,197,94,0.3)" : "0.5px solid rgba(239,68,68,0.3)",
            color: message.type === "success" ? "#86efac" : "#fca5a5",
            fontSize: 14
          }}>
            {message.text}
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10,
              border: "0.5px solid var(--border-secondary)",
              background: "var(--bg-secondary)", color: "var(--text-primary)",
              fontSize: 14, fontFamily: "inherit", boxSizing: "border-box"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>
            Specialization / Qualification (e.g. Anxiety Therapist, Clinical Psychologist)
          </label>
          <input
            type="text"
            value={specialization}
            onChange={e => setSpecialization(e.target.value)}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10,
              border: "0.5px solid var(--border-secondary)",
              background: "var(--bg-secondary)", color: "var(--text-primary)",
              fontSize: 14, fontFamily: "inherit", boxSizing: "border-box"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>Experience (Years)</label>
          <input
            type="number"
            value={experienceYears}
            onChange={e => setExperienceYears(Number(e.target.value))}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10,
              border: "0.5px solid var(--border-secondary)",
              background: "var(--bg-secondary)", color: "var(--text-primary)",
              fontSize: 14, fontFamily: "inherit", boxSizing: "border-box"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>Bio / Description</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={4}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10,
              border: "0.5px solid var(--border-secondary)",
              background: "var(--bg-secondary)", color: "var(--text-primary)",
              fontSize: 14, fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box",
              resize: "vertical"
            }}
          />
        </div>

        <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={available}
            onChange={e => setAvailable(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: "#f59e0b", cursor: "pointer" }}
          />
          <span style={{ fontSize: 14, color: "var(--text-primary)" }}>Available for Booking</span>
        </label>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "14px", borderRadius: 12, border: "none",
            background: saving ? "rgba(245,158,11,0.4)" : "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "white", fontSize: 15, fontWeight: 600, cursor: saving ? "default" : "pointer",
            boxShadow: saving ? "none" : "0 4px 20px rgba(245,158,11,0.3)",
            transition: "all 0.2s"
          }}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
