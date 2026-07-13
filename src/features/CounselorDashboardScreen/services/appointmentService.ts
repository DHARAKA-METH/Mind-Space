import { db } from "@/src/config/firebase";
import {
  collection, doc, getDocs, updateDoc, query, where, orderBy, getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

export interface CounselorAppointment {
  appointmentId: string;
  studentId: string;
  counselorId: string;
  appointmentDateTime: string;
  durationMinutes: number;
  type: string;
  status: string;
  studentName: string;
  studentEmoji: string;
  note: string;
}

export const fetchAppointments = async (counselorId: string): Promise<CounselorAppointment[]> => {
  const snap = await getDocs(query(
    collection(db, "appointments"),
    where("counselorId", "==", counselorId),
    orderBy("appointmentDateTime", "asc"),
  ));

  const results: CounselorAppointment[] = [];
  for (const d of snap.docs) {
    const data = d.data();
    const userSnap = await getDoc(doc(db, "users", data.studentId));
    const user = userSnap.exists() ? userSnap.data() : {};
    results.push({
      appointmentId: d.id,
      studentId: data.studentId,
      counselorId: data.counselorId,
      appointmentDateTime: data.appointmentDateTime,
      durationMinutes: data.durationMinutes,
      type: data.type,
      status: data.status,
      studentName: user.name || user.anonymousId || data.studentId.slice(0, 8),
      studentEmoji: user.emoji || "👤",
      note: data.note || "",
    });
  }
  return results;
};

export const updateAppointmentStatus = async (appointmentId: string, status: "confirmed" | "cancelled"): Promise<void> => {
  await updateDoc(doc(db, "appointments", appointmentId), {
    status,
    updatedAt: new Date().toISOString(),
  });
};
