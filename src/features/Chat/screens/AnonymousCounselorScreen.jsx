import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getAuth } from "firebase/auth";
import {
  calmColors,
  commonColors,
  spacing,
  typography,
} from "@/src/theme";
import { getCounselors, startOrGetConversation } from "../services/anonymousChatService";

const Avatar = React.memo(({ emoji, color, size = 36, online }) => (
  <View className="relative">
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color || calmColors.primarySoft,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: commonColors.white,
      }}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
    {online !== undefined && (
      <View
        style={{
          position: "absolute",
          bottom: 1,
          right: 1,
          width: 10,
          height: 10,
          borderRadius: 5,
          borderWidth: 2,
          borderColor: commonColors.white,
          backgroundColor: online ? calmColors.primaryDark : calmColors.textMuted,
        }}
      />
    )}
  </View>
));
Avatar.displayName = "Avatar";

const CounselorCard = React.memo(({ c, onStart }) => (
  <TouchableOpacity
    onPress={() => {
      if (!c.online) return;
      Haptics.selectionAsync().catch(() => {});
      onStart(c);
    }}
    activeOpacity={0.7}
    style={{
      backgroundColor: calmColors.surface,
      borderRadius: 20,
      padding: spacing.md,
      marginHorizontal: spacing.md,
      marginBottom: 10,
      shadowColor: calmColors.textPrimary,
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    }}
  >
    <View className="flex-row items-start">
      <Avatar emoji={c.emoji} color={c.color} size={52} online={c.online} />
      <View className="flex-1 ml-3">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-2">
            <Text className="text-body font-bold text-calm-textPrimary">
              {c.name}
            </Text>
            <Text className="mt-0.5 text-caption font-semibold text-calm-primary">
              {c.specialty}
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 10,
              backgroundColor: c.online ? `${calmColors.primaryDark}12` : `${calmColors.textSecondary}15`,
            }}
          >
            <Text className="text-caption font-bold" style={{ color: c.online ? calmColors.primaryDark : calmColors.textSecondary }}>
              {c.online ? "Online" : "Away"}
            </Text>
          </View>
        </View>

        <Text className="mt-2 text-caption text-calm-textSecondary">
          {c.bio}
        </Text>

        <View className="flex-row flex-wrap mt-3" style={{ gap: 6 }}>
          {[
            { icon: "🌐", label: c.lang },
            { icon: "⏱", label: c.avgReply },
            { icon: "⭐", label: `${c.exp}y exp` },
          ].map((tag) => (
            <View
              key={tag.label}
              style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: calmColors.background }}
            >
              <Text className="text-caption font-medium text-calm-textSecondary">
                {tag.icon} {tag.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>

    <TouchableOpacity
      onPress={() => {
        if (!c.online) return;
        Haptics.selectionAsync().catch(() => {});
        onStart(c);
      }}
      activeOpacity={0.8}
      style={{
        width: "100%",
        marginTop: 14,
        paddingVertical: 13,
        borderRadius: 14,
        alignItems: "center",
        backgroundColor: c.online ? calmColors.primaryDark : calmColors.border,
      }}
    >
      <Text className="text-body-sm font-bold" style={{ color: c.online ? commonColors.white : calmColors.textSecondary }}>
        {c.online ? "Start Anonymous Chat" : "Currently Unavailable"}
      </Text>
    </TouchableOpacity>
  </TouchableOpacity>
));
CounselorCard.displayName = "CounselorCard";

const AnonymousCounselorScreen = ({ setActiveCounselor }) => {
  const [counselors, setCounselors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCounselors()
      .then(setCounselors)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const onlineCount = counselors.filter((c) => c.online).length;

  const filtered = counselors.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.specialty.toLowerCase().includes(search.toLowerCase())
  );

  const handleStart = useCallback(
    async (c) => {
      const uid = getAuth().currentUser?.uid;
      if (!uid) return;
      const conversationId = await startOrGetConversation(uid, c.id);
      setActiveCounselor({ ...c, conversationId });
    },
    [setActiveCounselor]
  );

  const renderCounselor = useCallback(
    ({ item }) => <CounselorCard c={item} onStart={handleStart} />,
    [handleStart]
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-calm-background">
        <ActivityIndicator size="large" color={calmColors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-calm-background">
      <View
        style={{
          backgroundColor: calmColors.surface,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: 18,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 14,
                backgroundColor: calmColors.surface,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1.5,
                borderColor: calmColors.border,
              }}
            >
              <Ionicons name="shield-checkmark" size={16} color={calmColors.primary} />
            </View>
            <View className="ml-3">
              <Text className="text-caption font-bold text-calm-textPrimary">
                Anonymous Support
              </Text>
              <Text className="mt-0.5 text-caption text-calm-textSecondary">
                Your identity is fully protected
              </Text>
            </View>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: `${calmColors.primaryDark}12` }}>
            <Text className="text-caption font-bold text-calm-primaryDark">
              {onlineCount} online
            </Text>
          </View>
        </View>

        <View
          className="flex-row items-center mt-4"
          style={{ backgroundColor: calmColors.surface, borderRadius: 14, paddingHorizontal: 14, height: 42 }}
        >
          <Ionicons name="search" size={16} color={calmColors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search counselors..."
            placeholderTextColor={calmColors.textMuted}
            style={{ flex: 1, marginLeft: 10, fontSize: typography.fontSize.bodySmall, color: calmColors.textPrimary }}
          />
          {search.length > 0 && (
            <TouchableOpacity accessibilityLabel="Clear counselor search" onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={calmColors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: calmColors.surface,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="people-outline" size={28} color={calmColors.primary} />
          </View>
          <Text className="text-body font-bold text-calm-textPrimary">
            {search ? "No counselors found" : "No counselors available"}
          </Text>
          <Text className="mt-1.5 text-center text-caption text-calm-textSecondary">
            {search ? "Try a different search term" : "Check back later for available counselors"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderCounselor}
          contentContainerStyle={{ paddingTop: 14, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default AnonymousCounselorScreen;
