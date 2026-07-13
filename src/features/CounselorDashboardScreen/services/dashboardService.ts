import { db } from "@/src/config/firebase";
import {
  collection, doc, getDoc, getDocs, query, where, orderBy, limit,
} from "firebase/firestore";

export interface TodayAppointment {
  id: string;
  time: string;
  studentName: string;
  studentEmoji: string;
  type: string;
  status: string;
  appointmentDateTime: string;
}

export interface StressAlert {
  id: string;
  studentId: string;
  studentName: string;
  emoji: string;
  finalStress: number;
  urgency: "high" | "medium";
  detail: string;
}

const getTodayRange = (): { start: string; end: string } => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return {
    start: `${y}-${m}-${d}T00:00:00Z`,
    end: `${y}-${m}-${d}T23:59:59Z`,
  };
};

export const fetchCounselorName = async (counselorId: string): Promise<string> => {
  const snap = await getDoc(doc(db, "users", counselorId));
  if (snap.exists()) {
    const data = snap.data();
    return data.name || "counselor";
  }
  return "counselor";
};

export const fetchTodayAppointments = async (counselorId: string): Promise<TodayAppointment[]> => {
  const { start, end } = getTodayRange();
  const snap = await getDocs(query(
    collection(db, "appointments"),
    where("counselorId", "==", counselorId),
    where("appointmentDateTime", ">=", start),
    where("appointmentDateTime", "<=", end),
    orderBy("appointmentDateTime", "asc"),
  ));

  const results: TodayAppointment[] = [];
  for (const d of snap.docs) {
    const data = d.data();
    const userSnap = await getDoc(doc(db, "users", data.studentId));
    const user = userSnap.exists() ? userSnap.data() : {};
    const dt = new Date(data.appointmentDateTime);
    const timeStr = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    results.push({
      id: d.id,
      time: timeStr,
      studentName: user.name || user.anonymousId || data.studentId.slice(0, 8),
      studentEmoji: user.emoji || "👤",
      type: data.type || "Online",
      status: data.status || "pending",
      appointmentDateTime: data.appointmentDateTime,
    });
  }
  return results;
};

export const fetchStressAlerts = async (counselorId: string): Promise<StressAlert[]> => {
  const convSnap = await getDocs(query(
    collection(db, "conversations"),
    where("counselorId", "==", counselorId),
    where("status", "==", "active"),
  ));

  const studentIds = convSnap.docs.map((d) => d.data().studentId).filter(Boolean);
  if (studentIds.length === 0) return [];

  const results: StressAlert[] = [];

  for (const studentId of studentIds) {
    const moodSnap = await getDocs(query(
      collection(db, "moodEntries"),
      where("userId", "==", studentId),
      orderBy("createdAt", "desc"),
      limit(3),
    ));

    if (moodSnap.empty) continue;

    const latest = moodSnap.docs[0].data();
    const stress = latest.finalStress ?? 0;
    if (stress < 7) continue;

    const userSnap = await getDoc(doc(db, "users", studentId));
    const user = userSnap.exists() ? userSnap.data() : {};
    const name = user.name || user.anonymousId || studentId.slice(0, 8);
    const emoji = user.emoji || "😰";
    const prevStress = moodSnap.docs.length > 1 ? (moodSnap.docs[1].data().finalStress ?? 0) : null;

    let detail: string;
    if (stress >= 9) {
      detail = `Stress level ${stress} — needs attention`;
    } else if (prevStress !== null && stress > prevStress) {
      detail = `Stress rising: ${prevStress}→${stress}`;
    } else {
      detail = `Stress level ${stress}`;
    }

    results.push({
      id: studentId,
      studentId,
      studentName: name,
      emoji,
      finalStress: stress,
      urgency: stress >= 9 ? "high" : "medium",
      detail,
    });
  }

  results.sort((a, b) => b.finalStress - a.finalStress);
  return results.slice(0, 5);
};

export const fetchActiveChatsCount = async (counselorId: string): Promise<number> => {
  const convSnap = await getDocs(query(
    collection(db, "conversations"),
    where("counselorId", "==", counselorId),
    where("status", "==", "active"),
  ));
  return convSnap.size;
};
