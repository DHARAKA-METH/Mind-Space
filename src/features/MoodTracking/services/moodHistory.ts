import {
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";

import { db } from "../../../config/firebase";

export async function getMoodHistory(userId:any) {
  const q = query(
    collection(db, "moodEntries"),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => doc.data());
}

export function calculateHistoryAverage(entries:any[]) {
  if (!entries.length) return 0;

  const total = entries.reduce(
    (sum, item) => sum + item.finalStress,
    0
  );

  return total / entries.length;
}