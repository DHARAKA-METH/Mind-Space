import React, { useState, useCallback } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";

// ─── IMPORT SCREENS ───────────────────────────────────────────────────────────
import AIChatScreen from "./AIChatScreen";
import AnonymousCounselorScreen from "./AnonymousCounselorScreen";
import CounselorChatRoom from "./CounselorChatRoom";
import BookSession from "../../../features/Appointments/screens/BookSessionScreen";
import { Text } from "@react-navigation/elements";
import { Stack } from "expo-router";

// ─── TAB CONFIG ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 0, label: "🤖 AI Chat" },
  { id: 1, label: "🔒 Anon Mentor" },
  { id: 2, label: "📅 Book Session" },
];

// ─── TAB BAR ─────────────────────────────────────────────────────────────────
const TabBar = ({ activeTab, onTabPress }) => (
  <View className="bg-white border-b border-slate-200">
    <View className="flex-row">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onTabPress(tab.id)}
            className="flex-1 items-center py-3"
          >
            <Text
              className={`text-[12px] font-semibold ${
                isActive ? "text-indigo-500" : "text-slate-400"
              }`}
            >
              {tab.label}
            </Text>
            {/* Underline indicator */}
            <View
              className={`mt-2 h-0.5 w-full ${
                isActive ? "bg-indigo-500" : "bg-transparent"
              }`}
            />
          </TouchableOpacity>
        );
      })}
    </View>

    {/* Privacy note */}
    <View className="items-center pb-2">
      <View className="px-3 py-0.5 bg-slate-50 rounded-lg border border-slate-200">
        <Text className="text-[11px] text-slate-400">
          🔒 Private & anonymous session
        </Text>
      </View>
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
    setActiveCounselor(null); // Reset counselor chat when switching tabs
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Support Chat",
          headerTitleStyle: { fontWeight: "600", fontSize: 18 },
          headerStyle: { backgroundColor: "#F9FAF5" },
          headerShadowVisible: false,
        }}
      />

      <SafeAreaView className="flex-1 bg-slate-50 ">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 p-2" 
        >
          {/* Custom duplicate View header removed from here to eliminate dual layouts */}

          {/* ── Tab Bar (hidden inside active counselor chat) ── */}
          {!activeCounselor && (
            <TabBar activeTab={tab} onTabPress={handleTabPress} />
          )}

          {/* ── Screen Content ── */}
          <View className="flex-1 p-2">
            {activeCounselor ? (
              <CounselorChatRoom
                counselor={activeCounselor}
                onBack={() => handleSetActiveCounselor(null)}
              />
            ) : tab === 0 ? (
              <AIChatScreen />
            ) : tab === 1 ? (
              <AnonymousCounselorScreen
                setActiveCounselor={handleSetActiveCounselor}
              />
            ) : (
              <BookSession />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

export default ChatLayout;
