import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

const ceylon = {
  ink: "#3D2E1F",
  muted: "#8A7A63",
  mutedLight: "#B8A78C",
  teaGreen: "#4A7856",
  sage: "#7C9885",
  terracotta: "#C97B4A",
  sand: "#F0E4D3",
  cream: "#FBF3EA",
  background: "#F4EFE9",
  danger: "#B5555C",
  dangerBg: "#F7DDD6",
};

const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

const TODAYS_APPOINTMENTS = [
  { id: "ap1", time: "10:00 AM", studentTag: "Student #C312", type: "Online", duration: "45 min" },
  { id: "ap2", time: "1:30 PM", studentTag: "Student #D118", type: "Physical", duration: "30 min" },
];

const AppointmentRow = ({ appt, delay }: any) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
    <View
      className="flex-row items-center"
      style={{ backgroundColor: "#fff", borderRadius: 18, padding: SPACE.md, marginBottom: SPACE.sm }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: `${ceylon.terracotta}18`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="alarm-outline" size={18} color={ceylon.terracotta} />
      </View>
      <View style={{ flex: 1, marginLeft: SPACE.md }}>
        <Text style={{ fontWeight: "700", fontSize: 13, color: ceylon.ink }}>
          {appt.time} — {appt.studentTag}
        </Text>
        <View className="flex-row items-center" style={{ gap: 5, marginTop: 2 }}>
          <Ionicons
            name={appt.type === "Online" ? "videocam-outline" : "location-outline"}
            size={12}
            color={ceylon.muted}
          />
          <Text style={{ fontSize: 11, color: ceylon.muted }}>
            {appt.type} · {appt.duration}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={ceylon.mutedLight} />
    </View>
  </Animated.View>
);

export default function AppointmentsScreen({ onBack }: any) {
  return (
    <View className="flex-1" style={{ backgroundColor: ceylon.background }}>
      <View
        className="flex-row items-center p-4"
        style={{ backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: ceylon.sand }}
      >
        <TouchableOpacity onPress={onBack} className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: ceylon.background }}>
          <Ionicons name="chevron-back" size={18} color={ceylon.ink} />
        </TouchableOpacity>
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <Ionicons name="calendar" size={18} color={ceylon.ink} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: ceylon.ink }}>Appointments</Text>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: SPACE.lg, paddingBottom: SPACE.xxl }}
      >
        <Animated.Text
          entering={FadeIn.duration(300)}
          style={{ fontSize: 13, color: ceylon.muted, marginBottom: SPACE.md }}
        >
          {TODAYS_APPOINTMENTS.length} appointment{TODAYS_APPOINTMENTS.length !== 1 ? "s" : ""} today
        </Animated.Text>
        {TODAYS_APPOINTMENTS.map((appt, i) => (
          <AppointmentRow key={appt.id} appt={appt} delay={100 + i * 60} />
        ))}
      </ScrollView>
    </View>
  );
}
