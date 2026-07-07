import { db } from "@/src/config/firebase";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";

const conversationsRef = (userId) =>
  collection(db, "aiChats", userId, "conversations");
const messagesRef = (userId, roomId) =>
  collection(db, "aiChats", userId, "conversations", roomId, "messages");

const formatTime = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : date.toDate();
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diff < 172800000) {
    return "Yesterday";
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

export const getRooms = async (userId) => {
  const q = query(conversationsRef(userId), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const updatedAt = data.updatedAt?.toDate?.() || data.updatedAt || new Date();
    return {
      id: d.id,
      title: data.title,
      pinned: data.pinned || false,
      unread: data.unread || 0,
      preview: data.lastMessage || "",
      time: formatTime(updatedAt),
    };
  });
};

export const createRoom = async (userId, title = "New conversation") => {
  const roomDoc = doc(conversationsRef(userId));
  const now = new Date();
  const welcome = {
    sender: "ai",
    text: "Hi! I'm here to support you 🌿\nWhat's on your mind today?",
    time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
  await setDoc(roomDoc, {
    title,
    pinned: false,
    lastMessage: welcome.text,
    updatedAt: now,
  });
  await addDoc(messagesRef(userId, roomDoc.id), { ...welcome, createdAt: now });
  return roomDoc.id;
};

export const updateRoom = async (userId, roomId, patch) => {
  await updateDoc(doc(conversationsRef(userId), roomId), patch);
};

export const deleteRoom = async (userId, roomId) => {
  const msgsSnap = await getDocs(messagesRef(userId, roomId));
  await Promise.all(msgsSnap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(conversationsRef(userId), roomId));
};

export const addMessage = async (userId, roomId, msg) => {
  const msgDoc = await addDoc(messagesRef(userId, roomId), {
    ...msg,
    createdAt: new Date(),
  });
  await updateDoc(doc(conversationsRef(userId), roomId), {
    lastMessage: msg.text,
    updatedAt: new Date(),
  });
  return { id: msgDoc.id, ...msg };
};

export const getMessages = async (userId, roomId) => {
  const q = query(messagesRef(userId, roomId), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
