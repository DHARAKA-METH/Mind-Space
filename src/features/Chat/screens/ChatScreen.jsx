import React, { useState, useCallback } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";

import AIChatScreen from "./AIChatScreen";
import AnonymousCounselorScreen from "./AnonymousCounselorScreen";
import CounselorChatRoom from "./CounselorChatRoom";
import { Stack } from "expo-router";

const ceylon = {
  ink: "#3D2E1F",
  muted: "#8A7A63",
  mutedLight: "#B8A78C",
  charcoal: "#2C2C2C",
  accent: "#7C5CBF",
  accentLight: "#EDE7F6",
  terracotta: "#C97B4A",
  sand: "#F0E4D3",
  cream: "#FBF3EA",
  background: "#ECE6E3",
};

const TABS = [
  { id: 0, label: "AI Chat", icon: "chatbubble-outline" },
  { id: 1, label: "Anon Mentor", icon: "shield-checkmark-outline" },
];

// ─── TOGGLE TAB BAR ─────────────────────────────────────────────────────────
const ToggleTabBar = ({ activeTab, onTabPress }) => (
  <View
    className="mt-4 mb-2 p-1.5 rounded-2xl"
    style={{
      backgroundColor: "#fff",
      borderWidth: 1.5,
      borderColor: ceylon.sand,
      shadowColor: ceylon.ink,
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
      marginLeft: 30,
      marginRight: 30,
    }}
  >
    <View className="flex-row">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onTabPress(tab.id);
            }}
            activeOpacity={0.8}
            className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl"
            style={{
              backgroundColor: isActive ? ceylon.charcoal : "transparent",
            }}
          >
            <Ionicons
              name={isActive ? tab.icon.replace("-outline", "") : tab.icon}
              size={15}
              color={isActive ? "#fff" : ceylon.muted}
            />
            <Text
              className="text-[12px] font-semibold"
              style={{ color: isActive ? "#fff" : ceylon.muted }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// ─── MAIN LAYOUT ─────────────────────────────────────────────────────────────
const ChatLayout = () => {
  const [tab, setTab] = useState(0);
  const [activeCounselor, setActiveCounselor] = useState(null);

  const handleSetActiveCounselor = useCallback((counselor) => {
    setActiveCounselor(counselor);
  }, []);

  const handleTabPress = useCallback((tabId) => {
    setTab(tabId);
    setActiveCounselor(null);
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text style={{ fontWeight: "700", fontSize: 18, color: ceylon.ink, marginLeft: 30 }}>
              Support
            </Text>
          ),
          headerStyle: { backgroundColor: ceylon.cream },
          headerShadowVisible: false,
        }}
      />

      <SafeAreaView
        className="flex-1 "
        style={{ backgroundColor: ceylon.background }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 mt-[-50px]"
        >
          {!activeCounselor && (
            <ToggleTabBar activeTab={tab} onTabPress={handleTabPress} />
          )}

          <View className="flex-1">
            {activeCounselor ? (
              <CounselorChatRoom
                counselor={activeCounselor}
                onBack={() => handleSetActiveCounselor(null)}
              />
            ) : tab === 0 ? (
              <Animated.View key="ai-chat" entering={FadeIn.duration(200)} className="flex-1">
                <AIChatScreen />
              </Animated.View>
            ) : (
              <Animated.View key="anon-chat" entering={FadeIn.duration(200)} className="flex-1">
                <AnonymousCounselorScreen
                  setActiveCounselor={handleSetActiveCounselor}
                />
              </Animated.View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

export default ChatLayout;
