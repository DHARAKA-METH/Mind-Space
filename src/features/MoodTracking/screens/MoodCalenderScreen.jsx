import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMoodEntries } from "../hooks/useMoodEntries";
import { CalendarDay } from "../components/CalendarDay";
import { MoodEntryModal } from "../components/MoodEntryModal";
import {
  DAY_LABELS,
  MONTH_NAMES,
  MOOD_CONFIG,
} from "../../../shared/constants/mood.config";
import { Image } from "expo-image";

const toDateKey = (year, month, day) => {
  if (!day) return null;
  const d = new Date(year, month, day);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

export default function MoodCalendarScreen() {
  // Layer 1: Call hook without arguments and provide fallback object
  const moodHook = useMoodEntries() || {};
  const { entries = {}, loading = true, saveEntry, deleteEntry } = moodHook;

  const [viewDate, setViewDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const todayKey = useMemo(() => {
    const now = new Date();
    return toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
  }, [year, month]);

  const changeMonth = (offset) =>
    setViewDate(new Date(year, month + offset, 1));

  const handleDayPress = useCallback(
    (day) => {
      if (!day) return;
      const dateKey = toDateKey(year, month, day);
      if (dateKey > todayKey) return;

      setSelectedDate({ day, dateKey });
      setModalVisible(true);
    },
    [year, month, todayKey],
  );

  if (loading)
    return (
      <ActivityIndicator size="large" color="#5B9CF6" className="flex-1" />
    );

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FC]">
     <Stack.Screen
  options={{
    headerTitle: "Mood Calendar",
    headerShadowVisible: false,
    headerStyle: {
      backgroundColor: "#ffffff",
    },
  }}
/>

      <ScrollView className="px-4 pt-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-6 bg-white p-3 rounded-2xl shadow-sm">
          <TouchableOpacity
            onPress={() => changeMonth(-1)}
            className="p-2 bg-blue-50 rounded-lg"
          >
            <Ionicons name="chevron-back" size={20} color="#5B9CF6" />
          </TouchableOpacity>
          <Text className="font-bold text-lg text-[#1A1A2E]">
            {MONTH_NAMES[month]} {year}
          </Text>
          <TouchableOpacity
            onPress={() => changeMonth(1)}
            className="p-2 bg-blue-50 rounded-lg"
          >
            <Ionicons name="chevron-forward" size={20} color="#5B9CF6" />
          </TouchableOpacity>
        </View>

        <View className="flex-row mb-2">
          {DAY_LABELS.map((label) => (
            <Text
              key={label}
              className="flex-1 text-center text-gray-400 text-[10px] font-bold"
            >
              {label}
            </Text>
          ))}
        </View>

        <View className="flex-row flex-wrap">
          {cells.map((day, idx) => {
            const dateKey = day ? toDateKey(year, month, day) : null;

            // Layer 2: Ultra-safe lookup
            const entry =
              dateKey && entries && typeof entries === "object"
                ? entries[dateKey]
                : null;

            return (
              <CalendarDay
                key={dateKey || `empty-${idx}`}
                day={day}
                isToday={dateKey === todayKey}
                isLocked={dateKey ? dateKey > todayKey : false}
                entry={entry}
                onPress={handleDayPress}
              />
            );
          })}
        </View>
        {/* Mood Intensity Explanation Section */}
        <View className="mt-8 mb-10 p-5 bg-white rounded-3xl shadow-sm border border-gray-100">
          <Text className="text-gray-400 font-bold text-[10px] mb-5 tracking-widest uppercase text-center">
            Mood Level Guide
          </Text>

          <View className="flex-row justify-between">
            {/* Use MOOD_ORDER instead of Object.keys for consistent sorting */}
            {(MOOD_CONFIG.MOOD_ORDER || Object.keys(MOOD_CONFIG)).map((key) => {
              const item = MOOD_CONFIG[key];
              if (!item) return null; // Safety guard

              return (
                <View key={key} className="items-center flex-1">
                  {/* Circular Icon Container */}
                  <View
                    style={{
                      backgroundColor: item.color
                        ? `${item.color}15`
                        : "#F3F4F6",
                    }}
                    className="w-10 h-10 rounded-full items-center justify-center mb-2"
                  >
                    <Image
                      source={item.icon}
                      style={{ width: 24, height: 24 }} // expo-image likes explicit styles
                      contentFit="contain" // This is the expo-image version of resizeMode
                    />
                  </View>

                  <Text className="text-[9px] font-bold text-gray-600">
                    {item.label}
                  </Text>
                  <Text
                    style={{ color: item.color }}
                    className="text-[8px] font-black uppercase"
                  >
                    Lv. {item.stress}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {selectedDate && (
        <MoodEntryModal
          visible={modalVisible}
          dateKey={selectedDate.dateKey}
          // Layer 3: Safe lookup for Modal
          existingEntry={entries ? entries[selectedDate.dateKey] : null}
          onClose={() => setModalVisible(false)}
          onSave={saveEntry}
          onDelete={deleteEntry}
        />
      )}
    </SafeAreaView>
  );
}
