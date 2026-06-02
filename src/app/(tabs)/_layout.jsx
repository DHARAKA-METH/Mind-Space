import { useState } from "react";
import { View } from "react-native";

import Footer from "../../shared/components/Footer";

// screens
import HomeScreen from "../(tabs)/(mood)/moodDashboard";
import MoodScreen from "../(tabs)/(mood)/moodCalender";
import MoodCheckIn from "../(tabs)/(mood)/moodCheckIn";
import ChatScreen from "../(tabs)/(chat)/chat";
import BookSession from "../(tabs)/(appointments)/BookSession";
import RecommendationScreen from "../(tabs)/(Recommendation)/Recommendations";




import AppointmentsScreen from "../(tabs)/(appointments)/BookSession";

export default function TabLayout() {
  const [activeTab, setActiveTab] = useState("Home");

  const renderScreen = () => {
    switch (activeTab) {
      case "Home":
        return <HomeScreen />;
      case "Mood":
        return <MoodScreen />;
      case "New":
        return <MoodCheckIn />;
      case "Assistant":
        return <ChatScreen />;
      case "Wellness":
        return <RecommendationScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* SCREEN */}
      <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>

      {/* FOOTER */}
      <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
    </View>
  );
}