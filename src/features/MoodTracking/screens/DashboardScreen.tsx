import { icons } from "@/src/shared/assets/icons/icons";
import { moods, WELLNESS_MESSAGES } from "@/src/shared/constants/mood.config";
import { Stack, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { calculateAverageDayStressLevel } from "../hooks/calculateAverageDayStressLevel";
import { fetchMoodFromDb } from "../services/fetchFromDb";
import { db } from "@/src/config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PulsingMoodButton } from "./PulsingCheckInBorder";
import { calmColors, commonColors, spacing, typography } from "@/src/theme";

/* -------------------------------------------------------------------------- */
/*                                  MOOD MAP                                  */
/* -------------------------------------------------------------------------- */

const STATUS_TO_MOOD_ID: Record<string, string> = {
  awful: "Awful",
  bad: "Bad",
  neutral: "Meh",
  good: "Good",
  great: "Great",
};

const MOOD_MESSAGES: Record<string, string> = {
  Awful: "A gentle moment for yourself may help you feel a little lighter.",
  Bad: "Small steps of self-care can make a meaningful difference.",
  Meh: "Take a moment to notice what you need right now.",
  Good: "Let's build on this positive feeling with a mindful activity.",
  Great: "Keep this positive momentum going with a wellness activity.",
};

/* -------------------------------------------------------------------------- */
/*                                   HEADER                                   */
/* -------------------------------------------------------------------------- */

const DashboardHeader = React.memo(function DashboardHeader({
  onProfilePress,
}: {
  onProfilePress: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
      {/* App mark */}
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{
          backgroundColor: calmColors.surface,
          borderWidth: 1,
          borderColor: calmColors.border,
        }}
      >
        <View
          style={{
            width: 11,
            height: 11,
            borderRadius: 2,
            backgroundColor: calmColors.primaryDark,
            transform: [{ rotate: "45deg" }],
          }}
        />
      </View>

      <View className="flex-row items-center gap-3">
        {/* Notification */}
        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{
            backgroundColor: calmColors.surface,
            borderWidth: 1,
            borderColor: calmColors.border,
          }}
        >
          <Image
            source={icons.notification}
            className="w-5 h-5"
            style={{ tintColor: calmColors.textPrimary }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Profile */}
        <View className="relative">
          <TouchableOpacity
            onPress={onProfilePress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open profile menu"
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{
              backgroundColor: calmColors.surface,
              borderWidth: 1,
              borderColor: calmColors.border,
            }}
          >
            <Image
              source={icons.profile}
              className="w-7 h-7"
              style={{ tintColor: calmColors.textPrimary }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View
            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-calm-surface"
            style={{ backgroundColor: calmColors.success }}
          />
        </View>
      </View>
    </View>
  );
});

/* -------------------------------------------------------------------------- */
/*                               DECORATION                                   */
/* -------------------------------------------------------------------------- */

const HeroDecoration = () => {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        right: -24,
        bottom: -30,
        width: 175,
        height: 175,
      }}
    >
      {/* Big soft decorative circle */}
      <View
        style={{
          position: "absolute",
          width: 170,
          height: 170,
          borderRadius: 85,
          backgroundColor: calmColors.primarySoft,
          opacity: 0.75,
        }}
      />

      {/* Simple leaf decorations */}
      <View
        style={{
          position: "absolute",
          width: 16,
          height: 55,
          borderRadius: 20,
          backgroundColor: calmColors.successSoft,
          right: 42,
          bottom: 20,
          transform: [{ rotate: "28deg" }],
          opacity: 0.85,
        }}
      />

      <View
        style={{
          position: "absolute",
          width: 14,
          height: 47,
          borderRadius: 20,
          backgroundColor: calmColors.successSoft,
          right: 72,
          bottom: 14,
          transform: [{ rotate: "-20deg" }],
          opacity: 0.9,
        }}
      />

      <View
        style={{
          position: "absolute",
          width: 10,
          height: 60,
          borderRadius: 20,
          backgroundColor: calmColors.primary,
          right: 98,
          bottom: 30,
          transform: [{ rotate: "10deg" }],
          opacity: 0.75,
        }}
      />
    </View>
  );
};

const getStressAccent = (percentage: number) => {
  if (percentage <= 30) {
    return {
      color: calmColors.success,
      backgroundColor: calmColors.successSoft,
      heroBackgroundColor: calmColors.successSoft,
    };
  }

  if (percentage <= 60) {
    return {
      color: calmColors.primaryDark,
      backgroundColor: calmColors.primarySoft,
      heroBackgroundColor: calmColors.primaryVerySoft,
    };
  }

  return {
    color: calmColors.error,
    backgroundColor: calmColors.errorSoft,
    heroBackgroundColor: calmColors.errorSoft,
  };
};

/* -------------------------------------------------------------------------- */
/*                              DASHBOARD SCREEN                              */
/* -------------------------------------------------------------------------- */

const DashboardScreen = () => {
  const router = useRouter();

  const [, setMoodAverage] = useState<number>(5);
  const [, setWeeklyProgress] = useState<number>(0);

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [stressPercentage, setStressPercentage] = useState<number | null>(null);

  const [userName, setUserName] = useState<string>("");
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const auth = getAuth();

  const userID = auth.currentUser;
  const userId = userID ? userID.uid : null;

  const currentMoodObj = moods.find((mood) => mood.id === selectedMood);

  const wellnessMessage = selectedMood
    ? WELLNESS_MESSAGES[selectedMood]
    : null;

  const stressAccent = stressPercentage !== null
    ? getStressAccent(stressPercentage)
    : null;

  const handleGoToWellness = () => {
    if (!selectedMood) return;

    router.push({
      pathname: "/(tabs)/(Recommendation)/Recommendations",
      params: {
        mood: selectedMood,
      },
    });
  };

  /* ------------------------------------------------------------------------ */
  /*                                  LOGOUT                                  */
  /* ------------------------------------------------------------------------ */

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setShowProfilePopup(false);
      router.replace("/Route/login");
    } catch {
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                               LOAD DATA                                  */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    loadMoodData();
    loadCurrentMood();
  }, []);

  async function loadCurrentMood() {
    try {
      if (!userId) return;

      const userSnap = await getDoc(doc(db, "users", userId));

      if (userSnap.exists()) {
        const data = userSnap.data();

        const status = data.currentMoodStatus;

        if (status && STATUS_TO_MOOD_ID[status]) {
          setSelectedMood(STATUS_TO_MOOD_ID[status]);
        }

        if (data.name) {
          setUserName(data.name);
        }

        const currentStress = Number(data.currentStressLevel);

        setStressPercentage(
          Number.isFinite(currentStress)
            ? Math.round(
                Math.min(10, Math.max(0, currentStress)) * 10
              )
            : null
        );
      } else {
        setStressPercentage(null);
      }
    } catch (error) {
      setStressPercentage(null);
      console.error("Failed to load current mood status:", error);
    }
  }

  async function loadMoodData(): Promise<void> {
    try {
      if (!userId) return;

      const userMoods = await fetchMoodFromDb(userId);

      if (userMoods) {
        const avg = await calculateAverageDayStressLevel(userMoods);

        if (typeof avg === "number" && !isNaN(avg)) {
          const clampedStress = Math.min(Math.max(avg, 1), 10);

          const convertedMoodRating =
            5 - (clampedStress - 1) * (4 / 9);

          setMoodAverage(convertedMoodRating);
        }

        const loggedDays = Array.isArray(userMoods)
          ? userMoods.length
          : 0;

        setWeeklyProgress(
          Math.min(Math.round((loggedDays / 7) * 100), 100)
        );
      }
    } catch (error) {
      console.error("Failed to load mood data:", error);
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                                 SCREEN                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <DashboardHeader
              onProfilePress={() => setShowProfilePopup(true)}
            />
          ),
          headerBackVisible: false,
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: calmColors.background,
          },
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          backgroundColor: calmColors.background,
        }}
      >
        <ScrollView
        className="mt-[-20px]"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: spacing.xxl,
          }}
          style={{
            backgroundColor: calmColors.background,
          }}
        >
          {/* ================================================================ */}
          {/* HERO SECTION                                                     */}
          {/* ================================================================ */}

          <View className="px-5 pt-5">
            <View
              style={{
                backgroundColor:
                  stressAccent?.heroBackgroundColor ||
                  calmColors.primaryVerySoft,
                borderRadius: 32,
                paddingHorizontal: 24,
                paddingVertical: 28,
                minHeight: 275,
                overflow: "hidden",
              }}
            >
              <HeroDecoration />

              <View className="mb-5 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Text
                    style={{
                      color: calmColors.primary,
                      fontSize: typography.fontSize.caption,
                      fontWeight: typography.fontWeight.bold,
                      letterSpacing: typography.letterSpacing.wide,
                    }}
                  >
                    DAILY REFLECTION
                  </Text>

                  <Text
                    style={{
                      color: calmColors.primary,
                      marginLeft: 7,
                      fontSize: 16,
                    }}
                  >
                    ✦
                  </Text>
                </View>

                {stressPercentage !== null && stressAccent && (
                    <Animated.View
                      entering={FadeInDown.duration(260)}
                      accessibilityRole="progressbar"
                      accessibilityLabel="Current stress level"
                      accessibilityValue={{
                        min: 0,
                        max: 100,
                        now: stressPercentage,
                        text: `${stressPercentage} percent`,
                      }}
                      className="flex-row items-center rounded-full border border-calm-surface px-3 py-2"
                      style={{
                        backgroundColor: stressAccent.backgroundColor,
                      }}
                    >
                      <View
                        className="mr-2 h-7 w-7 items-center justify-center rounded-full bg-calm-surface"
                      >
                        <Ionicons
                          name="pulse"
                          size={15}
                          color={stressAccent.color}
                        />
                      </View>

                      <View>
                        <Text
                          className="text-caption font-extrabold"
                          style={{ color: stressAccent.color }}
                        >
                          {stressPercentage}%
                        </Text>
                        <Text className="text-caption font-semibold text-calm-textSecondary">
                          current stress
                        </Text>
                      </View>
                    </Animated.View>
                )}
              </View>

              <View style={{ maxWidth: "72%" }}>

                <Text
                  style={{
                    color: calmColors.textPrimary,
                    fontSize: typography.fontSize.heading,
                    fontWeight: typography.fontWeight.medium,
                    marginBottom: 17,
                  }}
                >
                  Hello, {userName || "there"}
                </Text>

                <Text
                  style={{
                    color: calmColors.textPrimary,
                    fontSize: typography.fontSize.display,
                    lineHeight: typography.lineHeight.display,
                    fontWeight: typography.fontWeight.bold,
                    letterSpacing: typography.letterSpacing.tight,
                  }}
                >
                  How are you{"\n"}feeling today?
                </Text>

                <Text
                  style={{
                    color: calmColors.textSecondary,
                    fontSize: typography.fontSize.bodyLarge,
                    lineHeight: typography.lineHeight.bodyLarge,
                    marginTop: 17,
                    maxWidth: 210,
                  }}
                >
                  Take a moment to check in with yourself.
                </Text>
              </View>
            </View>
          </View>

          {/* ================================================================ */}
          {/* MOOD QUESTION                                                    */}
          {/* ================================================================ */}

          <View className="px-5 mt-7">
            <Text
              style={{
                textAlign: "center",
                color: calmColors.primary,
                fontSize: typography.fontSize.bodyLarge,
                fontWeight: typography.fontWeight.bold,
                marginBottom: 18,
              }}
            >
              How would you describe your mood?
            </Text>

            {/* ============================================================== */}
            {/* MOOD PICKER                                                    */}
            {/* ============================================================== */}

            <View className="flex-row justify-between">
              {moods.map((mood) => {
                const isSelected = selectedMood === mood.id;

                return (
                  <TouchableOpacity
                    key={mood.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedMood(mood.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${mood.label} mood`}
                    accessibilityState={{ selected: isSelected }}
                    style={{
                      alignItems: "center",
                      width: "19%",
                    }}
                  >
                    <View
                      style={{
                        width: 62,
                        height: 72,
                        borderRadius: 21,

                        justifyContent: "center",
                        alignItems: "center",

                        backgroundColor: isSelected
                          ? calmColors.primarySoft
                          : calmColors.surface,

                        borderWidth: isSelected ? 1.5 : 1,

                        borderColor: isSelected
                          ? calmColors.primary
                          : calmColors.border,

                        shadowColor: commonColors.shadow,
                        shadowOpacity: isSelected ? 0.1 : 0.035,
                        shadowRadius: isSelected ? 9 : 5,
                        shadowOffset: {
                          width: 0,
                          height: isSelected ? 4 : 2,
                        },

                        elevation: isSelected ? 3 : 1,
                      }}
                    >
                      <Image
                        source={
                          isSelected
                            ? mood.icon
                            : mood.outline
                        }
                        style={{
                          width: 34,
                          height: 34,
                        }}
                        resizeMode="contain"
                      />
                    </View>

                    <Text
                      style={{
                        marginTop: 7,
                        fontSize: typography.fontSize.caption,
                        color: isSelected
                          ? calmColors.primaryDark
                          : calmColors.textSecondary,

                        fontWeight: isSelected
                          ? typography.fontWeight.bold
                          : typography.fontWeight.medium,
                      }}
                    >
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ================================================================ */}
          {/* SELECTED MOOD CARD                                               */}
          {/* ================================================================ */}

          {selectedMood && (
            <View className="px-5 mt-8">
              <View
                style={{
                  backgroundColor: calmColors.surface,
                  borderRadius: 30,

                  paddingHorizontal: 24,
                  paddingTop: 26,
                  paddingBottom: 27,

                  alignItems: "center",

                  borderWidth: 1,
                  borderColor: calmColors.border,

                  shadowColor: commonColors.shadow,
                  shadowOpacity: 0.055,
                  shadowRadius: 18,
                  shadowOffset: {
                    width: 0,
                    height: 7,
                  },

                  elevation: 2,
                }}
              >
                {/* Decorative heading */}

                <Text
                  style={{
                    color: calmColors.primary,
                    fontSize: typography.fontSize.caption,
                    fontWeight: typography.fontWeight.bold,
                    letterSpacing: typography.letterSpacing.wide,
                    marginBottom: 22,
                  }}
                >
                  YOUR MOOD TODAY
                </Text>

                {/* Mood icon */}

                <View
                  style={{
                    width: 112,
                    height: 112,
                    borderRadius: 56,

                    justifyContent: "center",
                    alignItems: "center",

                    backgroundColor: calmColors.primaryVerySoft,
                    marginBottom: 18,
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      width: 92,
                      height: 92,
                      borderRadius: 46,
                      borderWidth: 1,
                      borderColor: calmColors.primarySoft,
                    }}
                  />

                  <PulsingMoodButton
                    moodId={selectedMood}
                    active={true}
                  >
                    <TouchableOpacity
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel="Continue mood check-in"
                      onPress={() =>
                        router.push(
                          `/(tabs)/(mood)/moodCheckIn?selectedMood=${selectedMood}`
                        )
                      }
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 36,

                        backgroundColor: calmColors.surface,

                        justifyContent: "center",
                        alignItems: "center",

                        shadowColor: commonColors.shadow,
                        shadowOpacity: 0.09,
                        shadowRadius: 10,
                        shadowOffset: {
                          width: 0,
                          height: 4,
                        },

                        elevation: 2,
                      }}
                    >
                      <Image
                        source={currentMoodObj?.icon}
                        style={{
                          width: 48,
                          height: 48,
                        }}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  </PulsingMoodButton>
                </View>

                {/* Mood text */}

                <Text
                  style={{
                    color: calmColors.textPrimary,
                    fontSize: typography.fontSize.title,
                    fontWeight: typography.fontWeight.bold,
                    textAlign: "center",
                  }}
                >
                  {"You're feeling "}
                  <Text
                    style={{
                      color:
                        selectedMood === "Great" ||
                        selectedMood === "Good"
                          ? calmColors.success
                          : calmColors.primary,
                    }}
                  >
                    {selectedMood}
                  </Text>{" "}
                  today
                </Text>

                <Text
                  style={{
                    color: calmColors.textSecondary,
                    fontSize: typography.fontSize.body,
                    lineHeight: typography.lineHeight.body,
                    textAlign: "center",
                    maxWidth: 295,
                    marginTop: 9,
                  }}
                >
                  {MOOD_MESSAGES[selectedMood]}
                </Text>

                {/* CONTINUE MOOD CHECK-IN */}

                {/* <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push(
                      `/(tabs)/(mood)/moodCheckIn?selectedMood=${selectedMood}`
                    )
                  }
                  style={{
                    width: "100%",
                    height: 50,
                    marginTop: 23,
                    borderRadius: 18,
                    backgroundColor: calmColors.primary,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: calmColors.primaryDark,
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    shadowOffset: {
                      width: 0,
                      height: 4,
                    },
                  }}
                >
                  <Text
                    style={{
                      color: commonColors.white,
                      fontSize: typography.fontSize.bodyLarge,
                      fontWeight: typography.fontWeight.bold,
                    }}
                  >
                    Continue check-in
                  </Text>

                  <Text
                    style={{
                      color: commonColors.white,
                      fontSize: 21,
                      marginLeft: 8,
                      marginTop: -2,
                    }}
                  >
                    ›
                  </Text>
                </TouchableOpacity> */}

                {/* WELLNESS RECOMMENDATION */}

                {wellnessMessage && (
                  <View
                    style={{
                      width: "100%",
                      marginTop: 16,
                      backgroundColor: calmColors.primaryVerySoft,
                      borderRadius: 22,
                      paddingHorizontal: 18,
                      paddingVertical: 18,
                      borderWidth: 1,
                      borderColor: calmColors.primarySoft,
                    }}
                  >
                    {/* top badge */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        alignSelf: "flex-start",
                        backgroundColor: calmColors.primarySoft,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 20,
                        marginBottom: 11,
                      }}
                    >
                      <Text style={{ fontSize: typography.fontSize.caption, marginRight: 5 }}>✦</Text>
                      <Text
                        style={{
                          color: calmColors.primaryDark,
                          fontSize: typography.fontSize.caption,
                          fontWeight: typography.fontWeight.bold,
                          letterSpacing: typography.letterSpacing.label,
                        }}
                      >
                        FOR YOUR {selectedMood.toUpperCase()} MOOD
                      </Text>
                    </View>

                    {/* title */}
                    <Text
                      style={{
                        color: calmColors.textPrimary,
                        fontSize: typography.fontSize.subtitle,
                        lineHeight: typography.lineHeight.subtitle,
                        fontWeight: typography.fontWeight.bold,
                      }}
                    >
                      {wellnessMessage.title}
                    </Text>

                    {/* description */}
                    <Text
                      style={{
                        color: calmColors.textSecondary,
                        fontSize: typography.fontSize.bodySmall,
                        lineHeight: typography.lineHeight.bodySmall,
                        marginTop: 6,
                        marginBottom: 15,
                      }}
                    >
                      {wellnessMessage.subtitle}
                    </Text>

                    {/* Wellness button */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleGoToWellness}
                      accessibilityRole="button"
                      style={{
                        height: 46,
                        borderRadius: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 16,
                        backgroundColor: calmColors.surface,
                        borderWidth: 1,
                        borderColor: calmColors.primarySoft,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        <View
                          style={{
                            width: 29,
                            height: 29,
                            borderRadius: 15,
                            backgroundColor: calmColors.primarySoft,
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 10,
                          }}
                        >
                          <Text
                            style={{
                              color: calmColors.primaryDark,
                              fontSize: 15,
                            }}
                          >
                            ♡
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: calmColors.primaryDark,
                            fontSize: typography.fontSize.bodySmall,
                            fontWeight: typography.fontWeight.bold,
                          }}
                        >
                          {wellnessMessage.button}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: calmColors.primaryDark,
                          fontSize: 22,
                        }}
                      >
                        ›
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ==================================================================== */}
      {/* PROFILE POPUP                                                        */}
      {/* ==================================================================== */}

      <Modal
        visible={showProfilePopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfilePopup(false)}
      >
        <Pressable
          className="flex-1 justify-start items-end pt-[60px] pr-4"
          style={{ backgroundColor: commonColors.scrim }}
          onPress={() => setShowProfilePopup(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: 210,
              backgroundColor: calmColors.surface,
              borderRadius: 20,
              overflow: "hidden",

              shadowColor: commonColors.black,
              shadowOpacity: 0.12,
              shadowRadius: 18,
              shadowOffset: {
                width: 0,
                height: 8,
              },

              elevation: 7,
            }}
          >
            {/* Profile info */}

            <View
              className="px-4 py-4"
              style={{
                borderBottomWidth: 1,
                borderBottomColor: calmColors.border,
              }}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className="w-11 h-11 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: calmColors.primaryVerySoft,
                  }}
                >
                  <Image
                    source={icons.profile}
                    className="w-7 h-7"
                    style={{
                      tintColor: calmColors.textPrimary,
                    }}
                    resizeMode="contain"
                  />
                </View>

                <View className="flex-1">
                  <Text
                    numberOfLines={1}
                    style={{
                      color: calmColors.textPrimary,
                      fontWeight: typography.fontWeight.bold,
                      fontSize: typography.fontSize.body,
                    }}
                  >
                    {userName || "User"}
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={{
                      color: calmColors.textSecondary,
                      fontSize: typography.fontSize.caption,
                      marginTop: 2,
                    }}
                  >
                    {auth.currentUser?.email || ""}
                  </Text>
                </View>
              </View>
            </View>

            {/* Logout */}

            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.7}
              accessibilityRole="button"
              className="px-4 py-3.5 flex-row items-center gap-3"
            >
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{
                  backgroundColor: calmColors.accentSoft,
                }}
              >
                <Text
                  style={{
                    color: calmColors.accent,
                    fontWeight: typography.fontWeight.bold,
                  }}
                >
                  →
                </Text>
              </View>

              <Text
                style={{
                  color: calmColors.accent,
                  fontSize: typography.fontSize.body,
                  fontWeight: typography.fontWeight.semiBold,
                }}
              >
                Log Out
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default DashboardScreen;
