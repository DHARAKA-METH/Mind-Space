import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Search,
  Bookmark,
  Play,
  Music2,
  Wind,
  X,
  Sparkles,
  ChevronRight,
} from "lucide-react-native";
import { Stack } from "expo-router";
import { getAuth } from "firebase/auth";
import { getUserRecommendations } from "../services/recommendationsPool";

const CATEGORY_TAGS = [
  { id: "music", label: "Music", icon: "music", color: "#D98E73", bg: "#F6E4DA" },
  { id: "activity", label: "Tips & Tricks", icon: "wind", color: "#C97B63", bg: "#F3E1DB" },
];

function TagIcon({ id, size = 24, color = "#2F2A25" }: { id: string; size?: number; color?: string }) {
  if (id === "music") return <Music2 size={size} color={color} />;
  return <Wind size={size} color={color} />;
}

export default function WellnessScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("activity");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [dismissedHeroId, setDismissedHeroId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

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
        setRecommendations(activeData.slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    }
  }

  const handleMediaRedirect = async (url: string) => {
    if (!url) return;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Redirecting", `Opening link:\n${url}`);
      }
    } catch {
      Alert.alert("Navigation Error", "Could not open the link.");
    }
  };

  const handleDismissItem = (id: string) => {
    setRecommendations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isDismissed: true } : item
      )
    );
  };

  const activeItems = recommendations.filter(
    (item) => !item.isDismissed && item.id !== dismissedHeroId
  );

  const dailyItem = activeItems.find(
    (item) => item.link && (item.link.includes("youtube.com") || item.link.includes("youtu.be"))
  ) || (activeItems.length > 0 ? activeItems[0] : null);

  const pool = activeItems.filter(
    (item) => !dailyItem || item.id !== dailyItem.id
  );

  const bySearch = (item: any) =>
    !searchQuery ||
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase());

  const musicItems = pool.filter((i) => i.category === "music" && bySearch(i));
  const tipItems = pool.filter((i) => i.category !== "music" && bySearch(i));

  return (
    <>
            <Stack.Screen
        options={{
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: "#FAF7F2",
          },
          headerTitle: () => (
            <View className="flex-1 w-full">
              <View className="flex-row items-start justify-between">
                <View className="pr-8 flex-1">
                  <Text className="text-[26px] font-bold text-[#2F2A25]">Wellness Hub</Text>
                  <Text className="text-[13px] text-[#948C7F] mt-2 leading-5">
                    Discover resources to relax, learn, and improve your wellbeing.
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => setSearchOpen((v) => !v)}
                    className="w-10 h-10 rounded-full bg-white items-center justify-center"
                    style={{ shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
                  >
                    <Search size={18} color="#2F2A25" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="w-10 h-10 rounded-full bg-white items-center justify-center"
                    style={{ shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
                  >
                    <Bookmark size={18} color="#2F2A25" />
                  </TouchableOpacity>
                </View>
              </View>
              {searchOpen && (
                <View className="flex-row items-center bg-white rounded-full px-4 py-3 mt-3" style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
                  <Search size={18} color="#948C7F" />
                  <TextInput
                    placeholder="Search suggestions"
                    placeholderTextColor="#B8B0A2"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="flex-1 text-[15px] text-[#2F2A25] p-0 ml-2"
                    autoFocus
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <X size={16} color="#B8B0A2" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-[#FAF7F2]">
        <ScrollView showsVerticalScrollIndicator={false} className="px-6 mt-[-20px]" contentContainerStyle={{ paddingBottom: 48 }}>

          {/* Hero - YouTube video */}
          {dailyItem && (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => handleMediaRedirect(dailyItem.link)}
              className="rounded-[24px] p-6 mb-8 overflow-hidden bg-[#7C9885]"
              style={{ shadowColor: "#7C9885", shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } }}
            >
              <View style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.10)" }} />
              <View style={{ position: "absolute", bottom: -40, right: 40, width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.08)" }} />

              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center bg-white/20 px-3 py-1 rounded-full">
                  <Sparkles size={12} color="#fff" />
                  <Text className="text-[10px] text-white font-bold ml-1 tracking-wide">DAILY RECOMMENDATION</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setDismissedHeroId(dailyItem.id)}
                  className="bg-white/20 p-1.5 rounded-full"
                >
                  <X size={13} color="#fff" />
                </TouchableOpacity>
              </View>

              <View className="bg-black/20 rounded-xl mb-4 aspect-video items-center justify-center">
                <Play size={40} color="#fff" fill="#fff" />
              </View>

              <Text className="text-white text-[20px] font-bold mb-2 leading-6">
                {dailyItem.title}
              </Text>
              <Text className="text-white/85 text-[13px] leading-5 mb-5" numberOfLines={3}>
                {dailyItem.description}
              </Text>

              <View className="flex-row items-center bg-white px-4 py-2 rounded-full self-end">
                <Play size={13} color="#7C9885" fill="#7C9885" />
                <Text className="text-[#2F2A25] text-[12px] font-bold ml-2">Watch now</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Category chips */}
          <View className="mb-7">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 12 }}>
              {CATEGORY_TAGS.map((tag) => {
                const isSelected = selectedTag === tag.id;
                return (
                  <TouchableOpacity
                    key={tag.id}
                    onPress={() => setSelectedTag(tag.id)}
                    className="flex-row items-center px-4 py-2.5 rounded-full mr-2.5"
                    style={{
                      backgroundColor: isSelected ? tag.color : "#FFFFFF",
                      shadowColor: "#000",
                      shadowOpacity: isSelected ? 0.15 : 0.04,
                      shadowRadius: 6,
                      shadowOffset: { width: 0, height: 2 },
                    }}
                  >
                    <TagIcon id={tag.id} size={14} color={isSelected ? "#fff" : tag.color} />
                    <Text
                      className="text-[13px] font-semibold ml-2"
                      style={{ color: isSelected ? "#fff" : "#2F2A25" }}
                    >
                      {tag.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Music */}
          {selectedTag === "music" && (
            <>
              <View className="mb-4">
                <Text className="text-[17px] font-bold text-[#2F2A25]">Music</Text>
                <Text className="text-[12px] text-[#948C7F] mt-0.5">Sounds to settle your mind</Text>
              </View>
              {musicItems.length > 0 ? (
                <FlatList
                  data={musicItems}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ paddingBottom: 4, paddingRight: 8 }}
                  renderItem={({ item }) => (
                    <MediaCard
                      item={item}
                      accent="#D98E73"
                      accentBg="#F6E4DA"
                      icon="music"
                      onPress={handleMediaRedirect}
                      onDismiss={handleDismissItem}
                    />
                  )}
                  className="mb-8"
                />
              ) : (
                <EmptyRow label="No music suggestions yet" />
              )}
            </>
          )}

          {/* Tips & Tricks */}
          {selectedTag === "activity" && (
            <>
              <View className="mb-4">
                <Text className="text-[17px] font-bold text-[#2F2A25]">Tips & Tricks</Text>
                <Text className="text-[12px] text-[#948C7F] mt-0.5">Small habits, steady progress</Text>
              </View>
              {tipItems.length > 0 ? (
                tipItems.map((item) => (
                  <TipCard
                    key={item.id}
                    item={item}
                    onPress={() => handleMediaRedirect(item.link)}
                  />
                ))
              ) : (
                <EmptyRow label="No tips under this filter right now" />
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <View className="py-8 items-center justify-center bg-white rounded-2xl border border-dashed border-[#E5DFD3] mb-8">
      <Text className="text-[#B8B0A2] text-[12px] font-medium">{label}</Text>
    </View>
  );
}

function MediaCard({
  item,
  accent,
  accentBg,
  icon,
  onPress,
  onDismiss,
}: {
  item: any;
  accent: string;
  accentBg: string;
  icon: string;
  onPress: (url: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(item.link)}
      className="bg-white rounded-[20px] mr-4 overflow-hidden"
      style={{ width: 168, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}
    >
      <View style={{ backgroundColor: accentBg }} className="h-28 items-center justify-center relative">
        <TagIcon id={icon} size={30} color={accent} />
        <View className="absolute right-2.5 bottom-2.5 bg-white p-2 rounded-full" style={{ shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 }}>
          <Play size={12} color={accent} fill={accent} />
        </View>
        <TouchableOpacity
          onPress={() => onDismiss(item.id)}
          className="absolute left-2 top-2 bg-black/10 p-1 rounded-full"
        >
          <X size={11} color="#fff" />
        </TouchableOpacity>
      </View>
      <View className="p-3.5">
        <Text className="text-[13px] font-bold text-[#2F2A25] mb-1" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-[11px] text-[#948C7F]" numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function TipCard({
  item,
  onPress,
}: {
  item: any;
  onPress: () => void;
}) {
  return (
    <View
      className="flex-row bg-white rounded-[20px] p-4 mb-4 items-start"
      style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }}
    >
      <View className="w-12 h-12 rounded-2xl bg-[#F3E1DB] items-center justify-center mr-3.5 mt-0.5">
        <Wind size={20} color="#C97B63" />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-[14px] font-bold text-[#2F2A25] flex-1 mr-2" numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        <Text className="text-[12px] text-[#948C7F] leading-4 mb-2.5" numberOfLines={3}>
          {item.description}
        </Text>
        {item.link ? (
          <TouchableOpacity onPress={onPress} className="flex-row items-center self-start">
            <Text className="text-[12px] font-bold text-[#C97B63] mr-1">Open</Text>
            <ChevronRight size={13} color="#C97B63" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
