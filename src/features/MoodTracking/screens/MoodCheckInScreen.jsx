import React, {
  useState,
  useEffect,
} from "react";

import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  Stack,
  useLocalSearchParams,
} from "expo-router";

import Slider from "@react-native-community/slider";

import {
  Ionicons,
} from "@expo/vector-icons";

import * as Haptics from "expo-haptics";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
  runOnJS,
  cancelAnimation,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";

import {
  moods,
} from "@/src/shared/constants/mood.config";

import {
  db,
} from "@/src/config/firebase";

import {
  addDoc,
  collection,
} from "firebase/firestore";

import {
  getAuth,
} from "firebase/auth";

import {
  sanitizeMoodData,
} from "../services/sanitizeMood";

import {
  detectRisk,
} from "../services/riskDetection";

import {
  getMoodHistory,
  calculateHistoryAverage,
} from "../services/moodHistory";

import {
  analyzeMoodWithAI,
} from "../services/aiService";

import {
  calculateStressLevel10,
} from "../services/calculateStressLevel";

import {
  calculateStress,
} from "../services/stressCalculator";

import {
  FaceCaptureCard,
} from "../components/FaceCaptureCard";

import {
  detectFaceEmotion,
} from "../services/detectFaceEmotion";

/* -------------------------------------------------------------------------- */
/*                                COLOR SYSTEM                                */
/* -------------------------------------------------------------------------- */

const colors = {
  background: "#F9F5F1",

  lavender: "#CCC5E8",
  lavenderSoft: "#F2EEF9",
  lavenderVerySoft: "#F7F4FB",

  purple: "#6D5AB5",
  purpleDark: "#574493",

  peach: "#F47F63",
  peachSoft: "#FDE8E2",

  green: "#68A765",
  greenSoft: "#EAF4E8",

  text: "#1F1F2E",
  secondaryText: "#8C8992",
  lightText: "#AAA4AE",

  white: "#FFFFFF",

  border: "#ECE6E2",

  warning: "#C99A45",

  danger: "#C45B65",
  dangerSoft: "#FBE8E9",
};

/* -------------------------------------------------------------------------- */
/*                               STRESS LEVELS                                */
/* -------------------------------------------------------------------------- */

/*
  These colors are intentionally semantic.

  The app chrome/navigation stays purple,
  but stress severity is easier to understand
  when calm → high uses different colors.
*/

const STRESS_LABELS = [
  {
    max: 2,
    label: "Calm",
    color: "#68A765",
    bg: "#EAF4E8",
  },

  {
    max: 4,
    label: "Mild",
    color: "#839C79",
    bg: "#EEF4E9",
  },

  {
    max: 6,
    label: "Moderate",
    color: "#C99A45",
    bg: "#FBF2DD",
  },

  {
    max: 8,
    label: "High",
    color: "#F47F63",
    bg: "#FDE8E2",
  },

  {
    max: 10,
    label: "Overwhelmed",
    color: "#C45B65",
    bg: "#FBE8E9",
  },
];

function getStressMeta(level) {
  return (
    STRESS_LABELS.find(
      (item) =>
        level <= item.max
    ) ||
    STRESS_LABELS[
      STRESS_LABELS.length - 1
    ]
  );
}

/* -------------------------------------------------------------------------- */
/*                                  HEADER                                    */
/* -------------------------------------------------------------------------- */

function MoodCheckInHeader() {
  return (
    <View className="flex-row items-center">
      <View
        className="
          w-10
          h-10
          rounded-2xl
          bg-[#F2EEF9]
          items-center
          justify-center
          mr-3
        "
      >
        <Ionicons
          name="heart-outline"
          size={20}
          color={colors.purple}
        />
      </View>

      <View>
        <Text
          className="
            text-[18px]
            font-extrabold
            text-[#1F1F2E]
          "
        >
          Mood Check-in
        </Text>

        <Text
          className="
            mt-0.5
            text-[10.5px]
            text-[#8C8992]
          "
        >
          A moment to notice how you feel
        </Text>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                             BREATHING BUBBLE                               */
/* -------------------------------------------------------------------------- */

const BreathingBubble = () => {
  const [
    phase,
    setPhase,
  ] = useState(
    "Breathe in"
  );

  const progress =
    useSharedValue(0);

  useEffect(() => {
    progress.value =
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: 4000,
            easing:
              Easing.inOut(
                Easing.ease
              ),
          }),

          withTiming(1, {
            duration: 1200,
            easing:
              Easing.linear,
          }),

          withTiming(0, {
            duration: 4000,
            easing:
              Easing.inOut(
                Easing.ease
              ),
          }),

          withTiming(0, {
            duration: 800,
            easing:
              Easing.linear,
          })
        ),
        -1,
        false
      );

    return () => {
      cancelAnimation(
        progress
      );
    };
  }, []);

  useAnimatedReaction(
    () => progress.value,

    (value, previous) => {
      if (
        previous === null
      ) {
        return;
      }

      if (
        value >
          (previous ?? 0) +
            0.01 &&
        value < 0.98
      ) {
        runOnJS(setPhase)(
          "Breathe in"
        );
      } else if (
        value <
          (previous ?? 0) -
            0.01 &&
        value > 0.02
      ) {
        runOnJS(setPhase)(
          "Breathe out"
        );
      } else if (
        value >= 0.98
      ) {
        runOnJS(setPhase)(
          "Hold"
        );
      } else if (
        value <= 0.02
      ) {
        runOnJS(setPhase)(
          "Relax"
        );
      }
    }
  );

  const bubbleStyle =
    useAnimatedStyle(
      () => ({
        transform: [
          {
            scale:
              interpolate(
                progress.value,
                [0, 1],
                [
                  0.75,
                  1.15,
                ]
              ),
          },
        ],

        opacity:
          interpolate(
            progress.value,
            [0, 1],
            [0.7, 1]
          ),
      })
    );

  const glowStyle =
    useAnimatedStyle(
      () => ({
        transform: [
          {
            scale:
              interpolate(
                progress.value,
                [0, 1],
                [
                  0.9,
                  1.35,
                ]
              ),
          },
        ],

        opacity:
          interpolate(
            progress.value,
            [0, 1],
            [
              0.12,
              0.3,
            ]
          ),
      })
    );

  return (
    <Animated.View
      entering={FadeIn.duration(
        250
      )}
      className="
        items-center
        justify-center
        bg-[#F2EEF9]
        border
        border-[#E3DAEF]
        rounded-[26px]
        py-7
        px-5
        mb-5
      "
    >
      {/* badge */}

      <View
        className="
          flex-row
          items-center
          bg-white
          px-3
          py-1.5
          rounded-full
          mb-5
        "
      >
        <Ionicons
          name="sparkles-outline"
          size={12}
          color={colors.purple}
        />

        <Text
          className="
            ml-1.5
            text-[9px]
            tracking-[1px]
            uppercase
            font-extrabold
            text-[#6D5AB5]
          "
        >
          Take a moment
        </Text>
      </View>

      {/* breathing circle */}

      <View
        className="
          w-[145px]
          h-[145px]
          items-center
          justify-center
        "
      >
        <Animated.View
          style={[
            {
              position:
                "absolute",

              width: 140,
              height: 140,

              borderRadius:
                70,

              backgroundColor:
                colors.lavender,
            },

            glowStyle,
          ]}
        />

        <Animated.View
          style={[
            {
              width: 88,
              height: 88,

              borderRadius:
                44,

              backgroundColor:
                colors.purple,

              alignItems:
                "center",

              justifyContent:
                "center",
            },

            bubbleStyle,
          ]}
        >
          <Ionicons
            name="leaf-outline"
            size={25}
            color="#FFFFFF"
          />
        </Animated.View>
      </View>

      <Text
        className="
          mt-4
          text-[16px]
          font-extrabold
          text-[#1F1F2E]
        "
      >
        {phase}
      </Text>

      <Text
        className="
          max-w-[250px]
          mt-1.5
          text-[11px]
          leading-[16px]
          text-center
          text-[#8C8992]
        "
      >
        Follow the circle while
        your check-in is being
        prepared.
      </Text>
    </Animated.View>
  );
};

/* -------------------------------------------------------------------------- */
/*                              SECTION TITLE                                 */
/* -------------------------------------------------------------------------- */

function SectionTitle({
  icon,
  title,
  subtitle,
}) {
  return (
    <View className="flex-row items-start mb-4">
      <View
        className="
          w-9
          h-9
          rounded-xl
          bg-[#F2EEF9]
          items-center
          justify-center
          mr-3
        "
      >
        <Ionicons
          name={icon}
          size={17}
          color={colors.purple}
        />
      </View>

      <View className="flex-1">
        <Text
          className="
            text-[13px]
            font-extrabold
            text-[#1F1F2E]
          "
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            className="
              mt-0.5
              text-[10.5px]
              leading-[15px]
              text-[#8C8992]
            "
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                              MAIN SCREEN                                   */
/* -------------------------------------------------------------------------- */

export default function MoodCheckInScreen() {
  const params =
    useLocalSearchParams();

  const initialMood =
    params?.selectedMood ||
    "Meh";

  const [
    selectedMood,
    setSelectedMood,
  ] = useState(
    initialMood
  );

  const [
    stressLevel,
    setStressLevel,
  ] = useState(4);

  const [
    note,
    setNote,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    capturedFace,
    setCapturedFace,
  ] = useState(null);

  const auth =
    getAuth();

  const userID =
    auth.currentUser;

  const userId =
    userID
      ? userID.uid
      : null;

  const stressMeta =
    getStressMeta(
      stressLevel
    );

  const activeMood =
    moods.find(
      (mood) =>
        mood.id ===
        selectedMood
    );

  /* ------------------------------------------------------------------------ */
  /*                            MOOD SELECTION                                */
  /* ------------------------------------------------------------------------ */

  const handleMoodSelect = (
    id
  ) => {
    Haptics
      .selectionAsync()
      .catch(() => {});

    setSelectedMood(id);
  };

  /* ------------------------------------------------------------------------ */
  /*                            STRESS SLIDER                                 */
  /* ------------------------------------------------------------------------ */

  const handleStressChange = (
    value
  ) => {
    setStressLevel(value);
  };

  const handleSlidingComplete =
    () => {
      Haptics
        .impactAsync(
          Haptics
            .ImpactFeedbackStyle
            .Light
        )
        .catch(() => {});
    };

  /* ------------------------------------------------------------------------ */
  /*                                  SAVE                                    */
  /* ------------------------------------------------------------------------ */

  const handleSave =
    async () => {
      setLoading(true);

      const clean =
        sanitizeMoodData({
          mood:
            selectedMood,

          selfStress:
            stressLevel,

          note,
        });

      /* ------------------------------------------------------------------ */
      /* RISK CHECK                                                         */
      /* ------------------------------------------------------------------ */

      if (
        detectRisk(
          clean.note
        )
      ) {
        setLoading(false);

        Alert.alert(
          "Support Notice",
          "Your message suggests you may be feeling very overwhelmed. Consider reaching out to someone you trust or using the support options available in the app."
        );

        return;
      }

      /* ------------------------------------------------------------------ */
      /* OPTIONAL FACE EMOTION                                              */
      /* ------------------------------------------------------------------ */

      let faceStressLevel =
        null;

      if (
        capturedFace
      ) {
        try {
          const detectedFaceEmotion =
            await detectFaceEmotion(
              capturedFace
            );

          if (
            detectedFaceEmotion
          ) {
            faceStressLevel =
              calculateStressLevel10(
                detectedFaceEmotion
              );

            console.log(
              "Detected face stress level:",
              faceStressLevel
            );
          }
        } catch (
          faceErr
        ) {
          console.log(
            "Face detection failed (non-blocking):",
            faceErr
          );
        }
      }

      /* ------------------------------------------------------------------ */
      /* MOOD HISTORY                                                       */
      /* ------------------------------------------------------------------ */

      let historyAvg = 0;

      try {
        const history =
          await getMoodHistory(
            userId
          );

        historyAvg =
          calculateHistoryAverage(
            history
          );
      } catch (
        historyErr
      ) {
        console.log(
          "Failed to load mood history:",
          historyErr
        );
      }

      /* ------------------------------------------------------------------ */
      /* AI ANALYSIS                                                        */
      /* ------------------------------------------------------------------ */

      let aiResult;

      try {
        aiResult =
          await analyzeMoodWithAI({
            mood:
              clean.mood,

            userStress:
              clean.selfStress,

            faceStress:
              faceStressLevel,

            note:
              clean.note,

            historyAverage:
              historyAvg,
          });
      } catch (
        aiErr
      ) {
        console.log(
          aiErr
        );

        setLoading(false);

        Haptics
          .notificationAsync(
            Haptics
              .NotificationFeedbackType
              .Error
          )
          .catch(
            () => {}
          );

        Alert.alert(
          "Analysis unavailable",
          "We couldn't complete your mood analysis right now. Please check your connection and try again."
        );

        return;
      }

      /* ------------------------------------------------------------------ */
      /* FINAL STRESS                                                       */
      /* ------------------------------------------------------------------ */

      const finalStress =
        calculateStress(
          clean.selfStress,
          aiResult.aiStressLevel,
          faceStressLevel,
          historyAvg
        );

      /* ------------------------------------------------------------------ */
      /* SAVE FIRESTORE                                                     */
      /* ------------------------------------------------------------------ */

      try {
        await addDoc(
          collection(
            db,
            "moodEntries"
          ),
          {
            userId,

            mood:
              clean.mood,

            selfStress:
              clean.selfStress,

            aiStress:
              aiResult.aiStressLevel,

            finalStress,

            note:
              clean.note,

            createdAt:
              new Date(),
          }
        );

        /* -------------------------------------------------------------- */
        /* SAVE RECOMMENDATIONS                                           */
        /* -------------------------------------------------------------- */

        for (
          const rec of
          aiResult.recommendations ||
          []
        ) {
          await addDoc(
            collection(
              db,
              "recommendations"
            ),
            {
              userId,

              category:
                rec.category,

              title:
                rec.title,

              description:
                rec.description,

              link:
                rec.link,

              source:
                "AI",

              createdAt:
                new Date(),

              isDismissed:
                false,
            }
          );
        }
      } catch (
        saveErr
      ) {
        console.log(
          saveErr
        );

        setLoading(false);

        Haptics
          .notificationAsync(
            Haptics
              .NotificationFeedbackType
              .Error
          )
          .catch(
            () => {}
          );

        Alert.alert(
          "Save Failed",
          "Could not save your check-in. Please try again."
        );

        return;
      }

      /* ------------------------------------------------------------------ */
      /* SUCCESS                                                            */
      /* ------------------------------------------------------------------ */

      Haptics
        .notificationAsync(
          Haptics
            .NotificationFeedbackType
            .Success
        )
        .catch(
          () => {}
        );

      Alert.alert(
        "Check-in saved",
        "Your reflection has been added to your mood journey."
      );

      setNote("");

      setStressLevel(4);

      setSelectedMood(
        "Meh"
      );

      setCapturedFace(
        null
      );

      setLoading(false);
    };

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
            <MoodCheckInHeader />
          ),

          headerShadowVisible:
            false,

          headerStyle: {
            backgroundColor:
              colors.background,
          },

          headerTintColor:
            colors.purple,

          headerTitleAlign:
            "left",
        }}
      />

      {/* ================================================================ */}
      {/* PAGE                                                             */}
      {/* ================================================================ */}

      <SafeAreaView
        edges={[
          "left",
          "right",
          "bottom",
        ]}
        className="
          flex-1
          bg-[#F9F5F1]
        "
      >
        <KeyboardAvoidingView
          behavior={
            Platform.OS ===
            "ios"
              ? "padding"
              : undefined
          }
          keyboardVerticalOffset={
            Platform.OS ===
            "ios"
              ? 88
              : 0
          }
          className="
            flex-1
            bg-[#F9F5F1]
          "
        >
          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="
              px-[18px]
              pt-4
              pb-10
            "
          >
            {/* ======================================================== */}
            {/* INTRO                                                    */}
            {/* ======================================================== */}

            <Animated.View
              entering={FadeInDown.duration(
                220
              )}
              className="
                bg-[#F2EEF9]
                rounded-[26px]
                px-5
                py-5
                mb-6
                overflow-hidden
                border
                border-[#E4DDEF]
              "
            >
              {/* decoration */}

              <View
                pointerEvents="none"
                className="
                  absolute
                  -right-8
                  -top-8
                  w-28
                  h-28
                  rounded-full
                  bg-[#CCC5E8]/40
                "
              />

              <View
                pointerEvents="none"
                className="
                  absolute
                  -bottom-8
                  right-16
                  w-20
                  h-20
                  rounded-full
                  bg-white/40
                "
              />

              <View className="max-w-[82%]">
                <View className="flex-row items-center mb-2">
                  <Ionicons
                    name="sparkles-outline"
                    size={13}
                    color={
                      colors.purple
                    }
                  />

                  <Text
                    className="
                      ml-1.5
                      text-[10px]
                      tracking-[1px]
                      font-extrabold
                      uppercase
                      text-[#6D5AB5]
                    "
                  >
                    Your reflection
                  </Text>
                </View>

                <Text
                  className="
                    text-[22px]
                    leading-7
                    font-extrabold
                    text-[#1F1F2E]
                  "
                >
                  Check in with
                  yourself
                </Text>

                <Text
                  className="
                    mt-1.5
                    text-[11.5px]
                    leading-[17px]
                    text-[#8C8992]
                  "
                >
                  There are no
                  right or wrong
                  answers. Just
                  notice what you're
                  feeling right now.
                </Text>
              </View>
            </Animated.View>

            {/* ======================================================== */}
            {/* MOOD                                                    */}
            {/* ======================================================== */}

            <SectionTitle
              icon="happy-outline"
              title="How are you feeling?"
              subtitle="Choose the mood that feels closest to you right now"
            />

            <View
              className="
                flex-row
                justify-between
                bg-white
                border
                border-[#ECE6E2]
                rounded-[24px]
                px-3
                py-4
                mb-5
              "
            >
              {moods.map(
                (mood) => {
                  const active =
                    selectedMood ===
                    mood.id;

                  return (
                    <TouchableOpacity
                      key={
                        mood.id
                      }
                      activeOpacity={
                        0.75
                      }
                      onPress={() =>
                        handleMoodSelect(
                          mood.id
                        )
                      }
                      className="
                        items-center
                        flex-1
                      "
                    >
                      <View
                        className="
                          w-[54px]
                          h-[58px]
                          rounded-[18px]
                          items-center
                          justify-center
                        "
                        style={{
                          backgroundColor:
                            active
                              ? mood.bg
                              : "#FAF8F6",

                          borderWidth:
                            active
                              ? 1.5
                              : 1,

                          borderColor:
                            active
                              ? mood.color ||
                                colors.purple
                              : colors.border,
                        }}
                      >
                        <Image
                          source={
                            active
                              ? mood.icon
                              : mood.outline
                          }
                          style={{
                            width: 29,
                            height: 29,
                          }}
                          resizeMode="contain"
                        />
                      </View>

                      <Text
                        numberOfLines={
                          1
                        }
                        className={`
                          mt-2
                          text-[9.5px]

                          ${
                            active
                              ? "font-extrabold text-[#1F1F2E]"
                              : "font-medium text-[#8C8992]"
                          }
                        `}
                      >
                        {
                          mood.label
                        }
                      </Text>

                      {active && (
                        <View
                          className="
                            mt-1.5
                            w-1.5
                            h-1.5
                            rounded-full
                          "
                          style={{
                            backgroundColor:
                              mood.color ||
                              colors.purple,
                          }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }
              )}
            </View>

            {/* Selected mood feedback */}

            {activeMood && (
              <View
                className="
                  flex-row
                  items-center
                  px-4
                  py-3
                  mb-5
                  rounded-[18px]
                  bg-[#F7F4FB]
                  border
                  border-[#E8E1F0]
                "
              >
                <Image
                  source={
                    activeMood.icon
                  }
                  style={{
                    width: 30,
                    height: 30,
                  }}
                  resizeMode="contain"
                />

                <View className="flex-1 ml-3">
                  <Text
                    className="
                      text-[11px]
                      text-[#8C8992]
                    "
                  >
                    Current mood
                  </Text>

                  <Text
                    className="
                      text-[13px]
                      font-extrabold
                      text-[#1F1F2E]
                    "
                  >
                    You're feeling{" "}
                    {activeMood.label}
                  </Text>
                </View>

                <Ionicons
                  name="checkmark-circle"
                  size={19}
                  color={
                    colors.purple
                  }
                />
              </View>
            )}

            {/* ======================================================== */}
            {/* STRESS                                                  */}
            {/* ======================================================== */}

            <SectionTitle
              icon="speedometer-outline"
              title="How intense does today feel?"
              subtitle="Move the slider from calm to overwhelmed"
            />

            <View
              className="
                bg-white
                border
                border-[#ECE6E2]
                rounded-[26px]
                p-5
                mb-5
              "
            >
              {/* Stress header */}

              <View className="flex-row items-center justify-between">
                <View>
                  <Text
                    className="
                      text-[12px]
                      text-[#8C8992]
                    "
                  >
                    Stress level
                  </Text>

                  <View className="flex-row items-end mt-1">
                    <Text
                      className="
                        text-[38px]
                        font-extrabold
                      "
                      style={{
                        color:
                          stressMeta.color,
                      }}
                    >
                      {
                        stressLevel
                      }
                    </Text>

                    <Text
                      className="
                        ml-1
                        mb-1.5
                        text-[13px]
                        font-semibold
                        text-[#AAA4AE]
                      "
                    >
                      / 10
                    </Text>
                  </View>
                </View>

                <View
                  className="
                    px-3
                    py-2
                    rounded-full
                  "
                  style={{
                    backgroundColor:
                      stressMeta.bg,
                  }}
                >
                  <Text
                    className="
                      text-[11px]
                      font-extrabold
                    "
                    style={{
                      color:
                        stressMeta.color,
                    }}
                  >
                    {
                      stressMeta.label
                    }
                  </Text>
                </View>
              </View>

              {/* Slider */}

              <View className="mt-3">
                <Slider
                  minimumValue={0}
                  maximumValue={10}
                  step={1}
                  value={
                    stressLevel
                  }
                  onValueChange={
                    handleStressChange
                  }
                  onSlidingComplete={
                    handleSlidingComplete
                  }
                  minimumTrackTintColor={
                    stressMeta.color
                  }
                  maximumTrackTintColor="#ECE6E2"
                  thumbTintColor={
                    stressMeta.color
                  }
                  style={{
                    width:
                      "100%",
                    height: 42,
                  }}
                />
              </View>

              {/* Labels */}

              <View className="flex-row justify-between mt-1">
                <View className="flex-row items-center">
                  <View
                    className="
                      w-7
                      h-7
                      rounded-full
                      bg-[#EAF4E8]
                      items-center
                      justify-center
                      mr-1.5
                    "
                  >
                    <Ionicons
                      name="leaf-outline"
                      size={13}
                      color={
                        colors.green
                      }
                    />
                  </View>

                  <Text
                    className="
                      text-[10px]
                      font-semibold
                      text-[#8C8992]
                    "
                  >
                    Calm
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Text
                    className="
                      mr-1.5
                      text-[10px]
                      font-semibold
                      text-[#8C8992]
                    "
                  >
                    Overwhelmed
                  </Text>

                  <View
                    className="
                      w-7
                      h-7
                      rounded-full
                      bg-[#FBE8E9]
                      items-center
                      justify-center
                    "
                  >
                    <Ionicons
                      name="thunderstorm-outline"
                      size={13}
                      color={
                        colors.danger
                      }
                    />
                  </View>
                </View>
              </View>

              {/* contextual message */}

              <View
                className="
                  mt-4
                  px-3.5
                  py-3
                  rounded-2xl
                "
                style={{
                  backgroundColor:
                    stressMeta.bg,
                }}
              >
                <Text
                  className="
                    text-[10.5px]
                    leading-[15px]
                  "
                  style={{
                    color:
                      stressMeta.color,
                  }}
                >
                  {stressLevel <=
                  2
                    ? "Things feel relatively calm right now."
                    : stressLevel <=
                      4
                    ? "You're noticing some stress, but it may still feel manageable."
                    : stressLevel <=
                      6
                    ? "There's a noticeable amount of pressure today."
                    : stressLevel <=
                      8
                    ? "Today seems to be carrying quite a bit of stress."
                    : "Things feel very intense right now. Consider giving yourself some extra support."}
                </Text>
              </View>
            </View>

            {/* ======================================================== */}
            {/* NOTE                                                    */}
            {/* ======================================================== */}

            <SectionTitle
              icon="document-text-outline"
              title="Anything on your mind?"
              subtitle="Optional — write as much or as little as you want"
            />

            <View
              className="
                bg-white
                border
                border-[#ECE6E2]
                rounded-[24px]
                p-4
                mb-5
              "
            >
              <TextInput
                value={note}
                onChangeText={
                  setNote
                }
                placeholder="What's been on your mind today?"
                placeholderTextColor="#AAA4AE"
                multiline
                maxLength={500}
                textAlignVertical="top"
                className="
                  min-h-[115px]
                  text-[13px]
                  leading-5
                  text-[#1F1F2E]
                "
              />

              <View
                className="
                  flex-row
                  items-center
                  justify-between
                  pt-3
                  mt-2
                  border-t
                  border-[#F0EAE6]
                "
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="lock-closed-outline"
                    size={12}
                    color={
                      colors.secondaryText
                    }
                  />

                  <Text
                    className="
                      ml-1
                      text-[9.5px]
                      text-[#8C8992]
                    "
                  >
                    Your reflection
                  </Text>
                </View>

                <Text
                  className="
                    text-[9.5px]
                    text-[#AAA4AE]
                  "
                >
                  {note.length}/500
                </Text>
              </View>
            </View>

            {/* ======================================================== */}
            {/* FACE CAPTURE                                            */}
            {/* ======================================================== */}

            <SectionTitle
              icon="scan-outline"
              title="Facial expression check"
              subtitle="Optional — you can skip this and continue"
            />

            <View className="mb-5">
              <FaceCaptureCard
                onCapture={(
                  photo
                ) =>
                  setCapturedFace(
                    photo
                  )
                }
                onRemove={() =>
                  setCapturedFace(
                    null
                  )
                }
              />

              <View
                className="
                  mt-2
                  flex-row
                  items-start
                  px-3
                "
              >
                <Ionicons
                  name="information-circle-outline"
                  size={13}
                  color={
                    colors.secondaryText
                  }
                />

                <Text
                  className="
                    flex-1
                    ml-1.5
                    text-[9.5px]
                    leading-[14px]
                    text-[#8C8992]
                  "
                >
                  Facial analysis is
                  only an additional
                  signal and may not
                  always accurately
                  reflect how you
                  feel.
                </Text>
              </View>
            </View>

            {/* ======================================================== */}
            {/* LOADING / BREATHING                                     */}
            {/* ======================================================== */}

            {loading && (
              <BreathingBubble />
            )}

            {/* ======================================================== */}
            {/* SAVE                                                    */}
            {/* ======================================================== */}

            <TouchableOpacity
              onPress={
                handleSave
              }
              disabled={
                loading
              }
              activeOpacity={
                0.85
              }
              className={`
                h-14
                rounded-[19px]
                flex-row
                items-center
                justify-center

                ${
                  loading
                    ? "bg-[#AFA8B5]"
                    : "bg-[#6D5AB5]"
                }
              `}
            >
              {loading ? (
                <ActivityIndicator
                  color="#FFFFFF"
                  size="small"
                />
              ) : (
                <Ionicons
                  name="checkmark-circle-outline"
                  size={19}
                  color="#FFFFFF"
                />
              )}

              <Text
                className="
                  ml-2
                  text-[14px]
                  font-extrabold
                  text-white
                "
              >
                {loading
                  ? "Preparing your check-in..."
                  : "Save Check-in"}
              </Text>
            </TouchableOpacity>

            {/* helper */}

            {!loading && (
              <Text
                className="
                  mt-2
                  text-center
                  text-[9.5px]
                  leading-[14px]
                  text-[#8C8992]
                "
              >
                Your check-in will
                help personalize
                your wellness
                recommendations.
              </Text>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}