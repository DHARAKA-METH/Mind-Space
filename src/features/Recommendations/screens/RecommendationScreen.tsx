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
  Image,
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

import {
  commonColors,
  spacing,
  studentColors,
  typography,
} from "@/src/theme";

import { getUserRecommendations } from "../services/recommendationsPool";

/* -------------------------------------------------------------------------- */
/*                               CATEGORY DATA                                */
/* -------------------------------------------------------------------------- */

const CATEGORY_TAGS = [
  {
    id: "music",
    label: "Music",
    icon: "music",
    color: studentColors.primary,
    bg: studentColors.primaryLight,
  },
  {
    id: "activity",
    label: "Tips & Tricks",
    icon: "wind",
    color: studentColors.accent,
    bg: studentColors.primaryLight,
  },
];

/* -------------------------------------------------------------------------- */
/*                                  TAG ICON                                  */
/* -------------------------------------------------------------------------- */

function TagIcon({
  id,
  size = 24,
  color = studentColors.textPrimary,
}: {
  id: string;
  size?: number;
  color?: string;
}) {
  if (id === "music") {
    return <Music2 size={size} color={color} />;
  }

  return <Wind size={size} color={color} />;
}

/* -------------------------------------------------------------------------- */
/*                         YOUTUBE THUMBNAIL HELPER                           */
/* -------------------------------------------------------------------------- */

function getYouTubeThumbnail(url?: string) {
  if (!url) return null;

  try {
    let videoId: string | null = null;

    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split(/[?&]/)[0] || null;
    }

    if (url.includes("youtube.com/watch")) {
      const match = url.match(/[?&]v=([^&]+)/);
      videoId = match?.[1] || null;
    }

    if (url.includes("youtube.com/shorts/")) {
      videoId =
        url.split("youtube.com/shorts/")[1]?.split(/[?&]/)[0] || null;
    }

    if (!videoId) return null;

    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                              WELLNESS SCREEN                               */
/* -------------------------------------------------------------------------- */

export default function WellnessScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedTag, setSelectedTag] = useState("activity");

  const [recommendations, setRecommendations] = useState<any[]>([]);

  const [dismissedHeroId, setDismissedHeroId] =
    useState<string | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);

  /* ------------------------------------------------------------------------ */
  /*                              LOAD DATA                                   */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    loadRecommendations();
  }, []);

  async function loadRecommendations() {
    try {
      const user = getAuth().currentUser;

      if (!user) return;

      const data = await getUserRecommendations(user.uid);

      if (data && Array.isArray(data)) {
        const activeData = data.filter(
          (item: any) => !item.isDismissed
        );

        setRecommendations(activeData.slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                            OPEN EXTERNAL LINK                            */
  /* ------------------------------------------------------------------------ */

  const handleMediaRedirect = async (url: string) => {
    if (!url || !url.trim()) {
      Alert.alert("Invalid Link", "No valid link was provided.");
      return;
    }

    try {
      await Linking.openURL(url.trim());
    } catch (error) {
      console.error("Failed to open media link:", error);

      Alert.alert(
        "Navigation Error",
        "Could not open this link. Please make sure a browser or the required app is installed."
      );
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                            DISMISS ITEM                                  */
  /* ------------------------------------------------------------------------ */

  const handleDismissItem = (id: string) => {
    setRecommendations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isDismissed: true } : item
      )
    );
  };

  /* ------------------------------------------------------------------------ */
  /*                         FILTER RECOMMENDATIONS                           */
  /* ------------------------------------------------------------------------ */

  const activeItems = recommendations.filter(
    (item) => !item.isDismissed && item.id !== dismissedHeroId
  );

  const dailyItem =
    activeItems.find(
      (item) =>
        item.link &&
        (item.link.includes("youtube.com") ||
          item.link.includes("youtu.be"))
    ) ||
    (activeItems.length > 0 ? activeItems[0] : null);

  const pool = activeItems.filter(
    (item) => !dailyItem || item.id !== dailyItem.id
  );

  const bySearch = (item: any) =>
    !searchQuery ||
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase());

  const musicItems = pool.filter(
    (item) => item.category === "music" && bySearch(item)
  );

  const tipItems = pool.filter(
    (item) => item.category !== "music" && bySearch(item)
  );

  const heroThumbnail = getYouTubeThumbnail(dailyItem?.link);

  /* ------------------------------------------------------------------------ */
  /*                                  SCREEN                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View className="flex-row items-start justify-between px-6 pt-2.5 pb-4">
              <View className="flex-1 pr-5">
                <Text
                  className="text-heading font-extrabold text-app-textPrimary"
                  style={{ letterSpacing: typography.letterSpacing.tight }}
                >
                  Wellness Hub
                </Text>
                <Text
                  className="mt-1.5 text-body-sm text-app-textSecondary"
                  style={{ maxWidth: 265 }}
                >
                  Discover resources to relax, learn, and improve your well-being.
                </Text>
              </View>

              <View className="flex-row gap-2.5">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSearchOpen((prev) => !prev)}
                  className="h-[42px] w-[42px] items-center justify-center rounded-full bg-app-surface"
                  accessibilityLabel={searchOpen ? "Close resource search" : "Search resources"}
                >
                  <Search size={19} strokeWidth={2} color={studentColors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  className="h-[42px] w-[42px] items-center justify-center rounded-full bg-app-surface"
                  accessibilityLabel="Saved resources"
                >
                  <Bookmark size={19} strokeWidth={2} color={studentColors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          ),
          headerStyle: { backgroundColor: studentColors.background },
          headerShadowVisible: false,
        }}
      />

      <SafeAreaView
        edges={["top"]}
        className="mt-[-40px] flex-1 bg-app-background"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        >
          {/* Search */}
          {searchOpen && (
            <View className="px-6 mb-4">
              <View className="h-12 flex-row items-center rounded-2xl border border-app-border bg-app-surface px-4">
                <Search size={18} color={studentColors.textSecondary} />
                <TextInput
                  placeholder="Search resources..."
                  placeholderTextColor={studentColors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  className="ml-2.5 flex-1 text-body text-app-textPrimary"
                  style={{ paddingVertical: 0 }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity accessibilityLabel="Clear resource search" onPress={() => setSearchQuery("")}>
                    <X size={17} color={studentColors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          <View className="px-6">
            {/* DAILY RECOMMENDATION */}
            {dailyItem && (
              <TouchableOpacity
                activeOpacity={0.94}
                onPress={() => handleMediaRedirect(dailyItem.link)}
                className="rounded-[27px] p-[18px] mb-7 overflow-hidden"
                style={{
                  backgroundColor: studentColors.primaryLight,
                  shadowColor: studentColors.primary,
                  shadowOpacity: 0.12,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 3,
                }}
              >
                {/* Decorative circles */}
                <View
                  pointerEvents="none"
                  className="absolute w-[135px] h-[135px] rounded-full -right-9 -top-9"
                  style={{ backgroundColor: commonColors.whiteOverlay }}
                />
                <View
                  pointerEvents="none"
                  className="absolute w-20 h-20 rounded-full -left-6 -bottom-5"
                  style={{ backgroundColor: commonColors.whiteOverlaySubtle }}
                />

                {/* Top row */}
                <View className="flex-row justify-between items-center mb-4">
                  <View className="flex-row items-center bg-white/48 px-3 py-1.5 rounded-[18px]">
                    <Sparkles size={13} color={studentColors.primary} />
                    <Text className="ml-1.5 text-caption font-extrabold text-app-primary" style={{ letterSpacing: typography.letterSpacing.label }}>
                      DAILY RECOMMENDATION
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={(event) => {
                      event.stopPropagation();
                      setDismissedHeroId(dailyItem.id);
                    }}
                    className="w-7 h-7 rounded-full items-center justify-center"
                    style={{ backgroundColor: commonColors.whiteOverlayHeavy }}
                    accessibilityLabel="Dismiss daily recommendation"
                  >
                    <X size={15} color={studentColors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Video area */}
                <View
                  className="h-[176px] rounded-2xl overflow-hidden items-center justify-center mb-4"
                  style={{ backgroundColor: commonColors.coolOverlay }}
                >
                  {heroThumbnail && (
                    <Image
                      source={{ uri: heroThumbnail }}
                      resizeMode="cover"
                      className="absolute w-full h-full"
                    />
                  )}
                  {heroThumbnail && (
                    <View className="absolute inset-0" style={{ backgroundColor: commonColors.purpleOverlay }} />
                  )}
                  <View className="w-[58px] h-[58px] rounded-full items-center justify-center" style={{ backgroundColor: commonColors.whiteOverlayStrong }}>
                    <Play size={36} color={commonColors.white} fill={commonColors.white} strokeWidth={1.5} />
                  </View>
                </View>

                {/* Title */}
                <Text numberOfLines={2} className="text-title font-extrabold text-app-textPrimary" style={{ letterSpacing: typography.letterSpacing.tight }}>
                  {dailyItem.title}
                </Text>

                {/* Description */}
                <Text numberOfLines={2} className="mb-4 mt-1.5 text-body-sm text-app-textSecondary">
                  {dailyItem.description}
                </Text>

                {/* Watch now */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={(event) => {
                    event.stopPropagation();
                    handleMediaRedirect(dailyItem.link);
                  }}
                  className="flex-row items-center self-end px-4 py-2 rounded-[20px]"
                  style={{ backgroundColor: studentColors.surface }}
                >
                  <Play size={13} color={studentColors.primary} fill={studentColors.primary} />
                  <Text className="ml-1.5 text-caption font-bold text-app-textPrimary">
                    Watch now
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}

            {/* CATEGORY CHIPS */}
            <View className="mb-7">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 10 }}
              >
                {CATEGORY_TAGS.map((tag) => {
                  const isSelected = selectedTag === tag.id;

                  return (
                    <TouchableOpacity
                      key={tag.id}
                      activeOpacity={0.8}
                      onPress={() => setSelectedTag(tag.id)}
                      className="flex-row items-center px-4 py-2.5 mr-2.5 rounded-[22px]"
                      style={{
                        backgroundColor: isSelected ? studentColors.accent : studentColors.surface,
                        borderWidth: isSelected ? 0 : 1,
                        borderColor: studentColors.border,
                      }}
                    >
                      <TagIcon
                        id={tag.id}
                        size={15}
                        color={isSelected ? commonColors.white : studentColors.primary}
                      />
                      <Text
                        className="ml-2 text-body-sm font-bold"
                        style={{ color: isSelected ? commonColors.white : studentColors.textPrimary }}
                      >
                        {tag.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* MUSIC */}
            {selectedTag === "music" && (
              <>
                <SectionHeading title="Music" subtitle="Sounds to settle your mind" />
                {musicItems.length > 0 ? (
                  <FlatList
                    data={musicItems}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 8, paddingRight: 8 }}
                    renderItem={({ item }) => (
                      <MediaCard item={item} onPress={handleMediaRedirect} onDismiss={handleDismissItem} />
                    )}
                  />
                ) : (
                  <EmptyRow label="No music suggestions yet" />
                )}
              </>
            )}

            {/* TIPS & TRICKS */}
            {selectedTag === "activity" && (
              <>
                <SectionHeading title="Tips & Tricks" subtitle="Small habits, steady progress" />
                {tipItems.length > 0 ? (
                  tipItems.map((item) => (
                    <TipCard key={item.id} item={item} onPress={() => handleMediaRedirect(item.link)} />
                  ))
                ) : (
                  <EmptyRow label="No tips under this filter right now" />
                )}
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                             SECTION HEADING                                */
/* -------------------------------------------------------------------------- */

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View className="mb-4">
      <Text className="text-subtitle font-extrabold text-app-textPrimary" style={{ letterSpacing: typography.letterSpacing.tight }}>
        {title}
      </Text>
      <Text className="mt-1 text-caption text-app-textSecondary">
        {subtitle}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                               EMPTY STATE                                  */
/* -------------------------------------------------------------------------- */

function EmptyRow({ label }: { label: string }) {
  return (
    <View
      className="mb-6 items-center justify-center rounded-[22px] border border-app-border bg-app-surface py-8"
    >
      <Text className="text-caption font-medium text-app-textSecondary">
        {label}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                MUSIC CARD                                  */
/* -------------------------------------------------------------------------- */

function MediaCard({
  item,
  onPress,
  onDismiss,
}: {
  item: any;
  onPress: (url: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(item.link)}
      className="w-[175px] mr-3.5 rounded-[22px] overflow-hidden"
      style={{
        backgroundColor: studentColors.surface,
        shadowColor: commonColors.black,
        shadowOpacity: 0.045,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 1,
      }}
    >
      <View className="h-[115px] items-center justify-center bg-app-primaryLight">
        <Music2 size={31} color={studentColors.primary} />

        <View className="absolute bottom-2.5 right-2.5 h-7 w-7 items-center justify-center rounded-full bg-app-surface">
          <Play size={12} color={studentColors.primary} fill={studentColors.primary} />
        </View>

        <TouchableOpacity
          onPress={(event) => {
            event.stopPropagation();
            onDismiss(item.id);
          }}
          className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full items-center justify-center"
          style={{ backgroundColor: commonColors.shadow }}
          accessibilityLabel={`Dismiss ${item.title}`}
        >
          <X size={12} color={commonColors.white} />
        </TouchableOpacity>
      </View>

      <View className="p-3.5">
        <Text numberOfLines={1} className="mb-1.5 text-body-sm font-extrabold text-app-textPrimary">
          {item.title}
        </Text>
        <Text numberOfLines={2} className="text-caption text-app-textSecondary">
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  TIP CARD                                  */
/* -------------------------------------------------------------------------- */

function TipCard({ item, onPress }: { item: any; onPress: () => void }) {
  return (
    <View
      className="flex-row items-center rounded-[22px] p-3.5 mb-3 min-h-[92px]"
      style={{
        backgroundColor: studentColors.surface,
        shadowColor: studentColors.accent,
        shadowOpacity: 0.035,
        shadowRadius: 9,
        shadowOffset: { width: 0, height: 3 },
        elevation: 1,
      }}
    >
      <View className="mr-3.5 h-[50px] w-[50px] items-center justify-center rounded-[15px] bg-app-accentSoft">
        <Wind size={21} color={studentColors.accent} />
      </View>

      <View className="flex-1">
        <Text numberOfLines={1} className="text-body font-extrabold text-app-textPrimary">
          {item.title}
        </Text>
        <Text numberOfLines={2} className="mt-1 text-caption text-app-textSecondary">
          {item.description}
        </Text>

        {item.link ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            className="flex-row items-center self-start mt-2"
          >
            <Text className="mr-0.5 text-caption font-bold text-app-accent">
              Open
            </Text>
            <ChevronRight size={13} color={studentColors.accent} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
