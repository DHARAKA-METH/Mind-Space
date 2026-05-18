// hooks/useMoodEntries.js
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "mood_entries";

export const useMoodEntries = () => {
  const [entries, setEntries] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setEntries(JSON.parse(raw));
      setLoading(false);
    })();
  }, []);

  const saveEntry = async (dateKey, data) => {
    const updated = { ...entries, [dateKey]: data };
    setEntries(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteEntry = async (dateKey) => {
    const updated = { ...entries };
    delete updated[dateKey];
    setEntries(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return { entries, loading, saveEntry, deleteEntry };
};