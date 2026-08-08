import React, {
  useCallback,
  useState,
} from "react";

import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  Ionicons,
} from "@expo/vector-icons";

import * as Haptics from "expo-haptics";

import Animated, {
  FadeIn,
} from "react-native-reanimated";

import {
  Stack,
} from "expo-router";

import AIChatScreen from "./AIChatScreen";
import AnonymousCounselorScreen from "./AnonymousCounselorScreen";
import CounselorChatRoom from "./CounselorChatRoom";

/* -------------------------------------------------------------------------- */
/*                               COLOR PALETTE                                */
/* -------------------------------------------------------------------------- */

const colors = {
  background: "#F9F5F1",

  lavender: "#CCC5E8",
  lavenderSoft: "#F2EEF9",

  purple: "#6D5AB5",
  purpleDark: "#574493",

  peach: "#F47F63",
  peachSoft: "#FDE8E2",

  text: "#1F1F2E",
  secondaryText: "#8C8992",

  white: "#FFFFFF",

  border: "#ECE6E2",
};

/* -------------------------------------------------------------------------- */
/*                                   TABS                                     */
/* -------------------------------------------------------------------------- */

const TABS = [
  {
    id: 0,
    label: "AI Support",
    icon: "sparkles-outline",
    activeIcon: "sparkles",
  },

  {
    id: 1,
    label: "Anonymous Chat",
    icon: "shield-checkmark-outline",
    activeIcon: "shield-checkmark",
  },
];

/* -------------------------------------------------------------------------- */
/*                              TAB INFORMATION                               */
/* -------------------------------------------------------------------------- */

const TAB_MESSAGES = {
  0: {
    icon: "chatbubble-ellipses-outline",

    title: "A private space to talk",

    description:
      "Share what's on your mind and get gentle, supportive guidance anytime.",
  },

  1: {
    icon: "people-outline",

    title: "Connect anonymously",

    description:
      "Talk with a counselor without revealing your identity when you prefer support from a person.",
  },
};

/* -------------------------------------------------------------------------- */
/*                              CUSTOM HEADER                                 */
/* -------------------------------------------------------------------------- */

const SupportHeader = () => {
  return (
    <View className="flex-row items-center">
      {/* Icon */}

      <View
        className="
          w-10
          h-10
          rounded-2xl
          bg-[#F2EEF9]
          items-center
          justify-center
          mr-3
        "
      >
        <Ionicons
          name="heart-outline"
          size={20}
          color={colors.purple}
        />
      </View>

      {/* Header text */}

      <View>
        <Text
          className="
            text-[18px]
            font-extrabold
            text-[#1F1F2E]
          "
        >
          Support
        </Text>

        <Text
          className="
            text-[10.5px]
            mt-0.5
            text-[#8C8992]
          "
        >
          A safe space when you need it
        </Text>
      </View>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                              TOGGLE TAB BAR                                */
/* -------------------------------------------------------------------------- */

const ToggleTabBar = ({
  activeTab,
  onTabPress,
}) => {
  return (
    <View
      className="
        mx-5
        mt-3
        mb-2
        p-1
        rounded-[20px]
        bg-white
        border
        border-[#ECE6E2]
        shadow-sm
      "
    >
      <View className="flex-row">
        {TABS.map((tab) => {
          const isActive =
            activeTab === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.82}
              onPress={() => {
                Haptics
                  .selectionAsync()
                  .catch(() => {});

                onTabPress(tab.id);
              }}
              className={`
                flex-1
                min-h-[42px]
                px-1.5
                rounded-[16px]
                flex-row
                items-center
                justify-center

                ${
                  isActive
                    ? "bg-[#6D5AB5]"
                    : "bg-transparent"
                }
              `}
            >
              {/* Icon bubble */}

              <View
                className={`
                  w-7
                  h-7
                  rounded-full
                  items-center
                  justify-center
                  mr-1.5

                  ${
                    isActive
                      ? "bg-white/15"
                      : "bg-[#F2EEF9]"
                  }
                `}
              >
                <Ionicons
                  name={
                    isActive
                      ? tab.activeIcon
                      : tab.icon
                  }
                  size={14}
                  color={
                    isActive
                      ? "#FFFFFF"
                      : colors.purple
                  }
                />
              </View>

              {/* Label */}

              <Text
                numberOfLines={1}
                className={`
                  text-[11.5px]
                  font-bold

                  ${
                    isActive
                      ? "text-white"
                      : "text-[#706A76]"
                  }
                `}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                              SUPPORT INTRO                                 */
/* -------------------------------------------------------------------------- */

const SupportIntro = ({
  activeTab,
}) => {
  const current =
    TAB_MESSAGES[activeTab];

  if (!current) {
    return null;
  }

  return (
    <Animated.View
      key={`intro-${activeTab}`}
      entering={FadeIn.duration(220)}
      className="
        mx-5
        mb-2.5
        px-3
        py-2.5
        rounded-[18px]
        bg-[#F2EEF9]
        border
        border-[#E6DEEF]
        flex-row
        items-center
      "
    >
      {/* Icon */}

      <View
        className="
          w-8
          h-8
          rounded-xl
          bg-white
          items-center
          justify-center
          mr-2.5
        "
      >
        <Ionicons
          name={current.icon}
          size={16}
          color={colors.purple}
        />
      </View>

      {/* Content */}

      <View className="flex-1">
        <Text
          className="
            text-[12px]
            font-bold
            text-[#1F1F2E]
          "
        >
          {current.title}
        </Text>

        <Text
          className="
            mt-0.5
            text-[10px]
            leading-[14px]
            text-[#8C8992]
          "
        >
          {current.description}
        </Text>
      </View>
    </Animated.View>
  );
};

/* -------------------------------------------------------------------------- */
/*                                MAIN SCREEN                                 */
/* -------------------------------------------------------------------------- */

const ChatLayout = () => {
  const [
    tab,
    setTab,
  ] = useState(0);

  const [
    activeCounselor,
    setActiveCounselor,
  ] = useState(null);

  /* ------------------------------------------------------------------------ */
  /*                           SELECT COUNSELOR                               */
  /* ------------------------------------------------------------------------ */

  const handleSetActiveCounselor =
    useCallback(
      (counselor) => {
        setActiveCounselor(
          counselor
        );
      },
      []
    );

  /* ------------------------------------------------------------------------ */
  /*                              CHANGE TAB                                  */
  /* ------------------------------------------------------------------------ */

  const handleTabPress =
    useCallback(
      (tabId) => {
        setTab(tabId);

        setActiveCounselor(
          null
        );
      },
      []
    );

  /* ------------------------------------------------------------------------ */
  /*                                  SCREEN                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      {/* ================================================================ */}
      {/* STACK HEADER                                                     */}
      {/* ================================================================ */}

      <Stack.Screen
        options={{
          headerTitle: () => (
            <SupportHeader />
          ),

          headerStyle: {
            backgroundColor:
              colors.background,
          },

          headerShadowVisible:
            false,

          headerTintColor:
            colors.purple,

          headerTitleAlign:
            "left",
        }}
      />

      {/* ================================================================ */}
      {/* MAIN AREA                                                        */}
      {/* ================================================================ */}

      <SafeAreaView
        edges={[
          "left",
          "right",
          "bottom",
        ]}
        className="
          flex-1
          bg-[#F9F5F1]
        "
      >
        <KeyboardAvoidingView
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
          keyboardVerticalOffset={
            Platform.OS === "ios"
              ? 88
              : 0
          }
          className="
            flex-1
            bg-[#F9F5F1]
          "
        >
          {/* ============================================================ */}
          {/* SUPPORT TYPE SELECTOR                                        */}
          {/* ============================================================ */}

          {!activeCounselor && (
            <>
              <ToggleTabBar
                activeTab={tab}
                onTabPress={
                  handleTabPress
                }
              />

              <SupportIntro
                activeTab={tab}
              />
            </>
          )}

          {/* ============================================================ */}
          {/* CONTENT                                                      */}
          {/* ============================================================ */}

          <View className="flex-1">
            {activeCounselor ? (
              /* -------------------------------------------------------- */
              /* ACTIVE COUNSELOR CHAT                                    */
              /* -------------------------------------------------------- */

              <Animated.View
                key="counselor-chat"
                entering={FadeIn.duration(
                  220
                )}
                className="
                  flex-1
                  bg-[#F9F5F1]
                "
              >
                <CounselorChatRoom
                  counselor={
                    activeCounselor
                  }
                  onBack={() =>
                    handleSetActiveCounselor(
                      null
                    )
                  }
                />
              </Animated.View>
            ) : tab === 0 ? (
              /* -------------------------------------------------------- */
              /* AI SUPPORT                                               */
              /* -------------------------------------------------------- */

              <Animated.View
                key="ai-chat"
                entering={FadeIn.duration(
                  220
                )}
                className="
                  flex-1
                  bg-[#F9F5F1]
                "
              >
                <AIChatScreen />
              </Animated.View>
            ) : (
              /* -------------------------------------------------------- */
              /* ANONYMOUS COUNSELOR                                      */
              /* -------------------------------------------------------- */

              <Animated.View
                key="anonymous-chat"
                entering={FadeIn.duration(
                  220
                )}
                className="
                  flex-1
                  bg-[#F9F5F1]
                "
              >
                <AnonymousCounselorScreen
                  setActiveCounselor={
                    handleSetActiveCounselor
                  }
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