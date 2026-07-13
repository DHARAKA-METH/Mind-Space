import { db } from "@/src/config/firebase";
import {
  collection, doc, getDoc, setDoc, updateDoc, query, where, orderBy, onSnapshot, serverTimestamp, increment,
} from "firebase/firestore";

export interface ConversationStudent {
  conversationId: string;
  studentId: string;
  anonymousId: string;
  emoji: string;
  stressLevel: number;
  concern: string;
  lastActive: string;
  online: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
}

export interface MessageData {
  id: string;
  senderId: string;
  senderRole: "student" | "counselor";
  text: string;
  createdAt: any;
  type: string;
  read: boolean;
}

export const subscribeConversations = (
  counselorId: string,
  onData: (students: ConversationStudent[]) => void,
): (() => void) => {
  const q = query(
    collection(db, "conversations"),
    where("counselorId", "==", counselorId),
    where("status", "==", "active"),
    orderBy("updatedAt", "desc"),
  );

  return onSnapshot(q, async (snap) => {
    const results: ConversationStudent[] = [];
    for (const docSnap of snap.docs) {
      const conv = docSnap.data();
      const studentId = conv.studentId;
      const userSnap = await getDoc(doc(db, "users", studentId));
      const user = userSnap.exists() ? userSnap.data() : {};
      const updatedAt = conv.updatedAt?.toDate?.() || new Date();
      const now = new Date();
      const diffMs = now.getTime() - updatedAt.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const lastActive =
        diffMin < 1 ? "Just now" :
        diffMin < 60 ? `${diffMin} min ago` :
        diffMin < 1440 ? `${Math.floor(diffMin / 60)}h ago` :
        "Yesterday";

      results.push({
        conversationId: docSnap.id,
        studentId,
        anonymousId: user.anonymousId || studentId.slice(0, 8),
        emoji: user.emoji || "💬",
        stressLevel: conv.stressLevel ?? 0,
        concern: conv.concern || "Connected for support",
        lastActive,
        online: user.online ?? true,
        lastMessage: conv.lastMessage || "",
        lastMessageTime: conv.lastMessageTime?.toDate?.()?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "",
        unread: conv.unreadCounselor ?? 0,
      });
    }
    onData(results);
  });
};

export const subscribeMessages = (
  conversationId: string,
  onMessages: (messages: MessageData[]) => void,
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
      } as MessageData;
    });
    onMessages(msgs);
  });
};

export const sendMessage = async (
  conversationId: string,
  counselorId: string,
  text: string,
): Promise<void> => {
  const msgRef = doc(collection(db, "conversations", conversationId, "messages"));
  await setDoc(msgRef, {
    senderId: counselorId,
    senderRole: "counselor",
    text,
    createdAt: serverTimestamp(),
    type: "text",
    read: false,
  });
  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessage: text,
    updatedAt: serverTimestamp(),
    lastMessageTime: serverTimestamp(),
    unreadStudent: increment(1),
  });
};

export const markConversationRead = async (conversationId: string): Promise<void> => {
  await updateDoc(doc(db, "conversations", conversationId), { unreadCounselor: 0 });
};
