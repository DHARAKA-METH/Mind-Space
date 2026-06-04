import { getGreeting, getGreetingIcon } from "@/src/core/utils/time";
import { Stack } from "expo-router";
import { getAuth } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { icons } from "../../../shared/assets/icons/icons";
import { getUserRecommendations } from "../../Recommendations/services/recommendationsPool";
import { calculateAverageDayStressLevel } from "../hooks/calculateAverageDayStressLevel";
import { fetchMoodFromDb } from "../services/fetchFromDb";
import { getMoodSummaryConfig, getBackgroundConfig } from "../hooks/others";
import { ActionCard } from "../components/ActionCard";

interface SuggestionItem {
  id: string;
  title: string;
  subtitle: string;
  points: string;
  icon: ImageSourcePropType;
  isBackendResource: boolean;
}

// ─── CUSTOM HEADER COMPONENT ──────────────────────────────────────────────────
const CustomHeader = (): React.JSX.Element => {
  return (
    <View className="flex-row justify-between items-center w-full px-4">
      <View>
        <Text className="text-gray-400 text-sm font-medium uppercase tracking-wider">
          {getGreeting()}
        </Text>
        <View className="flex-row items-center mt-0.5">
          <Text className="text-2xl font-bold text-gray-900">Alex Chen</Text>
          <Text className="text-xl ml-1.5">{getGreetingIcon()}</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        <TouchableOpacity className="bg-gray-100 p-2.5 rounded-full">
          <Image
            source={icons.notification}
            className="w-5 h-5 tint-gray-700"
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View className="relative">
          <TouchableOpacity className="p-0.5 rounded-full border border-gray-200">
            <Image
              source={icons.profile}
              className="w-8 h-8 rounded-full"
              resizeMode="cover"
            />
          </TouchableOpacity>
          <View className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
        </View>
      </View>
    </View>
  );
};

// ─── MAIN DASHBOARD SCREEN ───────────────────────────────────────────────────
export default function DashboardScreen(): React.JSX.Element {
  const [activeCategory, setActiveCategory] = useState<string>("Activity");
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Initialize to 5 (Excellent / Low Stress fallback baseline)
  const [moodAverage, setMoodAverage] = useState<number>(5);

  // ─── Derive rounded rating (1–5) used by both bg and mood configs ────────
  const moodRating = Math.min(Math.max(Math.round(moodAverage), 1), 5);

  const staticSuggestions: SuggestionItem[] = [];

  useEffect(() => {
    loadRecommendations();
  }, []);

  async function loadRecommendations(): Promise<void> {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      const data = await getUserRecommendations(user.uid);
      if (data && Array.isArray(data)) {
        const activeData = data.filter((item: any) => !item.isDismissed);
        setRecommendations(activeData);
      }

      const userMoods = await fetchMoodFromDb(user.uid);
      if (userMoods) {
        const avg = await calculateAverageDayStressLevel(userMoods);
        if (typeof avg === "number" && !isNaN(avg)) {
          const clampedStress = Math.min(Math.max(avg, 1), 10);
          const convertedMoodRating = 5 - (clampedStress - 1) * (4 / 9);
          setMoodAverage(convertedMoodRating);
        }
      }
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    }
  }

  // ─── Derive layout configs from shared moodRating ────────────────────────
  const moodUI = getMoodSummaryConfig(moodRating);
  const bgConfig = getBackgroundConfig(moodRating);

  const parsedBackendSuggestions: SuggestionItem[] = recommendations.map(
    (item: any, idx: number) => ({
      id: item.recommendationId || `backend-${idx}`,
      title: item.title || "Activity Suggestion",
      subtitle: item.description || "Personalized wellness recommendation",
      points: "Recommended",
      icon: item.category === "meditation" ? icons.meditate : icons.heart,
      isBackendResource: true,
    }),
  );

  const combinedSuggestions: SuggestionItem[] = [
    ...parsedBackendSuggestions,
    ...staticSuggestions,
  ].slice(0, 3);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => <CustomHeader />,
          // ── Header bg follows the stress-aware background ──────────────
          headerStyle: { backgroundColor: bgConfig.screenBg },
          headerShadowVisible: false,
          headerLeft: () => null,
          headerBackVisible: false,
        }}
      />

      {/* ── Full-screen background driven by stress level ─────────────── */}
      <View style={{ flex: 1, backgroundColor: bgConfig.screenBg }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* CATEGORY ROW */}
          <View className="flex-row gap-2 mb-6">
            {["Activity", "Mood", "Food", "Sleep"].map((cat) => (
              <TouchableOpacity
                key={`cat-tab-${cat}`}
                onPress={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full border ${
                  activeCategory === cat
                    ? "bg-gray-900 border-gray-900"
                    : "bg-white border-gray-200"
                }`}
              >
                <Text
                  className={`text-xs font-semibold tracking-wide ${
                    activeCategory === cat ? "text-white" : "text-gray-500"
                  }`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* DYNAMIC MOOD CARD */}
          <View
            className={`${moodUI.cardBg} border ${moodUI.cardBorder} rounded-2xl p-5 mb-6`}
          >
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-gray-800">
                Today&rsquo;s Summary
              </Text>
              <Text className="text-gray-400 font-medium">···</Text>
            </View>

            <View
              className={`flex-row items-center justify-between ${moodUI.innerBg} rounded-xl p-4 border border-slate-100/20`}
            >
              <View className="flex-1 pr-3">
                <Text className="text-gray-900 font-semibold text-base mb-0.5">
                  {moodUI.title}
                </Text>
                <Text className="text-gray-500 text-xs leading-relaxed">
                  {moodUI.description}
                </Text>
              </View>

              <View className={`${moodUI.iconWrapperBg} p-2.5 rounded-xl`}>
                <Image
                  source={moodUI.icon}
                  className={`w-8 h-8 ${moodUI.tint}`}
                />
              </View>
            </View>
          </View>

          {/* ACTIONS HEADER */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-800">
              Quick Actions
            </Text>
            <TouchableOpacity>
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                See all
              </Text>
            </TouchableOpacity>
          </View>

          {/* ACTION CARDS */}
          <View className="flex-row justify-between mb-6">
            <ActionCard
              title="Meditate"
              color="bg-purple-50/80 border border-purple-100"
              icon={icons.meditate}
              textColor="text-purple-700"
            />
            <ActionCard
              title="Journal"
              color="bg-orange-50/80 border border-orange-100"
              icon={icons.journal}
              textColor="text-orange-700"
            />
            <ActionCard
              title="Talk"
              color="bg-blue-50/80 border border-blue-100"
              icon={icons.talk}
              textColor="text-blue-700"
            />
          </View>

          {/* SUGGESTIONS FEED LIST */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-800">
                Recommended For You
              </Text>
            </View>

            {combinedSuggestions.length === 0 ? (
              <View className="bg-white border border-gray-100 p-8 rounded-2xl items-center justify-center">
                <Text className="text-gray-400 text-sm">
                  All caught up for today.
                </Text>
              </View>
            ) : (
              combinedSuggestions.map((item) => (
                <TouchableOpacity
                  key={`suggestion-card-${item.id}`}
                  className="bg-white border border-gray-100 p-4 rounded-2xl flex-row items-start justify-between mb-3 shadow-sm shadow-gray-100/40"
                >
                  <View className="flex-row items-start flex-1">
                    <View className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 mr-3 mt-0.5">
                      <Image
                        source={item.icon}
                        className="w-5 h-5 tint-gray-700"
                        resizeMode="contain"
                      />
                    </View>

                    <View className="flex-1 pr-2">
                      <Text
                        className="text-gray-900 font-semibold text-sm"
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text className="text-gray-400 text-xs mt-1 leading-relaxed">
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100 ml-2 mt-0.5">
                    <Text className="text-gray-500 font-medium text-[11px] tracking-wide">
                      {item.points}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}
