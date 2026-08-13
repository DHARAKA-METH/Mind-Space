import React, { memo } from "react";
import { TouchableOpacity, View, Image, Text } from "react-native";
import { MOOD_CONFIG } from "../../../shared/constants/mood.config";

const CalendarDayComponent = ({ day, isToday, isLocked, entry, onPress }) => {
  // Guard for empty cells (padding at start/end of month)
  if (!day) return <View className="w-[14.28%] aspect-square" />;

  // Safety check for mood data
  const moodData = (entry && entry.mood) ? MOOD_CONFIG[entry.mood] : null;

  return (
    <TouchableOpacity
      onPress={() => onPress(day)}
      disabled={isLocked}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${day}${moodData ? `, ${moodData.label}` : ", no mood recorded"}${isToday ? ", today" : ""}`}
      accessibilityState={{ disabled: isLocked }}
      className={`w-[14.28%] aspect-square p-1 ${isLocked && !isToday ? "opacity-20" : "opacity-100"}`}
    >
      <View className={`w-full h-full rounded-2xl items-center justify-between py-1.5 bg-app-surface border shadow-sm
        ${isToday ? "border-app-primary bg-app-primarySoft" : "border-app-borderSoft"}`}
      >
        {/*  Day Number - Always visible at the top */}
        <Text className={`text-caption font-bold ${isToday ? "text-app-primary" : "text-app-textMuted"}`}>
          {day}
        </Text>

        {/*  Mood Emoji - Center area */}
        <View className="h-7 w-7 items-center justify-center">
          {moodData ? (
            <Image 
              source={moodData.icon} 
              className="w-full h-full" 
              resizeMode="contain" 
            />
          ) : (
            // Small subtle indicator if no mood is set yet
            <View className="w-1 h-1 rounded-full bg-app-border" />
          )}
        </View>

        {/*  Bottom Spacer - Keeps the number pushed to the top */}
        <View className="h-1" />
      </View>
    </TouchableOpacity>
  );
};

export const CalendarDay = memo(CalendarDayComponent);
CalendarDay.displayName = "CalendarDay";
