import React, { useState, useCallback } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  const isBookingTab = tab === 2;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: " Support Space ",
          headerTitleStyle: { fontWeight: "600", fontSize: 18 },
          headerStyle: { backgroundColor: "#F9FAF5" },
          headerShadowVisible: false,
          headerShown: true, 
        }}
      />

      {/* If the booking component includes its own internal safe zone handling, 
        we fall back to a plain View wrapper instead of an extra nested SafeAreaView 
      */}
      <View className="flex-1 bg-slate-50 mt-[-50px]">
        <SafeAreaView className={isBookingTab ? "" : "flex-1"}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="h-full w-full"
            // Disable the parent keyboard adjust logic if BookSession uses its own
            enabled={!isBookingTab} 
          >
            {/* ── Tab Bar (hidden inside active counselor chat) ── */}
            {!activeCounselor && (
              <TabBar activeTab={tab} onTabPress={handleTabPress} />
            )}

            {/* ── Screen Content ── */}
            <View className="flex-1">
              {activeCounselor ? (
                <CounselorChatRoom
                  counselor={activeCounselor}
                  onBack={() => handleSetActiveCounselor(null)}
                />
              ) : tab === 0 ? (
                <View className="flex-1 p-2">
                  <AIChatScreen />
                </View>
              ) : tab === 1 ? (
                <View className="flex-1 p-2">
                  <AnonymousCounselorScreen
                    setActiveCounselor={handleSetActiveCounselor}
                  />
                </View>
              ) : (
                /* BookSession container layout output is isolated */
                <View className="flex-1">
                  <BookSession />
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </>
  );
};

export default ChatLayout;