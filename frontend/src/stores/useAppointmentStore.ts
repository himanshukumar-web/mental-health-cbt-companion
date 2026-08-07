import { create } from "zustand";

export interface DoctorData {
  id: string;
  name: string;
  title: string;
  specialty: string;
  rating?: string;
  avatar?: string;
}

export interface AppointmentData {
  id?: string;
  doctor_id: string;
  doctor_name: string;
  patient_name: string;
  date: string;
  time_slot: string;
  status?: string;
  notes?: string;
}

interface AppointmentStoreState {
  appointments: AppointmentData[];
  doctors: DoctorData[];
  selectedDoctor: DoctorData | null;
  loading: boolean;
  setAppointments: (appointments: AppointmentData[]) => void;
  setDoctors: (doctors: DoctorData[]) => void;
  setSelectedDoctor: (doctor: DoctorData | null) => void;
  addAppointment: (appointment: AppointmentData) => void;
  setLoading: (loading: boolean) => void;
}

export const useAppointmentStore = create<AppointmentStoreState>((set) => ({
  appointments: [],
  doctors: [],
  selectedDoctor: null,
  loading: true,
  setAppointments: (appointments) => set({ appointments, loading: false }),
  setDoctors: (doctors) => set({ doctors }),
  setSelectedDoctor: (selectedDoctor) => set({ selectedDoctor }),
  addAppointment: (appointment) =>
    set((state) => ({ appointments: [appointment, ...state.appointments] })),
  setLoading: (loading) => set({ loading }),
}));
