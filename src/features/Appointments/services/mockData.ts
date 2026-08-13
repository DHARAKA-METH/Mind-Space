// Appointments/services/mockData.ts
import { LoggedUser, Counselor, Appointment } from "../types";
import { avatarColors } from "@/src/theme";

export const LOGGED_USER: LoggedUser = { id: "U001", name: "Kasun Perera" };

export const TIME_SLOTS = ["8:30 AM", "11:00 AM", "2:00 PM"];
export const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const COUNSELORS: Counselor[] = [
  { id: "C001", name: "Ms. R. Silva", specialties: ["Mindfulness", "Grief"], avatar: "👩‍⚕️", color: avatarColors.purple, bgColor: avatarColors.purpleSoft },
  { id: "C002", name: "Dr. S. Perera", specialties: ["Anxiety", "Stress", "CBT"], avatar: "👨‍⚕️", color: avatarColors.blue, bgColor: avatarColors.blueSoft },
  { id: "C003", name: "Dr. A. Fernando", specialties: ["Depression", "Trauma"], avatar: "🧑‍⚕️", color: avatarColors.green, bgColor: avatarColors.greenSoft },
  { id: "C004", name: "Dr. A. Fernando", specialties: ["Depression", "Trauma"], avatar: "🧑‍⚕️", color: avatarColors.green, bgColor: avatarColors.greenSoft },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  { appointmentId: "APP001", studentId: "U001", counselorId: "C001", appointmentDateTime: "2026-05-20T08:30:00Z", durationMinutes: 45, type: "online", status: "confirmed", rescheduleCount: 0, createdAt: "2026-05-15T16:00:00Z", updatedAt: "2026-05-16T09:00:00Z", note: "Initial consultation" }
];
