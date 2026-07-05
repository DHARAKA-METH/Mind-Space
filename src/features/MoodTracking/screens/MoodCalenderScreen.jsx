import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useMoodEntries } from "../hooks/useMoodEntries";
import { CalendarDay } from "../components/CalendarDay";
import { MoodEntryModal } from "../components/MoodEntryModal";
import {
  DAY_LABELS,
  MONTH_NAMES,
  MOOD_CONFIG,
} from "../../../shared/constants/mood.config";
import { Image } from "expo-image";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ceylon = {
  ink: "#3D2E1F",
  muted: "#8A7A63",
  mutedLight: "#B8A78C",
  teaGreen: "#4A7856",
  sage: "#7C9885",
  terracotta: "#C97B4A",
  sand: "#F0E4D3",
  cream: "#FBF3EA",
  background: "#ECE6E3",
};

// --- Spacing scale: use these everywhere instead of ad-hoc mb-N values ----
const SPACE = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
};

const SCREEN_PADDING_H = 16; // consistent left/right gutter for the whole screen

const toDateKey = (year, month, day) => {
  if (!day) return null;
  const d = new Date(year, month, day);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

export default function MoodCalendarScreen() {
  const moodHook = useMoodEntries() || {};
  const { entries = {}, loading = true, saveEntry, deleteEntry } = moodHook;

  const [viewDate, setViewDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [highlightMood, setHighlightMood] = useState(null);
  const [lockedNotice, setLockedNotice] = useState(false);

  const noticeOpacity = useSharedValue(0);
  const arrowScale = useSharedValue(1);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const todayKey = useMemo(() => {
    const now = new Date();
    return toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth();
  }, [year, month]);

  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
  }, [year, month]);

  const monthStats = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let logged = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const key = toDateKey(year, month, d);
      if (entries?.[key]) logged += 1;
    }
    const completion = Math.min(Math.round((logged / daysInMonth) * 100), 100);
    return { logged, daysInMonth, completion };
  }, [entries, year, month]);

  const streak = useMemo(() => {
    let count = 0;
    let cursor = new Date();
    while (true) {
      const key = toDateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
      if (entries?.[key]) {
        count += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }, [entries, todayKey]);

  const changeMonth = (offset) => {
    Haptics.selectionAsync().catch(() => {});
    arrowScale.value = withSequence(
      withTiming(0.85, { duration: 90 }),
      withTiming(1, { duration: 140, easing: Easing.out(Easing.ease) })
    );
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setViewDate(new Date(year, month + offset, 1));
  };

  const jumpToToday = () => {
    Haptics.selectionAsync().catch(() => {});
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setViewDate(new Date());
  };

  const arrowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: arrowScale.value }],
  }));

  const showLockedNotice = () => {
    setLockedNotice(true);
    noticeOpacity.value = withSequence(
      withTiming(1, { duration: 180 }),
      withTiming(1, { duration: 900 }),
      withTiming(0, { duration: 350 })
    );
    setTimeout(() => setLockedNotice(false), 1500);
  };

  const noticeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: noticeOpacity.value,
  }));

  const handleDayPress = useCallback(
    (day) => {
      if (!day) return;
      const dateKey = toDateKey(year, month, day);
      if (dateKey > todayKey) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        showLockedNotice();
        return;
      }
      Haptics.selectionAsync().catch(() => {});
      setSelectedDate({ day, dateKey });
      setModalVisible(true);
    },
    [year, month, todayKey],
  );

  const toggleMoodFilter = (key) => {
    Haptics.selectionAsync().catch(() => {});
    setHighlightMood((prev) => (prev === key ? null : key));
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: ceylon.cream }}>
        <View
          className="rounded-full items-center justify-center"
          style={{ width: 64, height: 64, backgroundColor: "#fff", marginBottom: SPACE.lg }}
        >
          <Ionicons name="leaf-outline" size={26} color={ceylon.sage} />
        </View>
        <Text style={{ color: ceylon.muted, fontSize: 13 }}>Loading your reflections…</Text>
      </SafeAreaView>
    );
  }

  const moodOrder = MOOD_CONFIG.MOOD_ORDER || Object.keys(MOOD_CONFIG);

  return (
    <SafeAreaView className="flex-1 mt-[-30px]"  style={{ backgroundColor: ceylon.background }}>
      <Stack.Screen
        options={{
          headerTitle: "Mood Calendar",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: ceylon.cream },
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: SCREEN_PADDING_H,
          paddingTop: SPACE.lg,
          paddingBottom: SPACE.xxxl, 
        }}
      >
        {/* Month navigator */}
        <View
          className="flex-row items-center justify-between rounded-2xl"
          style={{
            backgroundColor: "#fff",
            paddingVertical: SPACE.md,
            paddingHorizontal: SPACE.md,
            marginBottom: SPACE.lg,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 3 },
            elevation: 1,
          }}
        >
          <Animated.View style={arrowAnimatedStyle}>
            <TouchableOpacity
              onPress={() => changeMonth(-1)}
              className="rounded-lg"
              style={{ backgroundColor: ceylon.sand, padding: SPACE.sm }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color={ceylon.teaGreen} />
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity onPress={jumpToToday} activeOpacity={0.7} disabled={isCurrentMonth}>
            <Text className="font-bold text-lg text-center" style={{ color: ceylon.ink }}>
              {MONTH_NAMES[month]} {year}
            </Text>
            {/* Reserve the line height even when hidden, so the header doesn't shift size */}
            <Text
              className="text-center text-[10px]"
              style={{ color: ceylon.sage, marginTop: 2, opacity: isCurrentMonth ? 0 : 1 }}
            >
              Tap for today
            </Text>
          </TouchableOpacity>

          <Animated.View style={arrowAnimatedStyle}>
            <TouchableOpacity
              onPress={() => changeMonth(1)}
              className="rounded-lg"
              style={{ backgroundColor: ceylon.sand, padding: SPACE.sm }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={20} color={ceylon.teaGreen} />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Streak + completion summary */}
        <View className="flex-row" style={{ gap: SPACE.md, marginBottom: SPACE.lg }}>
          <View
            className="flex-1 items-center rounded-2xl"
            style={{ backgroundColor: "#fff", paddingVertical: SPACE.md }}
          >
            <Text style={{ color: ceylon.terracotta, fontSize: 20, fontWeight: "700" }}>
              {streak}
            </Text>
            <Text
              style={{ color: ceylon.muted, fontSize: 10, marginTop: SPACE.xs }}
              className="uppercase tracking-wide"
            >
              Day streak
            </Text>
          </View>
          <View
            className="flex-1 items-center rounded-2xl"
            style={{ backgroundColor: "#fff", paddingVertical: SPACE.md }}
          >
            <Text style={{ color: ceylon.teaGreen, fontSize: 20, fontWeight: "700" }}>
              {monthStats.completion}%
            </Text>
            <Text
              style={{ color: ceylon.muted, fontSize: 10, marginTop: SPACE.xs }}
              className="uppercase tracking-wide"
            >
              This month
            </Text>
          </View>
        </View>

        {/* Locked-day notice — reserve height so it doesn't cause a layout jump */}
        <View style={{ height: lockedNotice ? undefined : 0, marginBottom: lockedNotice ? SPACE.md : 0 }}>
          {lockedNotice && (
            <Animated.View
              style={[
                noticeAnimatedStyle,
                {
                  backgroundColor: ceylon.sand,
                  borderRadius: 14,
                  paddingVertical: SPACE.sm,
                  paddingHorizontal: SPACE.md,
                },
              ]}
            >
              <Text style={{ color: ceylon.ink, fontSize: 12, textAlign: "center" }}>
                That day hasn&apos;t arrived yet — one moment at a time 🌿
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Weekday labels */}
        <View className="flex-row" style={{ marginBottom: SPACE.sm }}>
          {DAY_LABELS.map((label) => (
            <Text
              key={label}
              className="flex-1 text-center text-[10px] font-bold"
              style={{ color: ceylon.mutedLight }}
            >
              {label}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View className="flex-row flex-wrap" style={{ marginBottom: SPACE.lg }}>
          {cells.map((day, idx) => {
            const dateKey = day ? toDateKey(year, month, day) : null;
            const entry =
              dateKey && entries && typeof entries === "object" ? entries[dateKey] : null;

            const isDimmed =
              !!highlightMood && !!entry && entry.mood && entry.mood !== highlightMood;

            return (
              <CalendarDay
                key={dateKey || `empty-${idx}`}
                day={day}
                isToday={dateKey === todayKey}
                isLocked={dateKey ? dateKey > todayKey : false}
                entry={entry}
                dimmed={isDimmed}
                onPress={handleDayPress}
              />
            );
          })}
        </View>

        {/* Empty state nudge */}
        {monthStats.logged === 0 && (
          <View
            className="items-center rounded-3xl"
            style={{
              backgroundColor: "#fff",
              paddingVertical: SPACE.xl,
              paddingHorizontal: SPACE.lg,
              marginBottom: SPACE.lg,
            }}
          >
            <Ionicons
              name="cafe-outline"
              size={22}
              color={ceylon.sage}
              style={{ marginBottom: SPACE.sm }}
            />
            <Text style={{ color: ceylon.ink, fontWeight: "600", fontSize: 13 }}>
              No check-ins yet this month
            </Text>
            <Text
              style={{ color: ceylon.muted, fontSize: 11, marginTop: SPACE.xs, textAlign: "center" }}
            >
              Tap today&apos;s date to log how you&apos;re feeling.
            </Text>
          </View>
        )}

        {/* Mood Level Guide */}
        <View
          className="rounded-3xl"
          style={{ backgroundColor: "#fff", paddingVertical: SPACE.xl, paddingHorizontal: SPACE.lg }}
        >
          <Text
            className="font-bold text-[10px] tracking-widest uppercase text-center"
            style={{ color: ceylon.mutedLight, marginBottom: SPACE.xs }}
          >
            Mood Level Guide
          </Text>
          <Text
            className="text-[9px] text-center"
            style={{ color: ceylon.mutedLight, marginBottom: SPACE.xl }}
          >
            Tap a mood to spotlight those days
          </Text>

          <View className="flex-row justify-between">
            {moodOrder.map((key) => {
              const item = MOOD_CONFIG[key];
              if (!item) return null;
              const isActive = highlightMood === key;
              const isDimmedLegend = !!highlightMood && !isActive;

              return (
                <TouchableOpacity
                  key={key}
                  className="items-center flex-1"
                  activeOpacity={0.7}
                  onPress={() => toggleMoodFilter(key)}
                  style={{ opacity: isDimmedLegend ? 0.4 : 1 }}
                >
                  <View
                    style={{
                      backgroundColor: item.color ? `${item.color}15` : ceylon.sand,
                      borderWidth: isActive ? 1.5 : 0,
                      borderColor: item.color || ceylon.sage,
                      width: 40,
                      height: 40,
                      marginBottom: SPACE.sm,
                    }}
                    className="rounded-full items-center justify-center"
                  >
                    <Image
                      source={item.icon}
                      style={{ width: 24, height: 24 }}
                      contentFit="contain"
                    />
                  </View>

                  <Text className="text-[9px] font-bold" style={{ color: ceylon.ink }}>
                    {item.label}
                  </Text>
                  <Text
                    style={{ color: item.color || ceylon.muted, marginTop: 1 }}
                    className="text-[8px] font-black uppercase"
                  >
                    Lv. {item.stress}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {selectedDate && (
        <MoodEntryModal
          visible={modalVisible}
          dateKey={selectedDate.dateKey}
          existingEntry={entries ? entries[selectedDate.dateKey] : null}
          onClose={() => setModalVisible(false)}
          onSave={saveEntry}
          onDelete={deleteEntry}
        />
      )}
    </SafeAreaView>
  );
}