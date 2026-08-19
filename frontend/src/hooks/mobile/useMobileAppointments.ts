"use client";

import { useEffect, useCallback } from "react";
import { useAppointmentStore } from "@/stores/useAppointmentStore";
import { API_URL } from "@/lib/config";
import toast from "react-hot-toast";

export function useMobileAppointments(userId?: string) {
  const { appointments, doctors, selectedDoctor, loading, setAppointments, setDoctors, setSelectedDoctor, addAppointment, setLoading } = useAppointmentStore();

  const fetchAppointments = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    if (useAppointmentStore.getState().appointments.length === 0) {
      setLoading(true);
    }
    try {
      const res = await fetch(`${API_URL}/appointments/user/${userId}`);
      if (res.ok) {
        const json = await res.json();
        setAppointments(json.appointments || []);
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, setAppointments, setLoading]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const bookAppointment = async (booking: {
    doctor_id: string;
    doctor_name: string;
    patient_name: string;
    date: string;
    time_slot: string;
    notes?: string;
  }) => {
    if (!userId) return false;
    try {
      const res = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      });
      if (res.ok) {
        toast.success("Appointment booked successfully! 📅");
        addAppointment(booking);
        fetchAppointments();
        return true;
      } else {
        toast.error("Failed to book appointment.");
        return false;
      }
    } catch (err) {
      toast.error("Network error.");
      return false;
    }
  };

  return {
    appointments,
    doctors,
    selectedDoctor,
    setSelectedDoctor,
    loading,
    refetch: fetchAppointments,
    bookAppointment,
  };
}
