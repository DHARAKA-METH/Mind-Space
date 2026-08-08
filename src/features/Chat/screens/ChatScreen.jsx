import React, { useState, useCallback } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AIChatScreen from "./AIChatScreen";
import AnonymousCounselorScreen from "./AnonymousCounselorScreen";
import CounselorChatRoom from "./CounselorChatRoom";
import { Text } from "@react-navigation/elements";
import { Stack } from "expo-router";

const ceylon = {
  ink: "#3D2E1F",
  muted: "#8A7A63",
  mutedLight: "#B8A78C",
  teaGreen: "#4A7856",
  terracotta: "#C97B4A",
  sand: "#F0E4D3",
  cream: "#FBF3EA",
  background: "#ECE6E3",
};

const TABS = [
  { id: 0, label: "AI Chat" },
  { id: 1, label: "Anon Mentor" },
];

const TabBar = ({ activeTab, onTabPress }) => (
  <View
    style={{
      backgroundColor: ceylon.cream,
      borderBottomWidth: 1,
      borderBottomColor: ceylon.sand,
    }}
  >
    <View className="flex-row">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onTabPress(tab.id)}
            className="flex-1 items-center py-3.5"
            activeOpacity={0.6}
          >
            <Text
              className="text-[12px] font-semibold"
              style={{ color: isActive ? ceylon.terracotta : ceylon.muted }}
            >
              {tab.label}
            </Text>
            <View
              className="mt-2 h-0.5 w-full rounded-full"
              style={{
                backgroundColor: isActive ? ceylon.terracotta : "transparent",
              }}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

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
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: ceylon.background }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {!activeCounselor && (
            <TabBar activeTab={tab} onTabPress={handleTabPress} />
          )}

          <View className="flex-1">
            {activeCounselor ? (
              <CounselorChatRoom
                counselor={activeCounselor}
                onBack={() => handleSetActiveCounselor(null)}
              />
            ) : tab === 0 ? (
              <View className="flex-1">
                <AIChatScreen />
              </View>
            ) : (
              <View className="flex-1">
                <AnonymousCounselorScreen
                  setActiveCounselor={handleSetActiveCounselor}
                />
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

export default ChatLayout;
