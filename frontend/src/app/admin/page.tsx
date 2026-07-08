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
  const [activeTab, setActiveTab] = useState<"dashboard" | "appointments">("dashboard");
  const [loadingData, setLoadingData] = useState(true);

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
      // Get doctor profile
      const docRes = await fetch(`${API_URL}/doctors/user/${user.id}`);
      if (docRes.ok) {
        const docData = await docRes.json();
        setDoctor(docData);

        // Get stats
        const statsRes = await fetch(`${API_URL}/admin/stats/${docData.id}`);
        if (statsRes.ok) setStats(await statsRes.json());

        // Get appointments
        const apptsRes = await fetch(`${API_URL}/appointments/doctor/${docData.id}`);
        if (apptsRes.ok) {
          const apptsData = await apptsRes.json();
          setAppointments(apptsData.appointments || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    }
    setLoadingData(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  if (loading || !user) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(245,158,11,0.3)", borderTopColor: "#f59e0b", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

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
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40, padding: "0 8px" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: "0 4px 16px rgba(245,158,11,0.3)",
          }}>🩺</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>Sera Admin</div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Doctor Portal</div>
          </div>
        </div>

        {/* Nav items */}
        {[
          { id: "dashboard" as const, icon: "📊", label: "Dashboard" },
          { id: "appointments" as const, icon: "📅", label: "Appointments" },
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

        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 14px", borderRadius: 10,
          color: "var(--text-secondary)", fontSize: 14,
          marginBottom: 4, transition: "all 0.2s",
        }}>
          <span style={{ fontSize: 18 }}>🏠</span>
          Home
        </Link>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Doctor info */}
        <div style={{
          padding: "16px 14px", borderRadius: 12,
          background: "var(--bg-glass)",
          border: "0.5px solid var(--border-secondary)",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, marginBottom: 10,
          }}>
            {doctor?.full_name?.charAt(0) || "D"}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
            Dr. {doctor?.full_name || "Doctor"}
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
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>
        {activeTab === "dashboard" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
              <h1 style={{
                fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700,
                color: "var(--text-primary)", marginBottom: 8,
              }}>
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, Dr. {doctor?.full_name?.split(" ")[0] || "Doctor"} 👋
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
      </main>
    </div>
  );
}

// ── Admin Appointments View (embedded in dashboard) ──────────────────────────

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
