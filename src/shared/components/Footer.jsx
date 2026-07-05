import React from "react";
import { View, TouchableOpacity } from "react-native";
import { SvgUri } from "react-native-svg";

const ICON_BASE =
  "https://raw.githubusercontent.com/feathericons/feather/master/icons";

const Footer = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      name: "Home",
      iconUrl: `${ICON_BASE}/home.svg`,
      route: "",
    },
    {
      name: "Mood",
      iconUrl: `${ICON_BASE}/smile.svg`,
      route: "",
    },
    // {
    //   name: "New",
    //   iconUrl: `${ICON_BASE}/plus.svg`,
    //   route: "",
    // },
    {
      name: "Assistant",
      iconUrl: `${ICON_BASE}/message-circle.svg`,
      route: "",
    },
    {
      name: "Wellness",
      iconUrl: `${ICON_BASE}/activity.svg`,
      route: "",
    },
  ];

  return (
    <View  pointerEvents="box-none" className=" absolute bottom-12 left-0 right-0 items-center">
      <View className="bg-white rounded-full border border-[#ebb557] flex-row items-center justify-center px-6 py-6 gap-2 shadow-lg shadow-black/20">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => setActiveTab(tab.name)}
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
                <SvgUri
                  uri={tab.iconUrl}
                  width={22}
                  height={22}
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
