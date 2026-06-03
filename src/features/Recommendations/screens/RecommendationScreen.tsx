import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
} from "react-native";
import {
  Search,
  Play,
  Bookmark,
  Music,
  Video,
  Wind,
  X,
  Sparkles,
  ChevronRight,
} from "lucide-react-native";
import { Stack } from "expo-router";
import { getAuth } from "firebase/auth";
import { getUserRecommendations } from "../services/recommendationsPool";

// Move tracking configs outside the function block to ensure strict identity reference stability
const FILTER_TAGS = [
  {
    id: "music",
    label: "Music",
    emoji: "🎵",
    styles: "bg-yellow-100 text-yellow-700 border-yellow-400",
  },
  {
    id: "meditation",
    label: "Meditation",
    emoji: "🧘‍♂️",
    styles: "bg-blue-100 text-blue-700 border-blue-400",
  },
  {
    id: "activity",
    label: "Activities & Tips",
    emoji: "⚡",
    styles: "bg-teal-100 text-teal-700 border-teal-400",
  },
];

export default function WellnessScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("music");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [dismissedHeroId, setDismissedHeroId] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, []);

  async function loadRecommendations() {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      const data = await getUserRecommendations(user.uid);
      if (data && Array.isArray(data)) {
        const activeData = data.filter((item: any) => !item.isDismissed);
        setRecommendations(activeData);
      }
    } catch (error) {
      console.error("Failed to balance and load recommendations:", error);
    }
  }

  const handleMediaRedirect = async (url: string) => {
    if (!url) return;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Redirecting",
          `Opening active media resource link:\n${url}`
        );
      }
    } catch {
      Alert.alert(
        "Navigation Error",
        "Could not execute system media routing navigation."
      );
    }
  };

  const handleDismissItem = (id: string) => {
    setRecommendations((prev) =>
      prev.map((item) =>
        item.recommendationId === id ? { ...item, isDismissed: true } : item
      )
    );
  };

  const activeHeroItems = recommendations.filter(
    (item) => !item.isDismissed && item.recommendationId !== dismissedHeroId
  );
  
  const mainItem = activeHeroItems.length > 0 ? activeHeroItems[0] : null;

  const listFeedPool = mainItem 
    ? activeHeroItems.slice(1) 
    : recommendations.filter((item) => !item.isDismissed);

  const visibleRecommendations = listFeedPool.filter((item) => {
    const matchesTab = item.category === selectedTag;
    const matchesSearch =
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Meditation & Mindfulness 🌿",
          headerTitleStyle: { fontWeight: "600", fontSize: 18 },
          headerStyle: { backgroundColor: "#F9FAF5" },
          headerShadowVisible: false,
          headerLeft: () => null,
          headerBackVisible: false,
        }}
      />
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView showsVerticalScrollIndicator={false} className="px-6 pt-4">
          
          {/* Global Filter Search bar layout */}
          <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-3 mb-6">
            <Search size={20} color="#9ca3af" className="mr-2" />
            <TextInput
              placeholder="Search suggestions"
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-base text-gray-800 p-0"
            />
          </View>

          {/* Filter Tabs matching DB Stress Rule Engine Categories */}
          <View className="flex-row justify-start space-x-3 mb-6 gap-2 flex-wrap">
            {FILTER_TAGS.map((tag) => {
              const isSelected = selectedTag === tag.id;
              return (
                <TouchableOpacity
                  key={`filter-tab-${tag.id}`} // Enforced explicit namespace key wrapper
                  onPress={() => setSelectedTag(tag.id)}
                  className={`flex-row items-center px-4 py-2 rounded-full mb-1 ${
                    isSelected
                      ? `${tag.styles} border scale-105`
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <Text className="text-sm mr-1">{tag.emoji}</Text>
                  <Text className="font-semibold text-sm">{tag.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* PRIMARY HERO SELECTION CARD (LATEST ENTRY) */}
          {mainItem && (
            <TouchableOpacity
              className="bg-purple-50 rounded-3xl p-5 mb-8 relative overflow-hidden"
              activeOpacity={0.9}
              onPress={() => handleMediaRedirect(mainItem.link)}
            >
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-purple-700 font-semibold text-xs bg-purple-100 px-2 py-1 rounded-md">
                  ⏱ {mainItem.stressRange ? `Stress Level: ${mainItem.stressRange}` : "Featured"}
                </Text>
                <TouchableOpacity
                  onPress={() => setDismissedHeroId(mainItem.recommendationId)}
                  className="bg-purple-200/40 p-1 rounded-full"
                >
                  <X size={14} color="#4338ca" />
                </TouchableOpacity>
              </View>

              <View className="bg-purple-200/60 rounded-2xl h-36 w-full items-center justify-center relative mb-4">
                <Text className="text-5xl">
                  {mainItem.category === "music" ? "🎵" : mainItem.category === "meditation" ? "🧘‍♀️" : "🌿"}
                </Text>
                <View className="absolute right-4 bottom-4 bg-white p-3 rounded-full shadow-sm">
                  <Play size={20} color="#000" fill="#000" />
                </View>
              </View>

              <View className="flex-row items-center mb-1 flex-wrap">
                <Text className="text-xl font-bold text-indigo-950 mr-2">
                  {mainItem.title}
                </Text>
                <View className="bg-purple-600 px-1.5 py-0.5 rounded flex-row items-center">
                  <Sparkles size={10} color="#fff" className="mr-0.5" />
                  <Text className="text-[9px] text-white font-bold">LATEST BEST MATCH</Text>
                </View>
              </View>
              <Text className="text-indigo-900/60 text-sm">
                {mainItem.description}
              </Text>
            </TouchableOpacity>
          )}

          {/* SUB-RECOMMENDATIONS LOWER CONTAINER */}
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <Bookmark size={20} color="#4b5563" fill="#4b5563" />
              <Text className="text-lg font-bold text-gray-900 ml-2">
                Suggestions ({selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)})
              </Text>
            </View>
          </View>

          {/* Dynamic Mapping List Output Stream */}
          <View className="space-y-4 pb-12">
            {visibleRecommendations.map((item, index) => {
              const uiBg = item.iconBg || (item.category === "music" ? "bg-amber-50" : item.category === "meditation" ? "bg-blue-50" : "bg-emerald-50");
              const uiColor = item.iconColor || (item.category === "music" ? "#d97706" : item.category === "meditation" ? "#2563eb" : "#059669");
              
              // Fallback block prevents crash if any items have duplicate database IDs
              const fallbackKey = item.recommendationId || `rec-fallback-idx-${index}`;

              return (
                <View
                  key={fallbackKey}
                  className="flex-row items-center justify-between border-b border-gray-100 pb-4 mb-4"
                >
                  <TouchableOpacity
                    onPress={() => handleMediaRedirect(item.link)}
                    className="flex-row items-center flex-1 mr-2"
                    activeOpacity={0.7}
                  >
                    <View className={`w-14 h-14 rounded-2xl ${uiBg} items-center justify-center mr-4`}>
                      {item.category === "music" && <Music size={24} color={uiColor} />}
                      {item.category === "meditation" && <Video size={24} color={uiColor} />}
                      {item.category !== "music" && item.category !== "meditation" && <Wind size={24} color={uiColor} />}
                    </View>

                    <View className="flex-1 justify-center">
                      <View className="flex-row items-center mb-0.5 flex-wrap">
                        <Text className="text-base font-bold text-slate-900 mr-2">
                          {item.title}
                        </Text>
                        <View className="bg-purple-100 rounded px-1.5 py-0.5 flex-row items-center">
                          <Sparkles size={8} color="#7c3aed" className="mr-0.5" />
                          <Text className="text-[9px] text-purple-700 font-bold uppercase">AI</Text>
                        </View>
                      </View>
                      <Text className="text-xs text-gray-400 font-semibold" numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View className="flex-row items-center space-x-2 gap-1">
                    <TouchableOpacity onPress={() => handleMediaRedirect(item.link)}>
                      <ChevronRight size={16} color="#cbd5e1" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDismissItem(item.recommendationId)}
                      className="p-1 bg-gray-50 rounded-full"
                    >
                      <X size={12} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Empty UI Fallback Context */}
            {visibleRecommendations.length === 0 && (
              <View className="py-12 items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Text className="text-gray-400 text-sm font-medium">
                  No active recommendations under {selectedTag}.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}