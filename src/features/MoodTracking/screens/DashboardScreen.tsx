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
import { PulsingMoodButton } from "./PulsingCheckInBorder";

/* -------------------------------------------------------------------------- */
/*                                COLOR SYSTEM                                */
/* -------------------------------------------------------------------------- */

const colors = {
  background: "#FAF7F4",
  surface: "#FFFFFF",

  // Main calming brand colors
  lavender: "#8D7BB8",
  lavenderDark: "#6F5C9E",
  lavenderSoft: "#EEE9F7",
  lavenderVerySoft: "#F6F2FA",

  // Secondary accent
  peach: "#E88366",
  peachSoft: "#FBE9E3",

  // Positive accent
  green: "#68A765",
  greenSoft: "#EAF4E8",

  text: "#252330",
  textSecondary: "#706A76",
  textLight: "#A29CA7",

  border: "#ECE5E0",
};

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
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View
          style={{
            width: 11,
            height: 11,
            borderRadius: 2,
            backgroundColor: colors.lavenderDark,
            transform: [{ rotate: "45deg" }],
          }}
        />
      </View>

      <View className="flex-row items-center gap-3">
        {/* Notification */}
        <TouchableOpacity
          activeOpacity={0.7}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Image
            source={icons.notification}
            className="w-5 h-5"
            style={{ tintColor: colors.text }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Profile */}
        <View className="relative">
          <TouchableOpacity
            onPress={onProfilePress}
            activeOpacity={0.7}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Image
              source={icons.profile}
              className="w-7 h-7"
              style={{ tintColor: colors.text }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View
            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white"
            style={{ backgroundColor: colors.green }}
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
          backgroundColor: "#E8DEED",
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
          backgroundColor: "#B6C99B",
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
          backgroundColor: "#CAD9B5",
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
          backgroundColor: "#A997CA",
          right: 98,
          bottom: 30,
          transform: [{ rotate: "10deg" }],
          opacity: 0.75,
        }}
      />
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                              DASHBOARD SCREEN                              */
/* -------------------------------------------------------------------------- */

const DashboardScreen = () => {
  const router = useRouter();

  const [moodAverage, setMoodAverage] = useState<number>(5);
  const [weeklyProgress, setWeeklyProgress] = useState<number>(0);

  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const [userName, setUserName] = useState<string>("");
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const auth = getAuth();

  const userID = auth.currentUser;
  const userId = userID ? userID.uid : null;

  const currentMoodObj = moods.find((mood) => mood.id === selectedMood);

  const wellnessMessage = selectedMood
    ? WELLNESS_MESSAGES[selectedMood]
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
    } catch (error) {
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
      }
    } catch (error) {
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
            backgroundColor: colors.background,
          },
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          backgroundColor: colors.background,
        }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 28,
          }}
          style={{
            backgroundColor: colors.background,
          }}
        >
          {/* ================================================================ */}
          {/* HERO SECTION                                                     */}
          {/* ================================================================ */}

          <View className="px-5 pt-5">
            <View
              style={{
                backgroundColor: colors.lavenderVerySoft,
                borderRadius: 32,
                paddingHorizontal: 24,
                paddingVertical: 28,
                minHeight: 275,
                overflow: "hidden",
              }}
            >
              <HeroDecoration />

              <View style={{ maxWidth: "72%" }}>
                <View className="flex-row items-center mb-5">
                  <Text
                    style={{
                      color: colors.lavender,
                      fontSize: 12,
                      fontWeight: "700",
                      letterSpacing: 1.4,
                    }}
                  >
                    DAILY REFLECTION
                  </Text>

                  <Text
                    style={{
                      color: colors.lavender,
                      marginLeft: 7,
                      fontSize: 16,
                    }}
                  >
                    ✦
                  </Text>
                </View>

                <Text
                  style={{
                    color: colors.text,
                    fontSize: 27,
                    fontWeight: "500",
                    marginBottom: 17,
                  }}
                >
                  Hello, {userName || "there"}
                </Text>

                <Text
                  style={{
                    color: colors.text,
                    fontSize: 38,
                    lineHeight: 46,
                    fontWeight: "700",
                    letterSpacing: -1,
                  }}
                >
                  How are you{"\n"}feeling today?
                </Text>

                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 16,
                    lineHeight: 24,
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
                color: colors.lavender,
                fontSize: 15,
                fontWeight: "700",
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
                          ? colors.lavenderSoft
                          : colors.surface,

                        borderWidth: isSelected ? 1.5 : 1,

                        borderColor: isSelected
                          ? colors.lavender
                          : colors.border,

                        shadowColor: "#302838",
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
                        fontSize: 11.5,
                        color: isSelected
                          ? colors.lavenderDark
                          : colors.textSecondary,

                        fontWeight: isSelected
                          ? "700"
                          : "500",
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
                  backgroundColor: colors.surface,
                  borderRadius: 30,

                  paddingHorizontal: 24,
                  paddingTop: 26,
                  paddingBottom: 27,

                  alignItems: "center",

                  borderWidth: 1,
                  borderColor: colors.border,

                  shadowColor: "#302838",
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
                    color: colors.lavender,
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 1.5,
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

                    backgroundColor: colors.lavenderVerySoft,
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
                      borderColor: "#DED5E9",
                    }}
                  />

                  <PulsingMoodButton
                    moodId={selectedMood}
                    active={true}
                  >
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() =>
                        router.push(
                          `/(tabs)/(mood)/moodCheckIn?selectedMood=${selectedMood}`
                        )
                      }
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 36,

                        backgroundColor: colors.surface,

                        justifyContent: "center",
                        alignItems: "center",

                        shadowColor: "#302838",
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
                    color: colors.text,
                    fontSize: 21,
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                >
                  You're feeling{" "}
                  <Text
                    style={{
                      color:
                        selectedMood === "Great" ||
                        selectedMood === "Good"
                          ? colors.green
                          : colors.lavender,
                    }}
                  >
                    {selectedMood}
                  </Text>{" "}
                  today
                </Text>

                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 14,
                    lineHeight: 21,
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
                    backgroundColor: colors.lavender,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: colors.lavenderDark,
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
                      color: "#FFFFFF",
                      fontSize: 15,
                      fontWeight: "700",
                    }}
                  >
                    Continue check-in
                  </Text>

                  <Text
                    style={{
                      color: "#FFFFFF",
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
                      backgroundColor: colors.lavenderVerySoft,
                      borderRadius: 22,
                      paddingHorizontal: 18,
                      paddingVertical: 18,
                      borderWidth: 1,
                      borderColor: "#E8E1F1",
                    }}
                  >
                    {/* top badge */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        alignSelf: "flex-start",
                        backgroundColor: colors.lavenderSoft,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 20,
                        marginBottom: 11,
                      }}
                    >
                      <Text style={{ fontSize: 11, marginRight: 5 }}>✦</Text>
                      <Text
                        style={{
                          color: colors.lavenderDark,
                          fontSize: 10,
                          fontWeight: "700",
                          letterSpacing: 0.7,
                        }}
                      >
                        FOR YOUR {selectedMood.toUpperCase()} MOOD
                      </Text>
                    </View>

                    {/* title */}
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 17,
                        lineHeight: 22,
                        fontWeight: "700",
                      }}
                    >
                      {wellnessMessage.title}
                    </Text>

                    {/* description */}
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 13,
                        lineHeight: 19,
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
                      style={{
                        height: 46,
                        borderRadius: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 16,
                        backgroundColor: "#FFFFFF",
                        borderWidth: 1,
                        borderColor: "#DED5EC",
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
                            backgroundColor: colors.lavenderSoft,
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 10,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.lavenderDark,
                              fontSize: 15,
                            }}
                          >
                            ♡
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: colors.lavenderDark,
                            fontSize: 13.5,
                            fontWeight: "700",
                          }}
                        >
                          {wellnessMessage.button}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: colors.lavenderDark,
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
          className="flex-1 bg-black/30 justify-start items-end pt-[60px] pr-4"
          onPress={() => setShowProfilePopup(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: 210,
              backgroundColor: colors.surface,
              borderRadius: 20,
              overflow: "hidden",

              shadowColor: "#000",
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
                borderBottomColor: colors.border,
              }}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className="w-11 h-11 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: colors.lavenderVerySoft,
                  }}
                >
                  <Image
                    source={icons.profile}
                    className="w-7 h-7"
                    style={{
                      tintColor: colors.text,
                    }}
                    resizeMode="contain"
                  />
                </View>

                <View className="flex-1">
                  <Text
                    numberOfLines={1}
                    style={{
                      color: colors.text,
                      fontWeight: "700",
                      fontSize: 14,
                    }}
                  >
                    {userName || "User"}
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={{
                      color: colors.textSecondary,
                      fontSize: 11,
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
              className="px-4 py-3.5 flex-row items-center gap-3"
            >
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{
                  backgroundColor: colors.peachSoft,
                }}
              >
                <Text
                  style={{
                    color: colors.peach,
                    fontWeight: "700",
                  }}
                >
                  →
                </Text>
              </View>

              <Text
                style={{
                  color: colors.peach,
                  fontSize: 14,
                  fontWeight: "600",
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