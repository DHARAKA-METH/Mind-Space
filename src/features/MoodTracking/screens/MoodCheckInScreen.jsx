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
  Alert,
} from "react-native";

import { Stack } from "expo-router";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";

import { icons } from "@/src/shared/assets/icons/icons";
import { moods } from "@/src/shared/constants/mood.config";


// FIREBASE
import { db } from "@/src/config/firebase";
import { addDoc, collection } from "firebase/firestore";

// SERVICES (you will create these files)
import { sanitizeMoodData } from "../services/sanitizeMood";
import { detectRisk } from "../services/riskDetection";
import { getMoodHistory,calculateHistoryAverage } from "../services/moodHistory";
import { analyzeMoodWithAI } from "../services/aiService";
import { calculateStress } from "../services/stressCalculator";
import { getAuth } from "firebase/auth";

export default function MoodCheckInScreen() {
  const [selectedMood, setSelectedMood] = useState("meh");
  const [stressLevel, setStressLevel] = useState(2);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = getAuth();

const userID = auth.currentUser;
const userId = userID ? userID.uid : null;


  const handleSave = async () => {
    try {
      setLoading(true);

      // 1. Sanitize input
      const clean = sanitizeMoodData({
        mood: selectedMood,
        selfStress: stressLevel,
        note: note,
      });

      // 2. Risk detection
      if (detectRisk(clean.note)) {
        Alert.alert(
          "Support Notice",
          "You seem overwhelmed. Please take a break or talk to someone."
        );
        return;
      }

      // 3. Get history
      const history = await getMoodHistory(userId);
      const historyAvg = calculateHistoryAverage(history);

      // 4. Build AI payload
      const payload = {
        mood: clean.mood,
        userStress: clean.selfStress,
        note: clean.note,
        historyAverage: historyAvg,
      };

      // 5. CALL AI (ONE CALL ONLY)
      const aiResult = await analyzeMoodWithAI(payload);

      // 6. Calculate final stress
      const finalStress = calculateStress(
        clean.selfStress,
        aiResult.aiStressLevel,
        historyAvg
      );

      // 7. Save mood entry
      await addDoc(collection(db, "moodEntries"), {
        userId,
        mood: clean.mood,
        selfStress: clean.selfStress,
        aiStress: aiResult.aiStressLevel,
        finalStress,
        note: clean.note,
        createdAt: new Date(),
      });

      // 8. Save recommendations
      for (const rec of aiResult.recommendations || []) {
        await addDoc(collection(db, "recommendations"), {
          userId,
          category: rec.category,
          title: rec.title,
          description: rec.description,
          link: rec.link,
          source: "AI",
          createdAt: new Date(),
          isDismissed: false,
        });
      }

      Alert.alert(
        "Saved",
        `Stress Level: ${finalStress.toFixed(1)}`
      );

      // reset
      setNote("");
      setStressLevel(4);
      setSelectedMood("meh");

    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#F9FAF5]"
    >
      <Stack.Screen
        options={{
          headerTitle: "Mood Check-in",
          headerShadowVisible: false,
        }}
      />

      <ScrollView className="px-6">

        {/* MOOD */}
        <View className="flex-row justify-between mt-4 mb-10">
          {moods.map((mood) => {
            const active = selectedMood === mood.id;

            return (
              <TouchableOpacity
                key={mood.id}
                onPress={() => setSelectedMood(mood.id)}
                className="items-center"
              >
                <View
                  style={{
                    backgroundColor: mood.bg,
                    borderWidth: active ? 3 : 0,
                    borderColor: "#9D5BFF",
                  }}
                  className="w-14 h-14 rounded-[20px] items-center justify-center mb-2"
                >
                  <Image
                    source={active ? mood.icon : mood.outline}
                    className="w-8 h-8"
                  />
                </View>

                <Text className="text-xs font-semibold">
                  {mood.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* STRESS */}
        <View className="bg-white p-6 rounded-3xl mb-6">
          <Text className="text-xl font-bold">
            Stress Level: {stressLevel}/10
          </Text>

          <Slider
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={stressLevel}
            onValueChange={setStressLevel}
            minimumTrackTintColor="#C8E86A"
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor="#000"
          />
        </View>

        {/* NOTE */}
        <View className="bg-white p-6 rounded-3xl">
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Write your thoughts..."
            multiline
            className="h-32"
          />
        </View>
      </ScrollView>

      {/* BUTTON */}
      <View className="p-6">
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          className="bg-black h-14 rounded-2xl items-center justify-center"
        >
          <Text className="text-white font-bold">
            {loading ? "Saving..." : "Save Check-in"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}