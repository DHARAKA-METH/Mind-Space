// Appointments/services/mockData.ts
import { LoggedUser, Counselor, Appointment } from "../types";

export const LOGGED_USER: LoggedUser = { id: "U001", name: "Kasun Perera" };

export const TIME_SLOTS = ["8:30 AM", "11:00 AM", "2:00 PM"];
export const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const COUNSELORS: Counselor[] = [
  { id: "C001", name: "Ms. R. Silva", specialties: ["Mindfulness", "Grief"], avatar: "👩‍⚕️", color: "#7C3AED", bgColor: "#EDE9FE" },
  { id: "C002", name: "Dr. S. Perera", specialties: ["Anxiety", "Stress", "CBT"], avatar: "👨‍⚕️", color: "#0369A1", bgColor: "#E0F2FE" },
  { id: "C003", name: "Dr. A. Fernando", specialties: ["Depression", "Trauma"], avatar: "🧑‍⚕️", color: "#065F46", bgColor: "#D1FAE5" },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  { appointmentId: "APP001", studentId: "U001", counselorId: "C001", appointmentDateTime: "2026-05-20T08:30:00Z", durationMinutes: 45, type: "online", status: "confirmed", rescheduleCount: 0, createdAt: "2026-05-15T16:00:00Z", updatedAt: "2026-05-16T09:00:00Z", note: "Initial consultation" }
];