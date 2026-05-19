// Appointments/types/index.ts

export interface LoggedUser {
  id: string;
  name: string;
}

export interface Counselor {
  id: string;
  name: string;
  specialties: string[];
  avatar: string;
  color: string;
  bgColor: string;
}

export interface Appointment {
  appointmentId: string;
  studentId: string;
  counselorId: string;
  appointmentDateTime: string; // ISO String
  durationMinutes: number;
  type: "online" | "physical";
  status: "confirmed" | "pending";
  rescheduleCount: number;
  createdAt: string;
  updatedAt: string;
  note: string;
}

export interface DaySchedule {
  globalSlots: string[];
  studentHasBooking: boolean;
  studentBookingDetails: Appointment | null;
}