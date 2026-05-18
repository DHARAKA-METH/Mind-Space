import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { icons } from "@/src/shared/assets/icons/icons";
import { moods } from "@/src/shared/constants/mood.config";

export default function MoodCheckInScreen() {
  const [selectedMood, setSelectedMood] = useState("Meh");
  const [stressLevel, setStressLevel] = useState(4);
  const [note, setNote] = useState("");

  // Logic to handle the console output
  const handleSave = () => {
    const checkInData = {
      mood: selectedMood,
      stress: stressLevel,
      journalNote: note,
      timestamp: new Date().toISOString(),
    };

    

    console.log("📝 Mood Check-in Saved:", checkInData);
    // Add your navigation or API call here
    setNote(""); 
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#F9FAF5]"
    >
      <Stack.Screen
        options={{
          headerTitle: "Mood Check-in",
          headerTitleStyle: { fontWeight: "600", fontSize: 18 },
          headerStyle: { backgroundColor: "#F9FAF5" },
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        className="px-6"
      >
        <View className="items-center mt-4 mb-8">
          <Text className="text-gray-400 text-lg font-medium">
            How are you feeling right now?
          </Text>
        </View>

        {/* MOOD SELECTION */}
        <View className="flex-row justify-between mb-10">
          {moods.map((mood) => {
            const isActive = selectedMood === mood.id;
            return (
              <TouchableOpacity
                key={mood.id}
                onPress={() => setSelectedMood(mood.id)}
                className="items-center"
              >
                <View
                  style={{
                    backgroundColor: mood.bg,
                    borderWidth: isActive ? 3 : 0,
                    borderColor: "#9D5BFF",
                  }}
                  className="w-14 h-14 rounded-[20px] items-center justify-center mb-2"
                >
                  <Image
                    source={isActive ? mood.icon : mood.outline}
                    className="w-8 h-8"
                    resizeMode="contain"
                    style={{ opacity: isActive ? 1 : 0.6 }}
                  />
                </View>
                <Text
                  className={`text-[12px] font-semibold ${isActive ? "text-dark" : "text-gray-400"}`}
                >
                  {mood.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* STRESS LEVEL CARD */}
        <View className="bg-white rounded-[32px] p-6 mb-6 border border-gray-50 shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-dark">Stress level</Text>
            <Text className="text-2xl font-black text-dark">
              {stressLevel} / 10
            </Text>
          </View>

          {/* SLIDER - Made more bold with thumb and track colors */}
          <Slider
            style={{ width: "100%", height: 50 }} // Increased height for easier touch
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={stressLevel}
            onValueChange={setStressLevel}
            minimumTrackTintColor="#C8E86A" // Bright green for the "filled" part
            maximumTrackTintColor="#E5E7EB" // Soft gray for the "unfilled" part
            thumbTintColor="#1A1A1E" // Bold dark thumb
          />

          <View className="flex-row justify-between px-1">
            <Text className="text-gray-400 font-bold text-[12px]">
              😌 Relaxed
            </Text>
            <Text className="text-gray-400 font-bold text-[12px]">
              🤯 Stressed
            </Text>
          </View>
        </View>

        {/* JOURNAL SECTION */}
        <View className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50">
          <View className="flex-row items-center mb-4">
            <View className="bg-[#FFF4E8] p-2 rounded-lg mr-3">
              <Image
                source={icons.journal}
                className="w-5 h-5"
                style={{ tintColor: "#FFB067" }}
              />
            </View>
            <Text className="text-xl font-bold text-dark">Note</Text>
          </View>

          <TextInput
            className="bg-[#F9FAF9] rounded-2xl p-5 h-32 text-dark text-base"
            placeholder="Write what's on your mind today..."
            placeholderTextColor="#ADB5BD"
            multiline
            textAlignVertical="top"
            value={note}
            onChangeText={setNote}
          />
        </View>
      </ScrollView>

      {/* FIXED FOOTER BUTTON */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-[#F9FAF5]/90">
        <TouchableOpacity
          onPress={handleSave} // Trigger console log
          className="bg-[#1A1A1E] h-16 rounded-[24px] flex-row items-center justify-center shadow-xl"
          activeOpacity={0.9}
        >
          <Text className="text-[#E7F7A7] text-lg font-bold mr-2">
            Save check-in
          </Text>
          <Ionicons name="checkmark-circle" size={20} color="#E7F7A7" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
