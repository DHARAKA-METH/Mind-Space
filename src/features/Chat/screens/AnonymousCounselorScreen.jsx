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
import { getCounselors, startOrGetConversation } from "../services/anonymousChatService";

const ceylon = {
  background: "#FAF7F4",
  surface: "#FFFFFF",
  lavender: "#8D7BB8",
  lavenderDark: "#6F5C9E",
  lavenderSoft: "#EEE9F7",
  lavenderVerySoft: "#F6F2FA",
  peach: "#E88366",
  peachSoft: "#FBE9E3",
  green: "#68A765",
  greenSoft: "#EAF4E8",
  text: "#252330",
  textSecondary: "#706A76",
  textLight: "#A29CA7",
  border: "#ECE5E0",
};

const Avatar = React.memo(({ emoji, color, size = 36, online }) => (
  <View className="relative">
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color || ceylon.lavenderSoft,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#fff",
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
          borderColor: "#fff",
          backgroundColor: online ? ceylon.lavenderDark : ceylon.textLight,
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
      backgroundColor: "#fff",
      borderRadius: 20,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 10,
      shadowColor: ceylon.text,
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
            <Text style={{ fontWeight: "700", fontSize: 14, color: ceylon.text }}>
              {c.name}
            </Text>
            <Text style={{ fontSize: 12, color: ceylon.lavender, fontWeight: "600", marginTop: 2 }}>
              {c.specialty}
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 10,
              backgroundColor: c.online ? `${ceylon.lavenderDark}12` : `${ceylon.textSecondary}15`,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "700", color: c.online ? ceylon.lavenderDark : ceylon.textSecondary }}>
              {c.online ? "Online" : "Away"}
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 12, color: ceylon.textSecondary, marginTop: 8, lineHeight: 17 }}>
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
              style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: ceylon.background }}
            >
              <Text style={{ fontSize: 10, color: ceylon.textSecondary, fontWeight: "500" }}>
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
        backgroundColor: c.online ? ceylon.lavenderDark : ceylon.border,
      }}
    >
      <Text style={{ fontWeight: "700", fontSize: 13, color: c.online ? "#fff" : ceylon.textSecondary }}>
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
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: ceylon.background }}>
        <ActivityIndicator size="large" color={ceylon.lavender} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: ceylon.background }}>
      <View
        style={{
          backgroundColor: ceylon.surface,
          paddingHorizontal: 20,
          paddingTop: 16,
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
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1.5,
                borderColor: ceylon.border,
              }}
            >
              <Ionicons name="shield-checkmark" size={16} color={ceylon.lavender} />
            </View>
            <View className="ml-3">
              <Text style={{ fontWeight: "700", fontSize: 12, color: ceylon.text }}>
                Anonymous Support
              </Text>
              <Text style={{ fontSize: 11, color: ceylon.textSecondary, marginTop: 2 }}>
                Your identity is fully protected
              </Text>
            </View>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: `${ceylon.lavenderDark}12` }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: ceylon.lavenderDark }}>
              {onlineCount} online
            </Text>
          </View>
        </View>

        <View
          className="flex-row items-center mt-4"
          style={{ backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, height: 42 }}
        >
          <Ionicons name="search" size={16} color={ceylon.textLight} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search counselors..."
            placeholderTextColor={ceylon.textLight}
            style={{ flex: 1, marginLeft: 10, fontSize: 13, color: ceylon.text }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={ceylon.textLight} />
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
              backgroundColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="people-outline" size={28} color={ceylon.lavender} />
          </View>
          <Text style={{ fontWeight: "700", color: ceylon.text, fontSize: 15 }}>
            {search ? "No counselors found" : "No counselors available"}
          </Text>
          <Text style={{ fontSize: 12, color: ceylon.textSecondary, textAlign: "center", marginTop: 6 }}>
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
