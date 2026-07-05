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

const ceylon = {
  ink: "#3D2E1F",
  muted: "#8A7A63",
  mutedLight: "#B8A78C",
  teaGreen: "#4A7856",
  terracotta: "#C97B4A",
  sand: "#F0E4D3",
  cream: "#FBF3EA",
};

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

  const auth = getAuth();
  const userID = auth.currentUser;
  const userId = userID ? userID.uid : null;

  useEffect(() => {
    loadMoodData();
  }, []);

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
            backgroundColor: selectedMood
              ? (moods.find((m) => m.id === selectedMood)?.bg ?? "#f4e7e2")
              : "#f4e7e2",
          },
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-white"
      >
        <ScrollView className="bg-white" showsVerticalScrollIndicator={false}>
          <View className="bg-[#f4e7e2] rounded-b-[10%] mb-10 px-6 pb-6 pt-6">
            <Text className="text-gray-400 text-sm tracking-wide mt-5 mb-2 uppercase">
              Daily reflection
            </Text>
            <Text className="text-4xl text-gray-900 mb-3">Hello, Max 👋</Text>

            <Text
              className="text-5xl font-light text-gray-900 mb-9"
              style={{ letterSpacing: 6 }}
            >
              How do you feel about your{" "}
              <Text className="font-bold text-gray-900">current emotions?</Text>
            </Text>
          </View>

          <View className="px-6 bg-white">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-lg font-bold" style={{ color: ceylon.ink }}>
                How are you feeling?
              </Text>
            </View>
            <View className="flex-row justify-between mb-8">
              {moods.map((mood) => {
                const isSelected = selectedMood === mood.id;
                return (
                  <TouchableOpacity
                    key={mood.id}
                    onPress={() => {
                      setSelectedMood(mood.id);
                      router.replace({
                        pathname: "/(tabs)/(mood)/moodCheckIn",
                        params: { mood: mood.id },
                      });
                    }}
                    activeOpacity={0.7}
                    className="items-center"
                  >
                    <View
                      className="items-center justify-center rounded-2xl p-3"
                      style={{
                        backgroundColor: isSelected ? mood.bg : "transparent",
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
          </View>

          <View className="rounded-[24px] p-5 mx-6 mt-2 overflow-hidden bg-white">
            <View className="flex-row justify-between items-center mb-6">
              <Text
                className="text-base font-bold"
                style={{ color: ceylon.ink }}
              >
                Your progress
              </Text>
            </View>
            <View className="flex-row items-end justify-between">
              <Text
                className="text-5xl font-extrabold"
                style={{ color: ceylon.ink }}
              >
                {weeklyProgress}%
              </Text>
              <Text
                className="text-xs text-right leading-relaxed mb-1"
                style={{ color: ceylon.muted, maxWidth: 120 }}
              >
                Of the weekly plan completed
              </Text>
            </View>
            <View className="mt-20" style={{ height: 56 }}>
              <DotGrid />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default DashboardScreen;
