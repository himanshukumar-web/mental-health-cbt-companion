"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMobileAppointments } from "@/hooks/mobile";
import AndroidMobileLayout from "./AndroidMobileLayout";
import {
  TopAppBar,
  TherapistCard,
  MaterialCard,
  PrimaryButton,
  BottomSheet,
  Chip,
  Badge,
  LoadingSkeleton,
} from "./ui";
import toast from "react-hot-toast";

const MOCK_DOCTORS = [
  { id: "doc1", name: "Dr. Sarah Jenkins", title: "Licensed Clinical Psychologist", specialty: "Anxiety & CBT", rating: "4.9 ⭐", avatar: "🩺" },
  { id: "doc2", name: "Dr. Marcus Vance", title: "Psychiatrist & CBT Specialist", specialty: "Depression & Trauma", rating: "4.8 ⭐", avatar: "👨‍⚕️" },
  { id: "doc3", name: "Dr. Elena Rostova", title: "Mindfulness Practitioner", specialty: "Stress & Burnout", rating: "5.0 ⭐", avatar: "👩‍⚕️" },
];

const TIME_SLOTS = ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM", "06:00 PM"];

export default function AndroidAppointments() {
  const { user } = useAuth();
  const { appointments, loading, bookAppointment } = useMobileAppointments(user?.id);

  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>("11:30 AM");
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleBook = async () => {
    if (!selectedDoctor) return;
    setSubmitting(true);
    const success = await bookAppointment({
      doctor_id: selectedDoctor.id,
      doctor_name: selectedDoctor.name,
      patient_name: user?.user_metadata?.full_name || "Patient",
      date: bookingDate,
      time_slot: selectedSlot,
      notes: "Booked via Android Mobile App",
    });
    if (success) {
      setSelectedDoctor(null);
      toast.success("Appointment scheduled successfully! 🎉");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <AndroidMobileLayout>
        <TopAppBar title="Doctor Appointments" subtitle="Schedule professional consultation" />
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <LoadingSkeleton height="120px" />
          <LoadingSkeleton height="200px" />
        </div>
      </AndroidMobileLayout>
    );
  }

  return (
    <AndroidMobileLayout>
      <TopAppBar title="Doctor Appointments" subtitle="Schedule professional consultation" />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Existing Appointments */}
        {appointments.length > 0 && (
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#e8edf5", marginBottom: "12px" }}>
              Upcoming Sessions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {appointments.map((appt) => (
                <MaterialCard key={appt.id} variant="elevated" style={{ borderColor: "rgba(59, 130, 246, 0.3)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "#e8edf5" }}>
                        {appt.doctor_name || "Professional Specialist"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#3b82f6", marginTop: "2px" }}>
                        📅 {appt.date} at {appt.time_slot}
                      </div>
                    </div>
                    <Badge label="CONFIRMED" color="#4ade80" bg="rgba(34, 197, 94, 0.15)" />
                  </div>
                </MaterialCard>
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
              <TherapistCard
                key={doc.id}
                name={doc.name}
                title={doc.title}
                specialty={doc.specialty}
                rating={doc.rating}
                avatar={doc.avatar}
                onBook={() => setSelectedDoctor(doc)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Booking Bottom Sheet */}
      {selectedDoctor && (
        <BottomSheet isOpen={!!selectedDoctor} onClose={() => setSelectedDoctor(null)} title={`Book with ${selectedDoctor.name}`}>
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
                  <Chip
                    key={slot}
                    label={slot}
                    selected={selectedSlot === slot}
                    onClick={() => setSelectedSlot(slot)}
                  />
                ))}
              </div>
            </div>

            <PrimaryButton fullWidth loading={submitting} onClick={handleBook}>
              Confirm Booking
            </PrimaryButton>
          </div>
        </BottomSheet>
      )}
    </AndroidMobileLayout>
  );
}
