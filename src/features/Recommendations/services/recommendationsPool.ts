import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";

import { db } from "@/src/config/firebase";

export async function getUserRecommendations(userId:any) {
  try {
    const q = query(
      collection(db, "recommendations"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error(
      "Error fetching recommendations:",
      error
    );

    return [];
  }
}