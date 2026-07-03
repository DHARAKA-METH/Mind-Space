import { useState, useEffect, useCallback } from "react";
import { getAuth } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../config/firebase";

const toDateKey = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : date.toDate();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const useMoodEntries = () => {
  const [entries, setEntries] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    const user = getAuth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const q = query(
        collection(db, "moodEntries"),
        where("userId", "==", user.uid),
      );
      const snapshot = await getDocs(q);
      const grouped = {};
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const key = data.dateKey || toDateKey(data.createdAt);
        if (!key) return;
        if (!grouped[key]) {
          grouped[key] = {
            id: docSnap.id,
            mood: data.mood,
            note: data.note || "",
            stressLevel: data.finalStress ?? data.selfStress ?? 0,
            updatedAt: data.createdAt?.toDate?.() || data.createdAt,
          };
        }
      });
      setEntries(grouped);
    } catch (error) {
      console.error("Error fetching mood entries:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const saveEntry = async (dateKey, data) => {
    const user = getAuth().currentUser;
    if (!user) return;

    try {
      const existingId = entries[dateKey]?.id;

      if (existingId) {
        const docRef = doc(db, "moodEntries", existingId);
        await updateDoc(docRef, {
          mood: data.mood,
          note: data.note,
          finalStress: data.stressLevel,
          updatedAt: Timestamp.fromDate(new Date()),
        });
      } else {
        const docRef = await addDoc(collection(db, "moodEntries"), {
          userId: user.uid,
          mood: data.mood,
          note: data.note,
          finalStress: data.stressLevel,
          dateKey,
          createdAt: Timestamp.fromDate(new Date()),
        });

        setEntries((prev) => ({
          ...prev,
          [dateKey]: {
            id: docRef.id,
            mood: data.mood,
            note: data.note,
            stressLevel: data.stressLevel,
            updatedAt: new Date().toISOString(),
          },
        }));
        return;
      }
    } catch (error) {
      console.error("Error saving mood entry:", error);
    }

    setEntries((prev) => ({
      ...prev,
      [dateKey]: {
        id: entries[dateKey]?.id,
        mood: data.mood,
        note: data.note,
        stressLevel: data.stressLevel,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const deleteEntry = async (dateKey) => {
    const user = getAuth().currentUser;
    if (!user || !entries[dateKey]) return;

    try {
      const entryId = entries[dateKey].id;
      if (entryId) {
        await deleteDoc(doc(db, "moodEntries", entryId));
      } else {
        const q = query(
          collection(db, "moodEntries"),
          where("userId", "==", user.uid),
          where("dateKey", "==", dateKey),
        );
        const snapshot = await getDocs(q);
        await Promise.all(
          snapshot.docs.map((d) => deleteDoc(doc(db, "moodEntries", d.id))),
        );
      }

      setEntries((prev) => {
        const updated = { ...prev };
        delete updated[dateKey];
        return updated;
      });
    } catch (error) {
      console.error("Error deleting mood entry:", error);
    }
  };

  return { entries, loading, saveEntry, deleteEntry, refresh: fetchEntries };
};