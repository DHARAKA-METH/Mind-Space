import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";

import { icons } from "@/src/shared/assets/icons/icons";

const Footer = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      name: "Home",
      icon: icons.home,
    },
    {
      name: "Mood",
      icon: icons.mood_good_outline,
    },
    {
      name: "New",
      icon: icons.add,
    },
    {
      name: "Assistant",
      icon: icons.assistant,
    },
    {
      name: "Wellness",
      icon: icons.Wellness,
    },
  ];

  return (
    <View className="flex-row justify-around items-center bg-white py-4 border-t border-gray-100">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name;

        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => setActiveTab(tab.name)}
            className="items-center"
          >
            {/* ICON CONTAINER */}
            <View
              className={`p-3 rounded-full ${
                isActive ? "bg-primary" : "bg-gray-100"
              }`}
            >
              <Image
                source={tab.icon}
                className="w-6 h-6"
                resizeMode="contain"
              />
            </View>

            {/* LABEL */}
            <Text
              className={`text-xs mt-1 ${
                isActive
                  ? "text-dark font-bold"
                  : "text-gray-400"
              }`}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default Footer;