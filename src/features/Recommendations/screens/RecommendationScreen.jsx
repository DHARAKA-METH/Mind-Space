import React, { useState } from "react";
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

// --- DUMMY MODEL DATABASE ---
const MAIN_RECOMMENDATION = {
  recommendationId: "REC_MAIN_001",
  userId: "U001",
  category: "meditation",
  title: "Calm the Racing Mind",
  description: "Immerse yourself in peace and harmony...",
  link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  source: "AI",
  createdAt: "2026-06-02T10:00:00Z",
  isDismissed: false,
  duration: "8 min",
  thumbnailEmoji: "🧘‍♀️",
};

// The data pool loaded with your explicit AI-sourced fields
const AI_RECOMMENDATIONS_POOL = [
  {
    recommendationId: "REC001",
    userId: "U001",
    category: "music",
    title: "Calm Focus Playlist",
    description:
      "A playlist designed to help reduce stress and improve concentration.",
    link: "https://open.spotify.com/playlist/example",
    source: "AI",
    createdAt: "2026-05-15T17:00:00Z",
    isDismissed: false,
    iconBg: "bg-yellow-100",
    iconColor: "#eab308",
  },
  {
    recommendationId: "REC002",
    userId: "U001",
    category: "music",
    title: "Deep Sleep Rain Sounds",
    description:
      "An immersive pure acoustic ambient soundtrack for sleep therapy and anxiety relief.",
    link: "https://open.spotify.com",
    source: "AI",
    createdAt: "2026-05-16T22:30:00Z",
    isDismissed: false,
    iconBg: "bg-yellow-100",
    iconColor: "#eab308",
  },
  {
    recommendationId: "REC003",
    userId: "U001",
    category: "music",
    title: "Binaural Alpha Waves",
    description:
      "Constant frequency tracks calibrated specifically to trigger deep cognitive study zones.",
    link: "http://googleusercontent.com/spotify.com/2",
    source: "AI",
    createdAt: "2026-05-17T08:15:00Z",
    isDismissed: false,
    iconBg: "bg-yellow-100",
    iconColor: "#eab308",
  },
  {
    recommendationId: "REC004",
    userId: "U001",
    category: "video",
    title: "Guided Zen Meditation Videos",
    description:
      "YouTube · 8 structured sessions for grounding racing thoughts visually.",
    link: "https://youtube.com",
    source: "AI",
    createdAt: "2026-05-18T10:00:00Z",
    isDismissed: false,
    iconBg: "bg-blue-100",
    iconColor: "#3b82f6",
  },
  {
    recommendationId: "REC005",
    userId: "U001",
    category: "breathing",
    title: "Box Breathing Drill Track",
    description:
      "Guided pacing exercise featuring steady tactical count intervals.",
    link: "https://example.com/breath",
    source: "System",
    createdAt: "2026-05-19T09:15:00Z",
    isDismissed: false,
    iconBg: "bg-teal-100",
    iconColor: "#14b8a6",
  },
];

export default function WellnessScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("music"); 
  const [recommendations, setRecommendations] = useState(
    AI_RECOMMENDATIONS_POOL,
  );
  const [mainItem, setMainItem] = useState(MAIN_RECOMMENDATION);

  // Deep Link App Router
  const handleMediaRedirect = async (url) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Redirecting",
          `Opening active media resource link:\n${url}`,
        );
      }
    } catch {
      Alert.alert(
        "Error",
        "Could not execute system media routing navigation.",
      );
    }
  };

  // State Handler to simulate database updates when an element is removed from the stream
  const handleDismissItem = (id) => {
    setRecommendations((prev) =>
      prev.map((item) =>
        item.recommendationId === id ? { ...item, isDismissed: true } : item,
      ),
    );
  };

  // Main Category Filter Layer
  const visibleRecommendations = recommendations.filter(
    (item) => item.category === selectedTag && !item.isDismissed,
  );

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

          {/* Filter Tabs matching DB Categories */}
          <View className="flex-row justify-start space-x-3 mb-6 gap-4">
            {[
              {
                id: "music",
                label: "Music",
                emoji: "🎵",
                styles: "bg-yellow-100 text-yellow-700 border-yellow-400",
              },
              {
                id: "video",
                label: "Video",
                emoji: "🎥",
                styles: "bg-blue-100 text-blue-700 border-blue-400",
              },
              {
                id: "breathing",
                label: "Focus",
                emoji: "🎯",
                styles: "bg-teal-100 text-teal-700 border-teal-400",
              },
            ].map((tag) => {
              const isSelected = selectedTag === tag.id;
              return (
                <TouchableOpacity
                  key={tag.id}
                  onPress={() => setSelectedTag(tag.id)}
                  className={`flex-row items-center px-4 py-2 rounded-full transition-all ${
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

          {/* PRIMARY HERO SELECTION CARD */}
          {!mainItem.isDismissed && (
            <TouchableOpacity
              className="bg-purple-50 rounded-3xl p-5 mb-8 relative overflow-hidden"
              activeOpacity={0.9}
              onPress={() => handleMediaRedirect(mainItem.link)}
            >
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-purple-700 font-semibold text-xs bg-purple-100 px-2 py-1 rounded-md">
                  ⏱ {mainItem.duration}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setMainItem((prev) => ({ ...prev, isDismissed: true }))
                  }
                  className="bg-purple-200/40 p-1 rounded-full"
                >
                  <X size={14} color="#4338ca" />
                </TouchableOpacity>
              </View>

              <View className="bg-purple-200/60 rounded-2xl h-36 w-full items-center justify-center relative mb-4">
                <Text className="text-5xl">{mainItem.thumbnailEmoji}</Text>
                <View className="absolute right-4 bottom-4 bg-white p-3 rounded-full shadow-sm">
                  <Play size={20} color="#000" fill="#000" />
                </View>
              </View>

              <View className="flex-row items-center mb-1 flex-wrap">
                <Text className="text-xl font-bold text-indigo-950 mr-2">
                  {mainItem.title}
                </Text>
                {mainItem.source === "AI" && (
                  <View className="bg-purple-600 px-1.5 py-0.5 rounded flex-row items-center">
                    <Sparkles size={10} color="#fff" className="mr-0.5" />
                    <Text className="text-[9px] text-white font-bold">
                      AI BEST MATCH
                    </Text>
                  </View>
                )}
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
                AI Suggestions (
                {selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)})
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setRecommendations(AI_RECOMMENDATIONS_POOL);
                setMainItem(MAIN_RECOMMENDATION);
              }}
            >
              <Text className="text-xs text-blue-500 font-bold">
                Reset Engine
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dynamic Mapping List Output */}
          <View className="space-y-4 pb-12">
            {visibleRecommendations.map((item) => (
              <View
                key={item.recommendationId}
                className="flex-row items-center justify-between border-b border-gray-100 pb-4 mb-4"
              >
                <TouchableOpacity
                  onPress={() => handleMediaRedirect(item.link)}
                  className="flex-row items-center flex-1 mr-2"
                  activeOpacity={0.7}
                >
                  {/* Visual Icon Badge Group mapping categories dynamically */}
                  <View
                    className={`w-14 h-14 rounded-2xl ${item.iconBg} items-center justify-center mr-4`}
                  >
                    {item.category === "music" && (
                      <Music size={24} color={item.iconColor} />
                    )}
                    {item.category === "video" && (
                      <Video size={24} color={item.iconColor} />
                    )}
                    {item.category === "breathing" && (
                      <Wind size={24} color={item.iconColor} />
                    )}
                  </View>

                  {/* Schema Information Blocks */}
                  <View className="flex-1 justify-center">
                    <View className="flex-row items-center mb-0.5 flex-wrap">
                      <Text className="text-base font-bold text-slate-900 mr-2">
                        {item.title}
                      </Text>
                      {item.source === "AI" && (
                        <View className="bg-purple-100 rounded px-1.5 py-0.5 flex-row items-center">
                          <Sparkles
                            size={8}
                            color="#7c3aed"
                            className="mr-0.5"
                          />
                          <Text className="text-[9px] text-purple-700 font-bold uppercase">
                            AI
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      className="text-xs text-gray-400 font-semibold"
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Action Rows */}
                <View className="flex-row items-center space-x-2">
                  <TouchableOpacity
                    onPress={() => handleMediaRedirect(item.link)}
                  >
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
            ))}

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
