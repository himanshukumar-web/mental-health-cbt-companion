"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

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
  };
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    pending: { bg: "rgba(245,158,11,0.12)", text: "#fcd34d", border: "rgba(245,158,11,0.3)", icon: "⏳" },
    confirmed: { bg: "rgba(59,130,246,0.12)", text: "#93c5fd", border: "rgba(59,130,246,0.3)", icon: "✓" },
    completed: { bg: "rgba(34,197,94,0.12)", text: "#86efac", border: "rgba(34,197,94,0.3)", icon: "✅" },
    cancelled: { bg: "rgba(239,68,68,0.12)", text: "#fca5a5", border: "rgba(239,68,68,0.3)", icon: "✕" },
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

export default function MyAppointmentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

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

  const filtered = filter === "all" ? appointments : appointments.filter(a => a.status === filter);

  const filters = [
    { id: "all", label: "All", count: appointments.length },
    { id: "pending", label: "Pending", count: appointments.filter(a => a.status === "pending").length },
    { id: "confirmed", label: "Confirmed", count: appointments.filter(a => a.status === "confirmed").length },
    { id: "completed", label: "Completed", count: appointments.filter(a => a.status === "completed").length },
    { id: "cancelled", label: "Cancelled", count: appointments.filter(a => a.status === "cancelled").length },
  ];

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(34,197,94,0.3)", borderTopColor: "#22c55e", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "0 24px 60px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Navbar */}
      <nav style={{
        maxWidth: 900, margin: "0 auto", padding: "24px 0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg, #a7f3d0, #6ee7b7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, boxShadow: "0 0 20px rgba(34,197,94,0.3)",
          }}>🌿</div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "var(--text-primary)" }}>Sera</span>
        </Link>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/appointments" style={{
            padding: "7px 16px", borderRadius: 10,
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "white", fontSize: 13, fontWeight: 600,
          }}>+ Book New</Link>
          <Link href="/" style={{
            padding: "7px 16px", borderRadius: 10,
            border: "0.5px solid var(--border-secondary)",
            background: "var(--bg-glass)", color: "var(--text-secondary)",
            fontSize: 13, fontWeight: 500,
          }}>← Home</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32, animation: "fadeIn 0.4s ease" }}>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(24px, 4vw, 32px)",
            fontWeight: 700, color: "var(--text-primary)", marginBottom: 8,
          }}>My Appointments 📋</h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>
            Track and manage your booked sessions
          </p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap", animation: "fadeIn 0.4s ease 0.1s both" }}>
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: "8px 16px", borderRadius: 10, border: "none",
                background: filter === f.id ? "rgba(34,197,94,0.15)" : "var(--bg-glass)",
                color: filter === f.id ? "#86efac" : "var(--text-secondary)",
                fontSize: 13, fontWeight: filter === f.id ? 600 : 400,
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

        {/* List */}
        {loadingData ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-tertiary)" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2.5px solid rgba(34,197,94,0.3)", borderTopColor: "#22c55e", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
            Loading your appointments...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 24px", borderRadius: 20,
            background: "var(--bg-glass)", border: "0.5px solid var(--border-secondary)",
            animation: "fadeIn 0.4s ease 0.2s both",
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📅</div>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8, fontFamily: "var(--font-display)" }}>
              No Appointments
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
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
                  padding: "22px 24px", borderRadius: 16,
                  background: "var(--bg-glass)", backdropFilter: "blur(12px)",
                  border: "0.5px solid var(--border-secondary)",
                  animation: `fadeIn 0.3s ease ${i * 0.04}s both`,
                  transition: "all 0.2s",
                  opacity: appt.status === "cancelled" ? 0.6 : 1,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                    <div style={{ display: "flex", gap: 16 }}>
                      {/* Doctor avatar */}
                      <div style={{
                        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                        background: "linear-gradient(135deg, #22c55e, #16a34a)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 20, color: "white", fontWeight: 700,
                      }}>
                        {appt.doctors?.full_name?.charAt(0) || "D"}
                      </div>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                          Dr. {appt.doctors?.full_name || "Doctor"}
                        </h3>
                        <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 10 }}>
                          {appt.doctors?.specialization || "CBT Therapist"}
                        </div>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 5 }}>
                            📅 {new Date(appt.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <span style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 5 }}>
                            🕐 {appt.time_slot}
                          </span>
                          {isPast && appt.status !== "completed" && appt.status !== "cancelled" && (
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

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                      <StatusBadge status={appt.status} />
                      {(appt.status === "pending" || appt.status === "confirmed") && !isPast && (
                        <button
                          onClick={() => handleCancel(appt.id)}
                          style={{
                            padding: "6px 14px", borderRadius: 8, border: "none",
                            background: "rgba(239,68,68,0.1)", color: "#fca5a5",
                            fontSize: 12, fontWeight: 500, cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                        >Cancel Appointment</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
