import React, { useState, useEffect } from "react";
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
import { Stack, useLocalSearchParams } from "expo-router";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedReaction,
  withRepeat,
  withTiming,
  withSequence,
  interpolateColor,
  interpolate,
  Easing,
  runOnJS,
  cancelAnimation,
} from "react-native-reanimated";

import { icons } from "@/src/shared/assets/icons/icons";
import { moods } from "@/src/shared/constants/mood.config";

import { db } from "@/src/config/firebase";
import { addDoc, collection } from "firebase/firestore";

import { sanitizeMoodData } from "../services/sanitizeMood";
import { detectRisk } from "../services/riskDetection";
import {
  getMoodHistory,
  calculateHistoryAverage,
} from "../services/moodHistory";
import { analyzeMoodWithAI } from "../services/aiService";
import { calculateStress } from "../services/stressCalculator";
import { getAuth } from "firebase/auth";

const ceylon = {
  ink: "#3D2E1F",
  muted: "#8A7A63",
  mutedLight: "#B8A78C",
  teaGreen: "#4A7856",
  sage: "#7C9885",
  terracotta: "#C97B4A",
  sand: "#F0E4D3",
  cream: "#FBF3EA",
  background: "#F9F7F3",
};

const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 36 };

const STRESS_LABELS = [
  { max: 2, label: "Calm", color: ceylon.teaGreen },
  { max: 4, label: "Mild", color: ceylon.sage },
  { max: 6, label: "Moderate", color: "#C9A24A" },
  { max: 8, label: "High", color: ceylon.terracotta },
  { max: 10, label: "Overwhelmed", color: "#B5555C" },
];

function getStressMeta(level) {
  return STRESS_LABELS.find((s) => level <= s.max) || STRESS_LABELS[STRESS_LABELS.length - 1];
}

// ---------------------------------------------------------------------------
// Breathing exercise — fills otherwise-empty space, gives the user something
// calming to do, especially useful while the AI analysis call is in flight.
// ---------------------------------------------------------------------------
const BreathingBubble = () => {
  const [phase, setPhase] = useState("Breathe in");
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }), // inhale
        withTiming(1, { duration: 1200, easing: Easing.linear }),             // hold
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.ease) }), // exhale
        withTiming(0, { duration: 800, easing: Easing.linear })               // rest
      ),
      -1,
      false
    );
    return () => cancelAnimation(progress);
  }, []);

  // Update the label based on where we are in the cycle, without re-rendering
  // on every frame — only when the phase actually changes.
  useAnimatedReaction(
    () => progress.value,
    (value, previous) => {
      if (previous === null) return;
      if (value > (previous ?? 0) + 0.01 && value < 0.98) {
        runOnJS(setPhase)("Breathe in");
      } else if (value < (previous ?? 0) - 0.01 && value > 0.02) {
        runOnJS(setPhase)("Breathe out");
      } else if (value >= 0.98) {
        runOnJS(setPhase)("Hold");
      } else if (value <= 0.02) {
        runOnJS(setPhase)("Relax");
      }
    }
  );

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.75, 1.15]) }],
    opacity: interpolate(progress.value, [0, 1], [0.6, 1]),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.9, 1.35]) }],
    opacity: interpolate(progress.value, [0, 1], [0.15, 0.35]),
  }));

  return (
    <View
      className="items-center justify-center rounded-3xl"
      style={{
        backgroundColor: "#fff",
        paddingVertical: SPACE.xxl,
        marginBottom: SPACE.lg,
      }}
    >
      <Text
        className="text-[10px] font-bold uppercase tracking-widest text-center "
        style={{ color: ceylon.mutedLight, marginBottom: SPACE.xl }}
      >
        Take a moment
      </Text>

      <View style={{ width: 140, height: 140, alignItems: "center", justifyContent: "center" }}>
        <Animated.View
          style={[
            {
              position: "absolute",
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: ceylon.sage,
            },
            glowStyle,
          ]}
        />
        <Animated.View
          style={[
            {
              width: 90,
              height: 90,
              borderRadius: 45,
              backgroundColor: ceylon.sage,
              alignItems: "center",
              justifyContent: "center",
            },
            bubbleStyle,
          ]}
        >
          <Ionicons name="leaf-outline" size={26} color="#fff" />
        </Animated.View>
      </View>

      <Text
        className="text-sm font-semibold text-center"
        style={{ color: ceylon.ink, marginTop: SPACE.lg }}
      >
        {phase}
      </Text>
      <Text
        className="text-xs text-center"
        style={{ color: ceylon.muted, marginTop: SPACE.xs, maxWidth: 220 }}
      >
        Follow the circle while your check-in is prepared
      </Text>
    </View>
  );
};

export default function MoodCheckInScreen() {
  const params = useLocalSearchParams();
  const initialMood = params?.selectedMood || "Meh";
  const [selectedMood, setSelectedMood] = useState(initialMood);
  const [stressLevel, setStressLevel] = useState(4);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const userID = auth.currentUser;
  const userId = userID ? userID.uid : null;

  const stressMeta = getStressMeta(stressLevel);
  const activeMood = moods.find((m) => m.id === selectedMood);

  const handleMoodSelect = (id) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedMood(id);
  };

  const handleStressChange = (value) => {
    setStressLevel(value);
  };

  const handleSlidingComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const clean = sanitizeMoodData({
        mood: selectedMood,
        selfStress: stressLevel,
        note: note,
      });

      if (detectRisk(clean.note)) {
        Alert.alert(
          "Support Notice",
          "You seem overwhelmed. Please take a break or talk to someone."
        );
        return; // `finally` below still runs, resetting loading
      }

      const history = await getMoodHistory(userId);
      const historyAvg = calculateHistoryAverage(history);

      const payload = {
        mood: clean.mood,
        userStress: clean.selfStress,
        note: clean.note,
        historyAverage: historyAvg,
      };

      const aiResult = await analyzeMoodWithAI(payload);

      const finalStress = calculateStress(
        clean.selfStress,
        aiResult.aiStressLevel,
        historyAvg
      );

      await addDoc(collection(db, "moodEntries"), {
        userId,
        mood: clean.mood,
        selfStress: clean.selfStress,
        aiStress: aiResult.aiStressLevel,
        finalStress,
        note: clean.note,
        createdAt: new Date(),
      });

      for (const rec of aiResult.recommendations || []) {
        await addDoc(collection(db, "recommendations"), {
          userId,
          category: rec.category,
          title: rec.title,
          description: rec.description,
          link: rec.link,
          source: "AI",
          createdAt: new Date(),
          isDismissed: false,
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert("Saved", `Stress Level: ${finalStress.toFixed(1)}`);

      setNote("");
      setStressLevel(4);
      setSelectedMood("Meh");
    } catch (error) {
      console.log(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: ceylon.background }}
    >
      <Stack.Screen
        options={{
          headerTitle: "Mood Check-in",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#ffffff" },
        }}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACE.lg,
          paddingTop: SPACE.lg,
          paddingBottom: SPACE.xxxl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* MOOD PICKER */}
        <Text
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: ceylon.mutedLight, marginBottom: SPACE.md }}
        >
          How are you feeling?
        </Text>
        <View className="flex-row justify-between" style={{ marginBottom: SPACE.xl }}>
          {moods.map((mood) => {
            const active = selectedMood === mood.id;
            return (
              <TouchableOpacity
                key={mood.id}
                onPress={() => handleMoodSelect(mood.id)}
                activeOpacity={0.7}
                className="items-center"
              >
                <View
                  style={{
                    backgroundColor: mood.bg,
                    borderWidth: active ? 2.5 : 0,
                    borderColor: mood.color || ceylon.sage,
                    width: 56,
                    height: 56,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: SPACE.sm,
                    shadowColor: "#000",
                    shadowOpacity: active ? 0.1 : 0,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: active ? 3 : 0,
                  }}
                >
                  <Image
                    source={active ? mood.icon : mood.outline}
                    style={{ width: 30, height: 30 }}
                    resizeMode="contain"
                  />
                </View>
                <Text
                  className="text-xs"
                  style={{
                    color: active ? ceylon.ink : ceylon.muted,
                    fontWeight: active ? "700" : "500",
                  }}
                >
                  {mood.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* STRESS SLIDER — redesigned for clarity */}
        <View
          className="rounded-3xl"
          style={{
            backgroundColor: "#fff",
            padding: SPACE.lg,
            marginBottom: SPACE.lg,
          }}
        >
          <View className="flex-row items-center justify-between" style={{ marginBottom: SPACE.xs }}>
            <Text className="text-base font-bold" style={{ color: ceylon.ink }}>
              Stress level
            </Text>
            <View
              style={{
                backgroundColor: `${stressMeta.color}18`,
                paddingHorizontal: SPACE.md,
                paddingVertical: SPACE.xs,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: stressMeta.color, fontWeight: "700", fontSize: 13 }}>
                {stressMeta.label}
              </Text>
            </View>
          </View>

          <Text style={{ color: ceylon.muted, fontSize: 12, marginBottom: SPACE.lg }}>
            Drag the dot below — left is calm, right is overwhelmed
          </Text>

          {/* Big live number so the current value is unambiguous while dragging */}
          <View className="items-center" style={{ marginBottom: SPACE.sm }}>
            <Text style={{ fontSize: 36, fontWeight: "800", color: stressMeta.color }}>
              {stressLevel}
              <Text style={{ fontSize: 16, color: ceylon.mutedLight }}> / 10</Text>
            </Text>
          </View>

          <Slider
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={stressLevel}
            onValueChange={handleStressChange}
            onSlidingComplete={handleSlidingComplete}
            minimumTrackTintColor={stressMeta.color}
            maximumTrackTintColor={ceylon.sand}
            thumbTintColor={stressMeta.color}
            style={{ width: "100%", height: 40 }}
          />

          {/* Explicit end labels so direction is never ambiguous */}
          <View className="flex-row justify-between" style={{ marginTop: SPACE.xs }}>
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <Ionicons name="leaf-outline" size={13} color={ceylon.teaGreen} />
              <Text style={{ fontSize: 11, color: ceylon.muted }}>Calm</Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, color: ceylon.muted }}>Overwhelmed</Text>
              <Ionicons name="thunderstorm-outline" size={13} color="#B5555C" />
            </View>
          </View>
        </View>

        {/* NOTE */}
        <View
          className="rounded-3xl"
          style={{ backgroundColor: "#fff", padding: SPACE.lg, marginBottom: SPACE.lg }}
        >
          <Text
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: ceylon.mutedLight, marginBottom: SPACE.sm }}
          >
            Anything on your mind?
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Write your thoughts..."
            placeholderTextColor={ceylon.mutedLight}
            multiline
            style={{
              minHeight: 110,
              color: ceylon.ink,
              fontSize: 14,
              textAlignVertical: "top",
            }}
          />
        </View>

        {/* BREATHING EXERCISE — fills the empty space with something useful */}
        <BreathingBubble />

        {/* SAVE BUTTON */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
          style={{
            backgroundColor: loading ? ceylon.mutedLight : ceylon.teaGreen,
            height: 56,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: SPACE.sm,
          }}
        >
          {loading && <ActivityIndicator color="#fff" size="small" />}
          <Text className="text-white font-bold text-base">
            {loading ? "Saving..." : "Save Check-in"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}