"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Doctor {
  id: string;
  user_id: string;
  full_name: string;
  specialization: string;
  bio: string;
  experience_years: number;
  available: boolean;
}

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
];

export default function BookAppointmentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Form state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [hoveredDoctor, setHoveredDoctor] = useState<string | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

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

  // Fetch doctors
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/doctors`);
        if (res.ok) {
          const data = await res.json();
          setDoctors(data.doctors || []);
        }
      } catch { /* ignore */ }
      setLoadingDoctors(false);
    })();
  }, []);

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });

  const handleBook = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !user) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          patient_id: user.id,
          patient_name: user.user_metadata?.full_name ?? user.email ?? "Patient",
          patient_email: user.email ?? "",
          date: selectedDate,
          time_slot: selectedTime,
          notes,
        }),
      });
      if (res.ok) {
        setDone(true);
      }
    } catch (err) {
      console.error("Booking failed:", err);
    }
    setSubmitting(false);
  };

  if (loading || !user) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(34,197,94,0.3)", borderTopColor: "#22c55e", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (done) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-primary)", padding: 24,
      }}>
        <style>{`@keyframes scaleIn { from { transform: scale(0.8); opacity:0; } to { transform: scale(1); opacity:1; } }`}</style>
        <div style={{
          textAlign: "center", padding: "48px 40px", borderRadius: 24,
          background: "var(--bg-glass)", backdropFilter: "blur(16px)",
          border: "0.5px solid rgba(34,197,94,0.3)",
          maxWidth: 480, width: "100%",
          animation: "scaleIn 0.5s ease",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(34,197,94,0.08)",
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, margin: "0 auto 24px",
            boxShadow: "0 8px 32px rgba(34,197,94,0.3)",
          }}>✓</div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700,
            color: "var(--text-primary)", marginBottom: 12,
          }}>Appointment Booked! 🎉</h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 8 }}>
            Your appointment with <strong style={{ color: "var(--text-primary)" }}>Dr. {selectedDoctor?.full_name}</strong> has been booked.
          </p>
          <div style={{
            padding: "16px 20px", borderRadius: 14,
            background: "rgba(34,197,94,0.08)",
            border: "0.5px solid rgba(34,197,94,0.2)",
            marginBottom: 28, fontSize: 14, color: "var(--text-secondary)",
          }}>
            <div style={{ marginBottom: 6 }}>📅 {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
            <div>🕐 {selectedTime}</div>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 24 }}>
            The doctor will confirm your appointment shortly. You&apos;ll see the status update in your appointments.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/appointments/my" style={{
              padding: "12px 24px", borderRadius: 12,
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "white", fontSize: 14, fontWeight: 600,
              boxShadow: "0 4px 20px rgba(34,197,94,0.3)",
            }}>View My Appointments</Link>
            <Link href="/" style={{
              padding: "12px 24px", borderRadius: 12,
              border: "0.5px solid var(--border-secondary)",
              background: "var(--bg-glass)", color: "var(--text-secondary)",
              fontSize: 14, fontWeight: 500,
            }}>Go Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-primary)",
      padding: isMobile ? "0 12px 40px" : "0 16px 60px", position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity:0; } to { transform: scale(1); opacity:1; } }
      `}</style>

      {/* Background */}
      <div style={{ position: "absolute", top: "5%", right: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Navbar */}
      <nav style={{
        maxWidth: 900, margin: "0 auto", padding: isMobile ? "16px 0" : "24px 0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10 }}>
          <div style={{
            width: isMobile ? 28 : 34, height: isMobile ? 28 : 34, borderRadius: "50%",
            background: "linear-gradient(135deg, #a7f3d0, #6ee7b7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: isMobile ? 14 : 16, boxShadow: "0 0 20px rgba(34,197,94,0.3)",
          }}>🌿</div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: isMobile ? 16 : 18, color: "var(--text-primary)" }}>Sera</span>
        </Link>
        <Link href="/" style={{
          padding: isMobile ? "5px 12px" : "7px 16px", borderRadius: 10,
          border: "0.5px solid var(--border-secondary)",
          background: "var(--bg-glass)", color: "var(--text-secondary)",
          fontSize: isMobile ? 12 : 13, fontWeight: 500,
        }}>← Back</Link>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: isMobile ? 24 : 40, animation: "fadeIn 0.5s ease" }}>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(22px, 4vw, 36px)",
            fontWeight: 700, color: "var(--text-primary)", marginBottom: 10,
          }}>
            Book an Appointment 📅
          </h1>
          <p style={{ fontSize: isMobile ? 13 : 15, color: "var(--text-secondary)" }}>
            Schedule a session with our mental health professionals
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 0, marginBottom: 40, animation: "fadeIn 0.5s ease 0.1s both",
        }}>
          {[
            { num: 1, label: "Select Doctor" },
            { num: 2, label: "Date & Time" },
            { num: 3, label: "Confirm" },
          ].map((s, i) => (
            <div key={s.num} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, borderRadius: "50%",
                  background: step >= s.num ? "linear-gradient(135deg, #22c55e, #16a34a)" : "var(--bg-glass)",
                  border: step >= s.num ? "none" : "1px solid var(--border-secondary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: step >= s.num ? "white" : "var(--text-tertiary)",
                  fontSize: isMobile ? 12 : 14, fontWeight: 700,
                  boxShadow: step >= s.num ? "0 4px 16px rgba(34,197,94,0.3)" : "none",
                  transition: "all 0.3s",
                }}>{step > s.num ? "✓" : s.num}</div>
                <span style={{
                  fontSize: isMobile ? 10 : 12, color: step >= s.num ? "var(--text-primary)" : "var(--text-tertiary)",
                  fontWeight: step === s.num ? 600 : 400, transition: "all 0.3s",
                }}>{s.label}</span>
              </div>
              {i < 2 && (
                <div style={{
                  width: isMobile ? 20 : 40, height: 2, margin: isMobile ? "0 4px" : "0 8px",
                  background: step > s.num ? "#22c55e" : "var(--border-secondary)",
                  borderRadius: 2, transition: "background 0.3s",
                  marginBottom: isMobile ? 16 : 22,
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Doctor */}
        {step === 1 && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            {loadingDoctors ? (
              <div style={{ textAlign: "center", padding: 60, color: "var(--text-tertiary)" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(34,197,94,0.3)", borderTopColor: "#22c55e", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                Finding available doctors...
              </div>
            ) : doctors.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "60px 24px", borderRadius: 20,
                background: "var(--bg-glass)", border: "0.5px solid var(--border-secondary)",
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🩺</div>
                <h3 style={{ fontSize: 18, color: "var(--text-primary)", marginBottom: 8 }}>No Doctors Available</h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                  No doctors are currently available. Please check back later.
                </p>
              </div>
            ) : (
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
                gap: 14,
              }}>
                {doctors.map((doc, i) => {
                  const isHovered = hoveredDoctor === doc.id;
                  const isSelected = selectedDoctor?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onMouseEnter={() => setHoveredDoctor(doc.id)}
                      onMouseLeave={() => setHoveredDoctor(null)}
                      style={{
                        animation: `fadeIn 0.4s ease ${i * 0.08}s both`,
                      }}
                    >
                      <div style={{
                        padding: "28px 24px", borderRadius: 18,
                        background: isSelected ? "rgba(34,197,94,0.08)" : isHovered ? "rgba(255,255,255,0.06)" : "var(--bg-glass)",
                        border: `1px solid ${isSelected ? "rgba(34,197,94,0.4)" : isHovered ? "rgba(255,255,255,0.12)" : "var(--border-secondary)"}`,
                        backdropFilter: "blur(12px)",
                        transition: "all 0.3s",
                        transform: isHovered ? "translateY(-3px)" : "translateY(0)",
                        boxShadow: isHovered ? "0 12px 36px rgba(0,0,0,0.3)" : "none",
                        display: "flex", flexDirection: "column", height: "100%"
                      }}>
                        <div style={{
                          width: 52, height: 52, borderRadius: 14,
                          background: "linear-gradient(135deg, #22c55e, #16a34a)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 22, marginBottom: 18, color: "white", fontWeight: 700,
                          boxShadow: "0 4px 16px rgba(34,197,94,0.3)",
                        }}>
                          {doc.full_name.charAt(0)}
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4, fontFamily: "var(--font-display)" }}>
                          Dr. {doc.full_name}
                        </h3>
                        <div style={{
                          display: "inline-block", alignSelf: "flex-start", padding: "3px 10px", borderRadius: 6,
                          background: "rgba(34,197,94,0.1)", color: "#86efac",
                          fontSize: 11, fontWeight: 500, marginBottom: 12,
                        }}>{doc.specialization}</div>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 14, flex: 1 }}>
                          {doc.bio || "Experienced mental health professional specializing in cognitive behavioral therapy."}
                        </p>
                        <div style={{ fontSize: 12, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
                          ⭐ {doc.experience_years}+ years experience
                        </div>
                        
                        {/* Direct action buttons */}
                        <div style={{ display: "flex", gap: 10, width: "100%" }}>
                          <button
                            onClick={() => { setSelectedDoctor(doc); setStep(2); }}
                            style={{
                              flex: 1, padding: isMobile ? "12px 8px" : "10px", borderRadius: 10, border: "none",
                              background: "linear-gradient(135deg, #22c55e, #16a34a)",
                              color: "white", fontSize: isMobile ? 16 : 13, fontWeight: 600, cursor: "pointer",
                              boxShadow: "0 2px 10px rgba(34,197,94,0.2)", textAlign: "center",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                            }}
                          >
                            📅{!isMobile && " Book"}
                          </button>
                          
                          <Link
                            href={`/appointments/my?tab=chat&doctorUserId=${doc.user_id}`}
                            style={{
                              flex: 1, padding: isMobile ? "12px 8px" : "10px", borderRadius: 10,
                              border: "0.5px solid var(--border-secondary)",
                              background: "rgba(255,255,255,0.04)",
                              color: "var(--text-secondary)", fontSize: isMobile ? 16 : 13, fontWeight: 500,
                              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              gap: 4
                            }}
                          >
                            💬{!isMobile && " Chat"}
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{
              padding: "20px", borderRadius: 20,
              background: "var(--bg-glass)", backdropFilter: "blur(12px)",
              border: "0.5px solid var(--border-secondary)",
              marginBottom: 24,
            }}>
              {/* Selected doctor badge */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: 12,
                background: "rgba(34,197,94,0.08)",
                border: "0.5px solid rgba(34,197,94,0.2)",
                marginBottom: 28,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, color: "white", fontWeight: 700,
                }}>{selectedDoctor?.full_name.charAt(0)}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Dr. {selectedDoctor?.full_name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{selectedDoctor?.specialization}</div>
                </div>
                <button onClick={() => setStep(1)} style={{
                  marginLeft: "auto", padding: "5px 12px", borderRadius: 8,
                  background: "transparent", border: "0.5px solid var(--border-secondary)",
                  color: "var(--text-tertiary)", fontSize: 12, cursor: "pointer",
                }}>Change</button>
              </div>

              {/* Date picker */}
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
                Select Date
              </h3>
              <div style={{
                display: "flex", gap: 8, overflowX: "auto",
                paddingBottom: 8, marginBottom: 28,
              }}>
                {dates.map((d) => {
                  const dateStr = d.toISOString().split("T")[0];
                  const isSelected = selectedDate === dateStr;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      disabled={isWeekend}
                      style={{
                        flexShrink: 0, padding: "12px 14px", borderRadius: 14,
                        border: isSelected ? "1.5px solid #22c55e" : "0.5px solid var(--border-secondary)",
                        background: isSelected ? "var(--success-bg)" : isWeekend ? "transparent" : "var(--bg-glass)",
                        cursor: isWeekend ? "not-allowed" : "pointer",
                        opacity: isWeekend ? 0.4 : 1,
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                        minWidth: 64, transition: "all 0.2s",
                      }}
                    >
                      <span style={{ fontSize: 11, color: isSelected ? "var(--success-text)" : "var(--text-tertiary)", fontWeight: 500, textTransform: "uppercase" }}>
                        {d.toLocaleDateString("en", { weekday: "short" })}
                      </span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: isSelected ? "var(--success-text)" : "var(--text-primary)" }}>
                        {d.getDate()}
                      </span>
                      <span style={{ fontSize: 10, color: isSelected ? "var(--success-text)" : "var(--text-tertiary)" }}>
                        {d.toLocaleDateString("en", { month: "short" })}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Time slots */}
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
                Select Time Slot
              </h3>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100px, 100%), 1fr))",
                gap: 8,
              }}>
                {TIME_SLOTS.map((slot) => {
                  const isSelected = selectedTime === slot;
                  const isHovered = hoveredSlot === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      onMouseEnter={() => setHoveredSlot(slot)}
                      onMouseLeave={() => setHoveredSlot(null)}
                      style={{
                        padding: "12px 10px", borderRadius: 10, border: "none",
                        background: isSelected ? "linear-gradient(135deg, #22c55e, #16a34a)" : isHovered ? "var(--bg-glass-hover)" : "var(--bg-secondary)",
                        color: isSelected ? "white" : "var(--text-secondary)",
                        fontSize: 13, fontWeight: isSelected ? 600 : 400,
                        cursor: "pointer", transition: "all 0.2s",
                        boxShadow: isSelected ? "0 4px 16px rgba(34,197,94,0.3)" : "none",
                      }}
                    >{slot}</button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div style={{
              padding: "24px", borderRadius: 16,
              background: "var(--bg-glass)", border: "0.5px solid var(--border-secondary)",
              marginBottom: 24,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
                Additional Notes (Optional)
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific concerns or topics you'd like to discuss..."
                style={{
                  width: "100%", padding: "14px", borderRadius: 12,
                  border: "0.5px solid var(--border-secondary)",
                  background: "var(--bg-secondary)", color: "var(--text-primary)",
                  fontSize: 14, fontFamily: "inherit", lineHeight: 1.6,
                  minHeight: 80, boxSizing: "border-box",
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setStep(1)} style={{
                padding: "12px 24px", borderRadius: 12,
                border: "0.5px solid var(--border-secondary)",
                background: "var(--bg-glass)", color: "var(--text-secondary)",
                fontSize: 14, fontWeight: 500, cursor: "pointer",
              }}>← Back</button>
              <button
                onClick={() => { if (selectedDate && selectedTime) setStep(3); }}
                disabled={!selectedDate || !selectedTime}
                style={{
                  padding: "12px 28px", borderRadius: 12, border: "none",
                  background: selectedDate && selectedTime ? "linear-gradient(135deg, #22c55e, #16a34a)" : "rgba(255,255,255,0.06)",
                  color: selectedDate && selectedTime ? "white" : "var(--text-tertiary)",
                  fontSize: 14, fontWeight: 600,
                  cursor: selectedDate && selectedTime ? "pointer" : "default",
                  boxShadow: selectedDate && selectedTime ? "0 4px 20px rgba(34,197,94,0.3)" : "none",
                  transition: "all 0.3s",
                }}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div style={{ animation: "fadeIn 0.4s ease", maxWidth: 560, margin: "0 auto" }}>
            <div style={{
              padding: isMobile ? "20px 16px" : "32px 28px", borderRadius: 20,
              background: "var(--bg-glass)", backdropFilter: "blur(12px)",
              border: "0.5px solid var(--border-secondary)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}>
              <h2 style={{
                fontSize: 22, fontWeight: 700, color: "var(--text-primary)",
                fontFamily: "var(--font-display)", marginBottom: 8, textAlign: "center",
              }}>Confirm Appointment</h2>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", textAlign: "center", marginBottom: 28 }}>
                Please review your appointment details
              </p>

              {/* Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
                {[
                  { icon: "🩺", label: "Doctor", value: `Dr. ${selectedDoctor?.full_name}` },
                  { icon: "🏥", label: "Specialization", value: selectedDoctor?.specialization || "" },
                  { icon: "📅", label: "Date", value: selectedDate ? new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "" },
                  { icon: "🕐", label: "Time", value: selectedTime },
                  ...(notes ? [{ icon: "📝", label: "Notes", value: notes }] : []),
                ].map((item, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 14,
                    padding: "14px 16px", borderRadius: 12,
                    background: "var(--bg-secondary)",
                    border: "0.5px solid var(--border-tertiary)",
                  }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setStep(2)} style={{
                  flex: 1, padding: "14px", borderRadius: 12,
                  border: "0.5px solid var(--border-secondary)",
                  background: "transparent", color: "var(--text-secondary)",
                  fontSize: 14, fontWeight: 500, cursor: "pointer",
                }}>← Edit</button>
                <button
                  onClick={handleBook}
                  disabled={submitting}
                  style={{
                    flex: 2, padding: "14px", borderRadius: 12, border: "none",
                    background: submitting ? "rgba(34,197,94,0.4)" : "linear-gradient(135deg, #22c55e, #16a34a)",
                    color: "white", fontSize: 15, fontWeight: 600,
                    cursor: submitting ? "default" : "pointer",
                    boxShadow: "0 4px 24px rgba(34,197,94,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "all 0.3s",
                  }}
                >
                  {submitting ? (
                    <>
                      <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid white", borderTopColor: "transparent", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                      Booking...
                    </>
                  ) : "Confirm Booking ✓"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
