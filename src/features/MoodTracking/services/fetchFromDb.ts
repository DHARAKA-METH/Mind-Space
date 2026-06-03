import { db } from "@/src/config/firebase"; 
import { collection, query, where, getDocs, Timestamp, orderBy } from "firebase/firestore";

export async function fetchMoodFromDb(userId: string) {
  try {
    if (!userId) return [];

    // 1. Establish localized midnight safely
    const midnightToday = new Date();
    midnightToday.setHours(0, 0, 0, 0);
    
    // Explicitly convert your local midnight into a standardized Firestore Timestamp
    const startTimestamp = Timestamp.fromDate(midnightToday);

    const moodRef = collection(db, "moodEntries");
    
    // 2. Query matching both user scope and timeframe
    // Added orderBy to keep entries chronologically clean
    const q = query(
      moodRef,
      where("userId", "==", userId),
      where("createdAt", ">=", startTimestamp),
      orderBy("createdAt", "asc") 
    );

    const querySnapshot = await getDocs(q);
    
    const entries = querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        // Optional UX fix: Converts Firestore raw maps back to JS Dates for easy UI reading
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
      };
    });

    return entries;

  } catch (error: any) {
    // Look out for a Firestore index creation link in your terminal console logs!
    console.error("Error fetching mood from database:", error);
    return [];
  }
}