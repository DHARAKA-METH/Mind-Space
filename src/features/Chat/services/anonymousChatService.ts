import { db } from "@/src/config/firebase";
import {
  collection, doc, getDocs, setDoc, updateDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, Timestamp, increment,
} from "firebase/firestore";

export interface CounselorData {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  lang: string;
  exp: number;
  online: boolean;
  emoji: string;
  color: string;
  avgReply: string;
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderRole: "student" | "counselor";
  text: string;
  createdAt?: Timestamp;
  type?: string;
  read?: boolean;
}

export const getCounselors = async (): Promise<CounselorData[]> => {
  const snap = await getDocs(query(
    collection(db, "users"),
    where("userType", "==", "counselor"),
  ));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name || "Counselor",
      specialty: data.specialty || data.specialization || "General Counselor",
      bio: data.bio || "Dedicated to supporting student mental health.",
      lang: data.lang || "English",
      exp: data.exp || data.experience || 0,
      online: data.online ?? true,
      emoji: data.emoji || "👩‍⚕️",
      color: data.color || "bg-indigo-100",
      avgReply: data.avgReply || "< 10 min",
    };
  });
};

export const startOrGetConversation = async (studentId: string, counselorId: string): Promise<string> => {
  const q = query(
    collection(db, "conversations"),
    where("studentId", "==", studentId),
    where("counselorId", "==", counselorId),
    where("status", "==", "active"),
    limit(1),
  );
  const snap = await getDocs(q);
  if (!snap.empty) return snap.docs[0].id;

  const convRef = doc(collection(db, "conversations"));
  await setDoc(convRef, {
    studentId,
    counselorId,
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: "",
    lastMessageTime: null,
    unreadStudent: 0,
    unreadCounselor: 0,
  });
  return convRef.id;
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  senderRole: "student" | "counselor",
  text: string,
): Promise<void> => {
  const msgRef = doc(collection(db, "conversations", conversationId, "messages"));
  await setDoc(msgRef, {
    senderId,
    senderRole,
    text,
    createdAt: serverTimestamp(),
    type: "text",
    read: false,
  });
  const updateData: Record<string, any> = {
    lastMessage: text,
    updatedAt: serverTimestamp(),
    lastMessageTime: serverTimestamp(),
  };
  if (senderRole === "student") {
    updateData.unreadCounselor = increment(1);
  } else {
    updateData.unreadStudent = increment(1);
  }
  await updateDoc(doc(db, "conversations", conversationId), updateData);
};

export const subscribeMessages = (
  conversationId: string,
  onMessages: (messages: ChatMessage[]) => void,
): (() => void) => {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        senderId: data.senderId,
        senderRole: data.senderRole,
        text: data.text,
        createdAt: data.createdAt,
        type: data.type || "text",
        read: data.read ?? false,
      } as ChatMessage;
    });
    onMessages(msgs);
  });
};

export const markConversationRead = async (conversationId: string, role: "student" | "counselor"): Promise<void> => {
  const field = role === "student" ? "unreadStudent" : "unreadCounselor";
  await updateDoc(doc(db, "conversations", conversationId), { [field]: 0 });
};
