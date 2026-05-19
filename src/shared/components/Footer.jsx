import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";

import { icons } from "@/src/shared/assets/icons/icons";
import { router } from "expo-router";

const Footer = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      name: "Home",
      icon: icons.home,
      route: "/Route/(mood)/moodDashboard",
    },
    {
      name: "Mood",
      icon: icons.mood_good_outline,
      route: "/Route/(mood)/moodCalender",
    },
    {
      name: "New",
      icon: icons.add,
      route: "/Route/(mood)/moodCheckIn",
    },
    {
      name: "Assistant",
      icon: icons.assistant,
      route: "/Route/(mood)/moodAssistant",
    },
    {
      name: "Wellness",
      icon: icons.Wellness,
      route: "/Route/(appointments)/BookSession",
    },
  ];

  return (
    <View className="flex-row justify-around items-center bg-white py-4 border-t border-gray-100">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name;

        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => {
              setActiveTab(tab.name);
              router.push(tab.route);
            }}
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