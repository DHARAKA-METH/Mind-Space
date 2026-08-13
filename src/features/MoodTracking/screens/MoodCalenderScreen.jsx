import React, {
  useState,
  useMemo,
  useCallback,
} from "react";

import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  Stack,
} from "expo-router";

import {
  Ionicons,
} from "@expo/vector-icons";

import * as Haptics from "expo-haptics";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";

import {
  Image,
} from "expo-image";

import {
  useMoodEntries,
} from "../hooks/useMoodEntries";

import {
  CalendarDay,
} from "../components/CalendarDay";

import {
  MoodEntryModal,
} from "../components/MoodEntryModal";

import {
  DAY_LABELS,
  MONTH_NAMES,
  MOOD_CONFIG,
} from "../../../shared/constants/mood.config";
import { spacing, studentColors } from "@/src/theme";

/* -------------------------------------------------------------------------- */
/*                               ANDROID SETUP                                */
/* -------------------------------------------------------------------------- */

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(
    true
  );
}

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

const toDateKey = (
  year,
  month,
  day
) => {
  if (!day) return null;

  const date = new Date(
    year,
    month,
    day
  );

  date.setMinutes(
    date.getMinutes() -
      date.getTimezoneOffset()
  );

  return date
    .toISOString()
    .split("T")[0];
};

/* -------------------------------------------------------------------------- */
/*                              CUSTOM HEADER                                 */
/* -------------------------------------------------------------------------- */

function CalendarHeader() {
  return (
    <View className="flex-row items-center">
      {/* Header icon */}

      <View
        className="
          w-10
          h-10
          rounded-2xl
          bg-app-primarySoft
          items-center
          justify-center
          mr-3
        "
      >
        <Ionicons
          name="calendar-outline"
          size={20}
          color={studentColors.primary}
        />
      </View>

      {/* Header text */}

      <View>
        <Text
          className="
            text-subtitle
            font-extrabold
            text-app-textPrimary
          "
        >
          Mood Calendar
        </Text>

        <Text
          className="
            text-caption
            mt-0.5
            text-app-textSecondary
          "
        >
          Your emotional journey
        </Text>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                             CALENDAR SCREEN                                */
/* -------------------------------------------------------------------------- */

export default function MoodCalendarScreen() {
  const moodHook =
    useMoodEntries() || {};

  const {
    entries = {},
    loading = true,
    saveEntry,
    deleteEntry,
  } = moodHook;

  const [viewDate, setViewDate] =
    useState(new Date());

  const [
    modalVisible,
    setModalVisible,
  ] = useState(false);

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(null);

  const [
    highlightMood,
    setHighlightMood,
  ] = useState(null);

  const [
    lockedNotice,
    setLockedNotice,
  ] = useState(false);

  const noticeOpacity =
    useSharedValue(0);

  const arrowScale =
    useSharedValue(1);

  const year =
    viewDate.getFullYear();

  const month =
    viewDate.getMonth();

  /* ------------------------------------------------------------------------ */
  /*                                  TODAY                                   */
  /* ------------------------------------------------------------------------ */

  const todayKey = useMemo(() => {
    const now = new Date();

    return toDateKey(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                         CURRENT MONTH CHECK                              */
  /* ------------------------------------------------------------------------ */

  const isCurrentMonth =
    useMemo(() => {
      const now = new Date();

      return (
        year ===
          now.getFullYear() &&
        month ===
          now.getMonth()
      );
    }, [year, month]);

  /* ------------------------------------------------------------------------ */
  /*                           CALENDAR CELLS                                 */
  /* ------------------------------------------------------------------------ */

  const cells = useMemo(() => {
    const firstDay =
      new Date(
        year,
        month,
        1
      ).getDay();

    const daysInMonth =
      new Date(
        year,
        month + 1,
        0
      ).getDate();

    return [
      ...Array(firstDay).fill(
        null
      ),

      ...Array.from(
        {
          length: daysInMonth,
        },

        (_, index) =>
          index + 1
      ),
    ];
  }, [year, month]);

  /* ------------------------------------------------------------------------ */
  /*                             MONTH STATS                                  */
  /* ------------------------------------------------------------------------ */

  const monthStats =
    useMemo(() => {
      const daysInMonth =
        new Date(
          year,
          month + 1,
          0
        ).getDate();

      let logged = 0;

      for (
        let day = 1;
        day <= daysInMonth;
        day++
      ) {
        const key =
          toDateKey(
            year,
            month,
            day
          );

        if (entries?.[key]) {
          logged += 1;
        }
      }

      const completion =
        Math.min(
          Math.round(
            (logged /
              daysInMonth) *
              100
          ),
          100
        );

      return {
        logged,
        daysInMonth,
        completion,
      };
    }, [
      entries,
      year,
      month,
    ]);

  /* ------------------------------------------------------------------------ */
  /*                                  STREAK                                  */
  /* ------------------------------------------------------------------------ */

  const streak = useMemo(() => {
    let count = 0;

    const cursor =
      new Date();

    while (true) {
      const key =
        toDateKey(
          cursor.getFullYear(),
          cursor.getMonth(),
          cursor.getDate()
        );

      if (entries?.[key]) {
        count += 1;

        cursor.setDate(
          cursor.getDate() -
            1
        );
      } else {
        break;
      }
    }

    return count;
  }, [entries]);

  /* ------------------------------------------------------------------------ */
  /*                            CHANGE MONTH                                  */
  /* ------------------------------------------------------------------------ */

  const changeMonth = (
    offset
  ) => {
    Haptics.selectionAsync().catch(
      () => {}
    );

    arrowScale.value =
      withSequence(
        withTiming(0.85, {
          duration: 90,
        }),

        withTiming(1, {
          duration: 140,

          easing:
            Easing.out(
              Easing.ease
            ),
        })
      );

    LayoutAnimation.configureNext(
      LayoutAnimation.Presets
        .easeInEaseOut
    );

    setViewDate(
      new Date(
        year,
        month + offset,
        1
      )
    );
  };

  /* ------------------------------------------------------------------------ */
  /*                              GO TO TODAY                                 */
  /* ------------------------------------------------------------------------ */

  const jumpToToday = () => {
    Haptics.selectionAsync().catch(
      () => {}
    );

    LayoutAnimation.configureNext(
      LayoutAnimation.Presets
        .easeInEaseOut
    );

    setViewDate(
      new Date()
    );
  };

  /* ------------------------------------------------------------------------ */
  /*                              ANIMATIONS                                  */
  /* ------------------------------------------------------------------------ */

  const arrowAnimatedStyle =
    useAnimatedStyle(() => ({
      transform: [
        {
          scale:
            arrowScale.value,
        },
      ],
    }));

  const noticeAnimatedStyle =
    useAnimatedStyle(() => ({
      opacity:
        noticeOpacity.value,
    }));

  /* ------------------------------------------------------------------------ */
  /*                           LOCKED DAY MESSAGE                             */
  /* ------------------------------------------------------------------------ */

  const showLockedNotice = () => {
    setLockedNotice(true);

    noticeOpacity.value =
      withSequence(
        withTiming(1, {
          duration: 180,
        }),

        withTiming(1, {
          duration: 900,
        }),

        withTiming(0, {
          duration: 350,
        })
      );

    setTimeout(
      () =>
        setLockedNotice(
          false
        ),
      1500
    );
  };

  /* ------------------------------------------------------------------------ */
  /*                               DAY PRESS                                  */
  /* ------------------------------------------------------------------------ */

  const handleDayPress =
    useCallback(
      (day) => {
        if (!day) return;

        const dateKey =
          toDateKey(
            year,
            month,
            day
          );

        if (
          dateKey >
          todayKey
        ) {
          Haptics.notificationAsync(
            Haptics
              .NotificationFeedbackType
              .Warning
          ).catch(() => {});

          showLockedNotice();

          return;
        }

        Haptics.selectionAsync().catch(
          () => {}
        );

        setSelectedDate({
          day,
          dateKey,
        });

        setModalVisible(true);
      },
      [
        year,
        month,
        todayKey,
      ]
    );

  /* ------------------------------------------------------------------------ */
  /*                            MOOD FILTER                                   */
  /* ------------------------------------------------------------------------ */

  const toggleMoodFilter = (
    key
  ) => {
    Haptics.selectionAsync().catch(
      () => {}
    );

    setHighlightMood(
      (previous) =>
        previous === key
          ? null
          : key
    );
  };

  /* ------------------------------------------------------------------------ */
  /*                                  LOADING                                 */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: () => (
              <CalendarHeader />
            ),

            headerShadowVisible:
              false,

            headerStyle: {
              backgroundColor:
                studentColors.background,
            },

            headerTintColor:
              studentColors.primary,

            headerTitleAlign:
              "left",
          }}
        />

        <SafeAreaView
          edges={[
            "left",
            "right",
            "bottom",
          ]}
          className="
            flex-1
            items-center
            justify-center
            bg-app-background
          "
        >
          <View
            className="
              w-[72px]
              h-[72px]
              rounded-[24px]
              bg-app-primarySoft
              items-center
              justify-center
              mb-4
            "
          >
            <Ionicons
              name="sparkles-outline"
              size={27}
              color={
                studentColors.primary
              }
            />
          </View>

          <Text
            className="
              text-body
              font-semibold
              text-app-textPrimary
            "
          >
            Loading your
            reflections…
          </Text>

          <Text
            className="
              text-caption
              text-app-textSecondary
              mt-1.5
            "
          >
            Gathering your mood
            journey
          </Text>
        </SafeAreaView>
      </>
    );
  }

  const moodOrder =
    MOOD_CONFIG.MOOD_ORDER ||
    Object.keys(
      MOOD_CONFIG
    );

  /* ------------------------------------------------------------------------ */
  /*                                  SCREEN                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      {/* ================================================================ */}
      {/* STACK HEADER                                                     */}
      {/* ================================================================ */}

      <Stack.Screen
        options={{
          headerTitle: () => (
            <CalendarHeader />
          ),

          headerShadowVisible:
            false,

          headerStyle: {
            backgroundColor:
              studentColors.background,
          },

          headerTintColor:
            studentColors.primary,

          headerTitleAlign:
            "left",
        }}
      />

      {/* ================================================================ */}
      {/* SCREEN CONTENT                                                   */}
      {/* ================================================================ */}

      <SafeAreaView
        edges={[
          "left",
          "right",
          "bottom",
        ]}
        className="
          flex-1
          bg-app-background
        "
      >
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          className="
            flex-1
            bg-app-background
          "
          contentContainerStyle={{
            paddingHorizontal: spacing.screen,
            paddingTop: spacing.md,
            paddingBottom: spacing.xxxl + spacing.xs,
          }}
        >
          {/* ============================================================ */}
          {/* INTRO                                                        */}
          {/* ============================================================ */}

          <View className="mb-5">
            <Text
              className="
                text-caption
                font-bold
                tracking-[1px]
                text-app-primary
                uppercase
              "
            >
              Daily reflections
            </Text>
          </View>

          {/* ============================================================ */}
          {/* MONTH NAVIGATOR                                              */}
          {/* ============================================================ */}

          <View
            className="
              flex-row
              items-center
              justify-between
              bg-app-surface
              rounded-[24px]
              px-3
              py-3
              mb-4
              border
              border-app-border
              shadow-sm
            "
          >
            {/* Previous */}

            <Animated.View
              style={
                arrowAnimatedStyle
              }
            >
              <TouchableOpacity
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                onPress={() =>
                  changeMonth(-1)
                }
                className="
                  w-11
                  h-11
                  rounded-2xl
                  bg-app-primarySoft
                  items-center
                  justify-center
                "
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={
                    studentColors.primary
                  }
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Month */}

            <TouchableOpacity
              disabled={
                isCurrentMonth
              }
              activeOpacity={0.7}
              onPress={
                jumpToToday
              }
              accessibilityRole="button"
              accessibilityLabel={isCurrentMonth ? `${MONTH_NAMES[month]} ${year}` : "Return to current month"}
              className="
                flex-1
                items-center
                px-2
              "
            >
              <Text
                className="
                  text-subtitle
                  font-extrabold
                  text-app-textPrimary
                "
              >
                {
                  MONTH_NAMES[
                    month
                  ]
                }{" "}
                {year}
              </Text>

              <View className="h-4 justify-center">
                {!isCurrentMonth && (
                  <Text
                    className="
                      text-caption
                      font-semibold
                      text-app-primary
                    "
                  >
                    Tap to return
                    to today
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Next */}

            <Animated.View
              style={
                arrowAnimatedStyle
              }
            >
              <TouchableOpacity
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Next month"
                onPress={() =>
                  changeMonth(1)
                }
                className="
                  w-11
                  h-11
                  rounded-2xl
                  bg-app-primarySoft
                  items-center
                  justify-center
                "
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={
                    studentColors.primary
                  }
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* ============================================================ */}
          {/* STATS                                                        */}
          {/* ============================================================ */}

          <View className="flex-row gap-3 mb-4">
            {/* Streak */}

            <View
              className="
                flex-1
                bg-app-surface
                rounded-[22px]
                border
                border-app-border
                p-4
              "
            >
              <View
                className="
                  w-9
                  h-9
                  rounded-xl
                  bg-app-accentSoft
                  items-center
                  justify-center
                  mb-3
                "
              >
                <Ionicons
                  name="flame-outline"
                  size={19}
                  color={
                    studentColors.accent
                  }
                />
              </View>

              <View className="flex-row items-end">
                <Text
                  className="
                    text-[26px]
                    font-extrabold
                    text-app-accent
                  "
                >
                  {streak}
                </Text>

                <Text
                  className="
                    text-caption
                    mb-1
                    ml-1
                    text-app-textSecondary
                  "
                >
                  days
                </Text>
              </View>

              <Text
                className="
                  text-caption
                  font-semibold
                  text-app-textPrimary
                  mt-1
                "
              >
                Current streak
              </Text>
            </View>

            {/* Completion */}

            <View
              className="
                flex-1
                bg-app-surface
                rounded-[22px]
                border
                border-app-border
                p-4
              "
            >
              <View
                className="
                  w-9
                  h-9
                  rounded-xl
                  bg-app-primarySoft
                  items-center
                  justify-center
                  mb-3
                "
              >
                <Ionicons
                  name="analytics-outline"
                  size={19}
                  color={
                    studentColors.primary
                  }
                />
              </View>

              <Text
                className="
                  text-[26px]
                  font-extrabold
                  text-app-primary
                "
              >
                {
                  monthStats.completion
                }
                %
              </Text>

              <Text
                className="
                  text-caption
                  font-semibold
                  text-app-textPrimary
                  mt-1
                "
              >
                Monthly check-ins
              </Text>

              {/* progress */}

              <View
                className="
                  h-1.5
                  mt-3
                  rounded-full
                  overflow-hidden
                  bg-app-primarySoft
                "
              >
                <View
                  className="
                    h-full
                    bg-app-primary
                    rounded-full
                  "
                  style={{
                    width: `${monthStats.completion}%`,
                  }}
                />
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* LOCKED DAY NOTICE                                            */}
          {/* ============================================================ */}

          {lockedNotice && (
            <Animated.View
              style={
                noticeAnimatedStyle
              }
              className="
                flex-row
                items-center
                bg-app-primarySoft
                border
                border-app-primaryLight
                rounded-2xl
                px-4
                py-3
                mb-4
              "
            >
              <View
                className="
                  w-8
                  h-8
                  rounded-full
                  bg-app-surface
                  items-center
                  justify-center
                  mr-3
                "
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={15}
                  color={
                    studentColors.primary
                  }
                />
              </View>

              <Text
                className="
                  flex-1
                  text-caption
                  leading-[17px]
                  text-app-textSecondary
                "
              >
                {"That day hasn't arrived yet. One moment at a time."}
              </Text>
            </Animated.View>
          )}

          {/* ============================================================ */}
          {/* CALENDAR CARD                                                */}
          {/* ============================================================ */}

          <View
            className="
              bg-app-surface
              rounded-[26px]
              border
              border-app-border
              px-3
              pt-5
              pb-4
              mb-5
              shadow-sm
            "
          >
            {/* Weekday labels */}

            <View className="flex-row mb-3">
              {DAY_LABELS.map(
                (label) => (
                  <Text
                    key={label}
                    className="
                      flex-1
                      text-center
                      text-caption
                      font-extrabold
                      text-app-textMuted
                    "
                  >
                    {label}
                  </Text>
                )
              )}
            </View>

            {/* Calendar */}

            <View className="flex-row flex-wrap">
              {cells.map(
                (
                  day,
                  index
                ) => {
                  const dateKey =
                    day
                      ? toDateKey(
                          year,
                          month,
                          day
                        )
                      : null;

                  const entry =
                    dateKey &&
                    entries &&
                    typeof entries ===
                      "object"
                      ? entries[
                          dateKey
                        ]
                      : null;

                  const isDimmed =
                    !!highlightMood &&
                    !!entry &&
                    entry.mood &&
                    entry.mood !==
                      highlightMood;

                  return (
                    <CalendarDay
                      key={
                        dateKey ||
                        `empty-${index}`
                      }
                      day={day}
                      isToday={
                        dateKey ===
                        todayKey
                      }
                      isLocked={
                        dateKey
                          ? dateKey >
                            todayKey
                          : false
                      }
                      entry={
                        entry
                      }
                      dimmed={
                        isDimmed
                      }
                      onPress={
                        handleDayPress
                      }
                    />
                  );
                }
              )}
            </View>

            {/* Calendar helper */}

            <View
              className="
                flex-row
                items-center
                justify-center
                mt-3
              "
            >
              <Ionicons
                name="information-circle-outline"
                size={13}
                color={
                  studentColors.textSecondary
                }
              />

              <Text
                className="
                  text-caption
                  text-app-textSecondary
                  ml-1
                "
              >
                Tap a day to view
                or update your
                reflection
              </Text>
            </View>
          </View>

          {/* ============================================================ */}
          {/* EMPTY STATE                                                  */}
          {/* ============================================================ */}

          {monthStats.logged ===
            0 && (
            <View
              className="
                bg-app-primarySoft
                rounded-[24px]
                p-5
                mb-5
                border
                border-app-primaryLight
              "
            >
              <View className="flex-row items-center">
                <View
                  className="
                    w-12
                    h-12
                    rounded-2xl
                    bg-app-surface
                    items-center
                    justify-center
                    mr-3.5
                  "
                >
                  <Ionicons
                    name="heart-outline"
                    size={22}
                    color={
                      studentColors.primary
                    }
                  />
                </View>

                <View className="flex-1">
                  <Text
                    className="
                      text-body
                      font-bold
                      text-app-textPrimary
                    "
                  >
                    No check-ins
                    yet this month
                  </Text>

                  <Text
                    className="
                      text-caption
                      leading-4
                      text-app-textSecondary
                      mt-1
                    "
                  >
                    {"Tap today's date whenever you're ready to record how you feel."}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* MOOD GUIDE                                                   */}
          {/* ============================================================ */}

          <View
            className="
              bg-app-surface
              rounded-[26px]
              border
              border-app-border
              px-4
              pt-5
              pb-5
              shadow-sm
            "
          >
            <View className="items-center mb-5">
              <View
                className="
                  flex-row
                  items-center
                  bg-app-primarySoft
                  px-3
                  py-1.5
                  rounded-full
                  mb-2
                "
              >
                <Ionicons
                  name="sparkles-outline"
                  size={12}
                  color={
                    studentColors.primary
                  }
                />

                <Text
                  className="
                    text-caption
                    font-extrabold
                    text-app-primary
                    tracking-[1px]
                    ml-1.5
                    uppercase
                  "
                >
                  Mood guide
                </Text>
              </View>

              <Text
                className="
                  text-body-lg
                  font-extrabold
                  text-app-textPrimary
                "
              >
                Explore your mood
                patterns
              </Text>

              <Text
                className="
                  text-caption
                  text-app-textSecondary
                  mt-1
                "
              >
                Tap a mood to
                highlight matching
                days
              </Text>
            </View>

            {/* Mood filters */}

            <View className="flex-row justify-between">
              {moodOrder.map(
                (key) => {
                  const item =
                    MOOD_CONFIG[
                      key
                    ];

                  if (!item) {
                    return null;
                  }

                  const isActive =
                    highlightMood ===
                    key;

                  const isDimmedLegend =
                    !!highlightMood &&
                    !isActive;

                  return (
                    <TouchableOpacity
                      key={key}
                      activeOpacity={
                        0.75
                      }
                      onPress={() =>
                        toggleMoodFilter(
                          key
                        )
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Filter by ${item.label}`}
                      accessibilityState={{ selected: isActive }}
                      className="
                        flex-1
                        items-center
                      "
                      style={{
                        opacity:
                          isDimmedLegend
                            ? 0.35
                            : 1,
                      }}
                    >
                      {/* Mood icon */}

                      <View
                        className="
                          w-12
                          h-12
                          rounded-2xl
                          items-center
                          justify-center
                          mb-2
                        "
                        style={{
                          backgroundColor:
                            item.color
                              ? `${item.color}15`
                              : studentColors.primarySoft,

                          borderWidth:
                            isActive
                              ? 1.5
                              : 0,

                          borderColor:
                            item.color ||
                            studentColors.primary,
                        }}
                      >
                        <Image
                          source={
                            item.icon
                          }
                          className="w-[27px] h-[27px]"
                          contentFit="contain"
                        />
                      </View>

                      <Text
                        className="
                          text-caption
                          font-bold
                          text-app-textPrimary
                        "
                      >
                        {item.label}
                      </Text>

                      <Text
                        className="
                          text-caption
                          font-extrabold
                          uppercase
                          mt-0.5
                        "
                        style={{
                          color:
                            item.color ||
                            studentColors.textSecondary,
                        }}
                      >
                        Lv.{" "}
                        {
                          item.stress
                        }
                      </Text>

                      {/* active indicator */}

                      {isActive && (
                        <View
                          className="
                            w-1.5
                            h-1.5
                            rounded-full
                            mt-1.5
                          "
                          style={{
                            backgroundColor:
                              item.color ||
                              studentColors.primary,
                          }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
          </View>
        </ScrollView>

        {/* ================================================================ */}
        {/* MOOD ENTRY MODAL                                                 */}
        {/* ================================================================ */}

        {selectedDate && (
          <MoodEntryModal
            visible={
              modalVisible
            }
            dateKey={
              selectedDate.dateKey
            }
            existingEntry={
              entries
                ? entries[
                    selectedDate
                      .dateKey
                  ]
                : null
            }
            onClose={() =>
              setModalVisible(
                false
              )
            }
            onSave={
              saveEntry
            }
            onDelete={
              deleteEntry
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}
