import { getGreeting, getGreetingIcon } from "@/src/core/utils/time";
import { Stack } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { icons } from "../../../shared/assets/icons/icons";
import { useState } from "react";
import Footer from "@/src/shared/components/Footer";

const CustomHeader = () => {
  return (
    <View className="flex-row justify-between items-center w-full px-4">
      {/* Left */}
      <View>
        <Text className="text-gray-400 text-xl">
          {getGreeting()},
        </Text>

        <View className="flex-row items-center">
          <Text className="text-3xl font-bold text-black">
            Alex Chen
          </Text>

          <Text className="text-2xl ml-1">
            {getGreetingIcon()}
          </Text>
        </View>
      </View>

      {/* Right */}
      <View className="flex-row items-center gap-2 mt-6">
        <TouchableOpacity className="bg-peach/30 p-3 rounded-full mr-2">
          <Image
            source={icons.notification}
            className="w-6 h-6"
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View>
          <TouchableOpacity className="bg-primary p-1 rounded-full border-2 border-white">
            <Image
              source={icons.profile}
              className="w-8 h-8 rounded-full"
              resizeMode="cover"
            />
          </TouchableOpacity>

          <View className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />
        </View>
      </View>
    </View>
  );
};

const ActionCard = ({ title, color, icon, textColor }) => {
  return (
    <TouchableOpacity
      className={`${color} w-[30%] aspect-square rounded-[30px] items-center justify-center p-4`}
    >
      <View className="bg-white/30 p-2 rounded-xl mb-2">
        <Image source={icon} className="w-8 h-8" />
      </View>

      <Text className={`${textColor} font-bold`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default function DashboardScreen() {
  const [activeCategory, setActiveCategory] = useState("Activity");

  const suggestions = [
    {
      id: 1,
      title: "Take a 5-min session",
      subtitle: "5 min • 3 exercises",
      points: "+20",
      icon: icons.heart,
    },
    {
      id: 2,
      title: "Write your thoughts",
      subtitle: "Journal • 10 min",
      points: "+15",
      icon: icons.journal,
    },
    {
      id: 3,
      title: "Talk with counselor",
      subtitle: "Support • Available now",
      points: "+30",
      icon: icons.talk,
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => <CustomHeader />,
          headerStyle: {
            backgroundColor: "#F9FAF5",
          },
          headerShadowVisible: false,
        }}
      />

      <View className="flex-1 bg-background">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 32,
            paddingTop: 40,
            paddingBottom: 140,
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* CATEGORY ROW */}
          <View className="flex-row justify-between mb-6">
            {["Activity", "Mood", "Food", "Sleep"].map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full border ${
                  activeCategory === cat
                    ? "bg-white border-dark"
                    : "bg-gray-100 border-transparent"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    activeCategory === cat
                      ? "text-dark"
                      : "text-gray-400"
                  }`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* MOOD CARD */}
          <View className="bg-primary/40 rounded-3xl p-5 mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-2xl font-caveat  text-dark">
                My Mood Today
              </Text>

              <Text className="text-gray-400 text-lg">
                •••
              </Text>
            </View>

            <View className="flex-row items-center justify-between bg-white/40 rounded-2xl p-4">
              <View className="flex-1 pr-3">
                <Text className="text-dark font-bold text-base mb-1">
                  Feeling good!
                </Text>

                <Text className="text-gray-500 text-sm">
                  Keep your positive energy going ✨
                </Text>
              </View>

              <View className="bg-white/40 p-3 rounded-2xl mr-3">
                <Image
                  source={icons.mood_good_outline}
                  className="w-10 h-10"
                />
              </View>
            </View>
          </View>

          {/* ACTIONS HEADER */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-caveat  text-dark">
              Actions
            </Text>

            <Text className="text-gray-400">
              See all →
            </Text>
          </View>

          {/* ACTION CARDS */}
          <View className="flex-row justify-between mb-8">
            <ActionCard
              title="Meditate"
              color="bg-lavender"
              icon={icons.meditate}
              textColor="text-purple-600"
            />

            <ActionCard
              title="Journal"
              color="bg-peach"
              icon={icons.journal}
              textColor="text-orange-600"
            />

            <ActionCard
              title="Talk"
              color="bg-skyBlue"
              icon={icons.talk}
              textColor="text-blue-600"
            />
          </View>

          {/* SUGGESTIONS */}
          <View className="mb-10">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-2xl font-caveat  text-dark">
                Activity Suggestions
              </Text>

              <Text className="text-gray-400 text-lg">
                →
              </Text>
            </View>

            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="bg-primary p-5 rounded-3xl flex-row items-center justify-between mb-4"
              >
                {/* LEFT */}
                <View className="flex-row items-center flex-1">
                  <View className="bg-white/40 p-3 rounded-2xl mr-3">
                    <Image
                      source={item.icon}
                      className="w-6 h-6"
                      resizeMode="contain"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-dark font-bold text-base">
                      {item.title}
                    </Text>

                    <Text className="text-dark/60 text-sm mt-1">
                      {item.subtitle}
                    </Text>
                  </View>
                </View>

                {/* RIGHT */}
                <View className="items-end">
                  <Text className="text-dark font-bold text-lg">
                    {item.points}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </>
  );
}