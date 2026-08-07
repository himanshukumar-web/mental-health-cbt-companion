"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AndroidMobileLayout from "./AndroidMobileLayout";
import { MD3TopAppBar } from "./ui/TopAppBar";
import { MD3Card } from "./ui/Card";
import { MD3Button } from "./ui/Button";
import { MD3BottomSheet } from "./ui/BottomSheet";
import { API_URL } from "@/lib/config";
import toast from "react-hot-toast";

const MOCK_DOCTORS = [
  { id: "doc1", name: "Dr. Sarah Jenkins", title: "Licensed Clinical Psychologist", specialty: "Anxiety & CBT", rating: "4.9 ⭐", avatar: "🩺" },
  { id: "doc2", name: "Dr. Marcus Vance", title: "Psychiatrist & CBT Specialist", specialty: "Depression & Trauma", rating: "4.8 ⭐", avatar: "👨‍⚕️" },
  { id: "doc3", name: "Dr. Elena Rostova", title: "Mindfulness Practitioner", specialty: "Stress & Burnout", rating: "5.0 ⭐", avatar: "👩‍⚕️" },
];

const TIME_SLOTS = ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM", "06:00 PM"];

export default function AndroidAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>("11:30 AM");
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`${API_URL}/appointments/user/${user?.id}`);
      if (res.ok) {
        const json = await res.json();
        setAppointments(json.appointments || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          doctor_name: selectedDoctor.name,
          patient_name: user.user_metadata?.full_name || "Patient",
          date: bookingDate,
          time_slot: selectedSlot,
          notes: "Booked via Android Mobile Companion App",
        }),
      });

      if (res.ok) {
        toast.success("Appointment booked successfully!");
        setSelectedDoctor(null);
        fetchAppointments();
      } else {
        toast.error("Failed to book appointment.");
      }
    } catch (err) {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AndroidMobileLayout>
      <MD3TopAppBar title="Doctor Appointments" subtitle="Schedule professional consultation" />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Existing Appointments */}
        {appointments.length > 0 && (
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#e8edf5", marginBottom: "12px" }}>
              Upcoming Sessions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {appointments.map((appt) => (
                <MD3Card key={appt.id} variant="elevated" style={{ borderColor: "rgba(59, 130, 246, 0.3)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "#e8edf5" }}>
                        {appt.doctor_name || "Professional Specialist"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#3b82f6", marginTop: "2px" }}>
                        📅 {appt.date} at {appt.time_slot}
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "100px", background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", fontWeight: 700 }}>
                      CONFIRMED
                    </span>
                  </div>
                </MD3Card>
              ))}
            </div>
          </div>
        )}

        {/* Doctor Directory */}
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#e8edf5", marginBottom: "12px" }}>
            Available Specialists
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {MOCK_DOCTORS.map((doc) => (
              <MD3Card key={doc.id} variant="filled" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "16px",
                      background: "rgba(59, 130, 246, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      flexShrink: 0,
                    }}
                  >
                    {doc.avatar}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#e8edf5" }}>{doc.name}</div>
                    <div style={{ fontSize: "12px", color: "#8b95a7" }}>{doc.title}</div>
                    <div style={{ fontSize: "11px", color: "#3b82f6", marginTop: "2px" }}>{doc.specialty} • {doc.rating}</div>
                  </div>
                </div>

                <MD3Button variant="tonal" onClick={() => setSelectedDoctor(doc)}>
                  Book Session
                </MD3Button>
              </MD3Card>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Bottom Sheet */}
      {selectedDoctor && (
        <MD3BottomSheet isOpen={!!selectedDoctor} onClose={() => setSelectedDoctor(null)} title={`Book with ${selectedDoctor.name}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#8b95a7", display: "block", marginBottom: "6px" }}>
                SELECT DATE
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "14px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#e8edf5",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#8b95a7", display: "block", marginBottom: "8px" }}>
                AVAILABLE TIME SLOTS
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "100px",
                      border: selectedSlot === slot ? "1.5px solid #3b82f6" : "1px solid rgba(255, 255, 255, 0.1)",
                      background: selectedSlot === slot ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.04)",
                      color: selectedSlot === slot ? "#60a5fa" : "#8b95a7",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <MD3Button fullWidth loading={loading} onClick={handleBookAppointment}>
              Confirm Booking
            </MD3Button>
          </div>
        </MD3BottomSheet>
      )}
    </AndroidMobileLayout>
  );
}
