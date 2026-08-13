import React from "react";
import {
  View,
  TouchableOpacity,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import * as Haptics from "expo-haptics";

import { studentColors } from "@/src/theme";

/* -------------------------------------------------------------------------- */
/*                                  ICONS                                     */
/* -------------------------------------------------------------------------- */

const TAB_ICONS = {
  Home: {
    active: "home",
    inactive: "home-outline",
  },

  Mood: {
    active: "happy",
    inactive: "happy-outline",
  },

  Assistant: {
    active: "chatbubble",
    inactive: "chatbubble-outline",
  },

  Sessions: {
    active: "calendar",
    inactive: "calendar-outline",
  },

  Wellness: {
    active: "pulse",
    inactive: "pulse-outline",
  },
};

/* -------------------------------------------------------------------------- */
/*                                  FOOTER                                    */
/* -------------------------------------------------------------------------- */

const Footer = ({
  activeTab,
  setActiveTab,
}) => {
  const tabs = [
    "Home",
    "Mood",
    "Assistant",
    "Sessions",
    "Wellness",
  ];

  const handleTabPress = (
    name
  ) => {
    Haptics
      .selectionAsync()
      .catch(() => {});

    setActiveTab(name);
  };

  return (
    <View
      pointerEvents="box-none"
      className="
        items-center
        justify-center
        pb-2
        px-4
      "
    >
      {/* ------------------------------------------------------------ */}
      {/* Transparent navigation container                             */}
      {/* ------------------------------------------------------------ */}

      <View
        className="
          flex-row
          items-center
          justify-center
          bg-transparent
          px-2
          py-1
        "
      >
        {tabs.map((name) => {
          const isActive =
            activeTab === name;

          const icons =
            TAB_ICONS[name];

          return (
            <TouchableOpacity
              key={name}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`${name} tab`}
              accessibilityState={{
                selected: isActive,
              }}
              onPress={() =>
                handleTabPress(
                  name
                )
              }
              className="
                w-[58px]
                h-[54px]
                items-center
                justify-center
              "
            >
              {/* ---------------------------------------------------- */}
              {/* Icon background                                     */}
              {/* ---------------------------------------------------- */}

              <View
                className={`
                  w-[44px]
                  h-[44px]
                  rounded-[16px]
                  items-center
                  justify-center

                  ${
                    isActive
                      ? "bg-app-primarySoft"
                      : "bg-transparent"
                  }
                `}
              >
                <Ionicons
                  name={
                    isActive
                      ? icons.active
                      : icons.inactive
                  }
                  size={
                    isActive
                      ? 22
                      : 21
                  }
                  color={
                    isActive
                      ? studentColors.primary
                      : studentColors.textMuted
                  }
                />

                {/* Active indicator */}

                {isActive && (
                  <View
                    className="
                      absolute
                      -bottom-1
                      w-[5px]
                      h-[5px]
                      rounded-full
                      bg-app-primary
                    "
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default Footer;
