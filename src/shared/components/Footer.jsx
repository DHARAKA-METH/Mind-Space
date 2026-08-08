import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TAB_ICONS = {
  Home: { active: "home", inactive: "home-outline" },
  Mood: { active: "happy", inactive: "happy-outline" },
  Assistant: { active: "chatbubble", inactive: "chatbubble-outline" },
  Sessions: { active: "calendar", inactive: "calendar-outline" },
  Wellness: { active: "pulse", inactive: "pulse-outline" },
};

const Footer = ({ activeTab, setActiveTab }) => {
  const tabs = ["Home", "Mood", "Assistant", "Sessions", "Wellness"];

  return (
    <View pointerEvents="box-none" className="items-center pb-2">
      <View
        className="rounded-full flex-row items-center justify-center px-4 py-2 gap-1"
        style={{
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "#ECE5E0",
          shadowColor: "#252330",
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        {tabs.map((name) => {
          const isActive = activeTab === name;
          const icons = TAB_ICONS[name];
          return (
            <TouchableOpacity
              key={name}
              onPress={() => setActiveTab(name)}
              activeOpacity={0.8}
            >
              <View
                style={{
                  width: 35,
                  height: 35,
                  borderRadius: 14,
                  backgroundColor: isActive ? "#8D7BB8" : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <Ionicons
                  name={isActive ? icons.active : icons.inactive}
                  size={21}
                  color={isActive ? "#FFF" : "#A29CA7"}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default Footer;
