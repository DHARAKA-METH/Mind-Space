import { icons } from "@/src/shared/assets/icons/icons";
import { moods } from "@/src/shared/constants/mood.config";
import { Stack, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
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

const ceylon = {
  ink: "#3D2E1F",
  muted: "#8A7A63",
  mutedLight: "#B8A78C",
  teaGreen: "#4A7856",
  terracotta: "#C97B4A",
  sand: "#F0E4D3",
  cream: "#FBF3EA",
};

const STATUS_TO_MOOD_ID: Record<string, string> = {
  awful: "Awful",
  bad: "Bad",
  neutral: "Meh",
  good: "Good",
  great: "Great",
};

const MOOD_MESSAGES: Record<string, string> = {
  Awful: "A few mindful minutes may help you feel more balanced.",
  Bad: "Small self-care moments can make a big difference.",
  Meh: "Taking a moment for yourself could help lift your spirits.",
  Good: "Let's build on this positive energy with a relaxing activity.",
  Great: "Keep this positive momentum going with a wellness activity.",
};

const CONTEXT_TAGS = [
  "School",
  "Relationships",
  "Health",
  "Family",
  "Finances",
  "Work",
];

const DashboardHeader = React.memo(function DashboardHeader() {
  return (
    <View className="flex-row justify-between items-center px-4 pt-4 pb-2">
      <View className="w-10 h-10 rounded-full items-center justify-center bg-white">
        <View
          style={{
            width: 12,
            height: 12,
            backgroundColor: "#000",
            transform: [{ rotate: "45deg" }],
            borderRadius: 2,
          }}
        />
      </View>

      <View className="flex-row items-center gap-3">
        <TouchableOpacity className="w-10 h-10 rounded-full items-center justify-center bg-white">
          <Image
            source={icons.notification}
            className="w-5 h-5"
            style={{ tintColor: "#000" }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <View className="relative">
          <TouchableOpacity className="w-10 h-10 rounded-full items-center justify-center border border-[#f0e4d3] bg-white">
            <Image
              source={icons.profile}
              className="w-8 h-8 rounded-full"
              style={{ tintColor: "#000" }}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <View
            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white"
            style={{ backgroundColor: ceylon.teaGreen }}
          />
        </View>
      </View>
    </View>
  );
});

const DotGrid = (): React.JSX.Element => {
  const rows = 4;
  const cols = 7;
  return (
    <View
      style={{ position: "absolute", left: -10, bottom: -10, opacity: 0.5 }}
      pointerEvents="none"
    >
      {Array.from({ length: rows }).map((_, r) => (
        <View key={`dot-row-${r}`} style={{ flexDirection: "row" }}>
          {Array.from({ length: cols }).map((_, c) => (
            <View
              key={`dot-${r}-${c}`}
              style={{
                width: 10,
                height: 10,
                borderRadius: 10,
                margin: 5,
                backgroundColor: ceylon.teaGreen,
                opacity: (r + c) % 3 === 0 ? 0.6 : 0.25,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

const DashboardScreen = () => {
  const router = useRouter();
  const [moodAverage, setMoodAverage] = useState<number>(5);
  const [weeklyProgress, setWeeklyProgress] = useState<number>(0);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");

  const auth = getAuth();
  const userID = auth.currentUser;
  const userId = userID ? userID.uid : null;

  const currentMoodObj = moods.find((m) => m.id === selectedMood);

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
          const convertedMoodRating = 5 - (clampedStress - 1) * (4 / 9);
          setMoodAverage(convertedMoodRating);
        }
        const loggedDays = Array.isArray(userMoods) ? userMoods.length : 0;
        setWeeklyProgress(Math.min(Math.round((loggedDays / 7) * 100), 100));
      }
    } catch (error) {
      console.error("Failed to load mood data:", error);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => <DashboardHeader />,
          headerBackVisible: false,
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: currentMoodObj?.bg || "#f4e7e2",
          },
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-white"
      >
        <ScrollView
          className="bg-[#ece6e3]"
          showsVerticalScrollIndicator={false}
        >
          <View
            className="rounded-b-[10%] mb-4 px-6 pb-6 pt-6 mt-[-10px]"
            style={{ backgroundColor: currentMoodObj?.bg || "#f4e7e2" }}
          >
            <Text className="text-gray-400 text-sm tracking-wide mt-5 mb-2 uppercase">
              Daily reflection
            </Text>
            <Text className="text-4xl text-gray-900 mb-3">
              Hello, {userName || "there"} 👋
            </Text>

            <Text
              className="text-5xl text-gray-900 mb-9"
              style={{
                letterSpacing: 6,
                fontWeight: "200",
                fontStyle: "italic",
              }}
            >
              How do you feel about your{" "}
              <Text className="font-bold text-gray-500">current emotions?</Text>
            </Text>
          </View>

          <View className=" mt-[-10px]">
            {/* Mood picker */}
            <View className="flex-row justify-between items-center mt-2 uppercase">
              <Text
                className="text-gray-400 text-lg tracking-wide ml-8"
                style={{
                  letterSpacing: 6,
                  fontWeight: "400",
                  fontStyle: "italic",
                }}
              >
                Mood Check-In
              </Text>
            </View>
            <View className="flex-row justify-between mb-4 p-4">
              {moods.map((mood) => {
                const isSelected = selectedMood === mood.id;
                return (
                  <TouchableOpacity
                    key={mood.id}
                    onPress={() => {
                      setSelectedMood(mood.id);
                      setSelectedTag(null);
                      setNoteOpen(false);
                    }}
                    activeOpacity={0.7}
                    className="items-center"
                  >
                    <View
                      className="items-center justify-center p-3"
                      style={{
                        backgroundColor: "#fff",
                        borderRadius: 100,
                        shadowColor: "#000",
                        shadowOpacity: isSelected ? 0.14 : 0.04,
                        shadowRadius: isSelected ? 10 : 4,
                        shadowOffset: { width: 0, height: isSelected ? 4 : 1 },
                        elevation: isSelected ? 4 : 1,
                        borderWidth: isSelected ? 1.5 : 0,
                        borderColor: ceylon.terracotta,
                      }}
                    >
                      <Image
                        source={isSelected ? mood.icon : mood.outline}
                        className="w-10 h-10"
                        resizeMode="contain"
                      />
                    </View>
                    <Text
                      className="text-xs mt-1.5"
                      style={{
                        color: isSelected ? ceylon.ink : ceylon.muted,
                        fontWeight: isSelected ? "600" : "400",
                      }}
                    >
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Check-in card */}
            {selectedMood && (
              <View
                className="items-center mb-6 px-5 py-7"
                style={{
                  backgroundColor: "#fff",
                  width: "100%",
                  height: "100%",
                  borderRadius: 35,
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 2,
                }}
              >
                <Text
                  className="text-xs font-bold tracking-widest uppercase mb-7"
                  style={{ color: ceylon.terracotta }}
                >
                  Check In
                </Text>

                <PulsingMoodButton moodId={selectedMood} active={true}>
                  <TouchableOpacity
                    onPress={() => router.push("/(tabs)/(mood)/moodCheckIn")}
                    activeOpacity={0.7}
                    className="items-center justify-center"
                    style={{
                      width: 92,
                      height: 92,
                      borderRadius: 46,
                      backgroundColor: "#fff",
                      shadowColor: "#000",
                      shadowOpacity: 0.12,
                      shadowRadius: 14,
                      shadowOffset: { width: 0, height: 5 },
                      borderWidth: 1.5,
                      borderColor: ceylon.terracotta,
                    }}
                  >
                    <Image
                      source={currentMoodObj?.icon}
                      className="w-14 h-14"
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </PulsingMoodButton>

                <Text
                  className="text-xl font-bold mb-2"
                  style={{ color: ceylon.ink }}
                >
                  You&apos;re feeling {selectedMood} today
                </Text>
                <Text
                  className="text-sm text-center leading-5 mb-6"
                  style={{ color: ceylon.muted, maxWidth: 280 }}
                >
                  {MOOD_MESSAGES[selectedMood]}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default DashboardScreen;
