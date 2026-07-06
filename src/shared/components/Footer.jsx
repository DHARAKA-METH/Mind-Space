import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TAB_ICONS = {
  Home: { active: "home", inactive: "home-outline" },
  Mood: { active: "happy", inactive: "happy-outline" },
  Assistant: { active: "chatbubble", inactive: "chatbubble-outline" },
  Wellness: { active: "pulse", inactive: "pulse-outline" },
};

const Footer = ({ activeTab, setActiveTab }) => {
  const tabs = ["Home", "Mood", "Assistant", "Wellness"];

  return (
    <View pointerEvents="box-none" className="items-center">
      <View className="bg-white rounded-full border border-[#ebb557] flex-row items-center justify-center px-6 py-4 gap-2 shadow-lg shadow-black/20">
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
                  width: 46,
                  height: 46,
                  borderRadius: 16,
                  backgroundColor: isActive ? "#1c1917" : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                   overflow: "hidden",
                }}
              >
                <Ionicons
                  name={isActive ? icons.active : icons.inactive}
                  size={22}
                  color={isActive ? "#FFF" : "#A8A29E"}
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
