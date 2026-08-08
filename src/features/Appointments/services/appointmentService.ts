import { db } from "@/src/config/firebase";
import {
  collection, doc, getDoc, getDocs, setDoc, query, where, orderBy,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Counselor, Appointment } from "../types";
import { avatarColors } from "@/src/theme";

export const getCounselors = async (): Promise<Counselor[]> => {
  const snap = await getDocs(query(
    collection(db, "users"),
    where("userType", "==", "counselor"),
  ));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name || "counselor",
      specialties: data.specialties || [data.specialty || data.specialization || "General"].filter(Boolean),
      avatar: data.emoji || "👩‍⚕️",
      color: data.color || avatarColors.purple,
      bgColor: data.bgColor || avatarColors.purpleSoft,
    };
  });
};

export const getLoggedUser = () => {
  const user = getAuth().currentUser;
  if (!user) return null;
  return { id: user.uid, name: user.displayName || user.email || "Student" };
};

export const fetchAppointments = async (studentId: string): Promise<Appointment[]> => {
  const snap = await getDocs(query(
    collection(db, "appointments"),
    where("studentId", "==", studentId),
    orderBy("appointmentDateTime", "asc"),
  ));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      appointmentId: d.id,
      studentId: data.studentId,
      counselorId: data.counselorId,
      appointmentDateTime: data.appointmentDateTime,
      durationMinutes: data.durationMinutes,
      type: data.type,
      status: data.status,
      rescheduleCount: data.rescheduleCount ?? 0,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      note: data.note || "",
    } as Appointment;
  });
};

export const fetchCurrentStressPercentage = async (
  studentId: string,
): Promise<number | null> => {
  const snap = await getDoc(doc(db, "users", studentId));
  if (!snap.exists()) return null;

  const stress = Number(snap.data().currentStressLevel);
  if (!Number.isFinite(stress)) return null;

  // currentStressLevel is stored on a 0-10 scale.
  return Math.round(Math.min(10, Math.max(0, stress)) * 10);
};

export const createAppointment = async (data: {
  studentId: string;
  counselorId: string;
  appointmentDateTime: string;
  durationMinutes: number;
  type: string;
  note: string;
}): Promise<string> => {
  const now = new Date().toISOString();
  const apptRef = doc(collection(db, "appointments"));
  const appointmentData = {
    studentId: data.studentId,
    counselorId: data.counselorId,
    appointmentDateTime: data.appointmentDateTime,
    durationMinutes: data.durationMinutes,
    type: data.type,
    status: "pending",
    rescheduleCount: 0,
    createdAt: now,
    updatedAt: now,
    note: data.note,
  };
  await setDoc(apptRef, appointmentData);
  return apptRef.id;
};
