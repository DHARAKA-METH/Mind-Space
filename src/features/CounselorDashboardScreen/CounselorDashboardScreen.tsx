import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

// ─── MOCK DATA — swap for real Firestore/query data ────────────────────────
const COUNSELOR_USER = { name: "Ms. R. Silva", role: "Counselor" };

const STRESS_ALERTS = [
  {
    id: "a1",
    studentTag: "Student #A104",
    detail: "Stress level 9 — needs attention",
    emoji: "😰",
    urgent: true,
  },
  {
    id: "a2",
    studentTag: "Student #B207",
    detail: "Mood declining for 3 days",
    emoji: "😔",
    urgent: false,
  },
];

const TODAYS_APPOINTMENTS = [
  { id: "ap1", time: "10:00 AM", studentTag: "Student #C312", type: "Online", duration: "45 min" },
  { id: "ap2", time: "1:30 PM", studentTag: "Student #D118", type: "Physical", duration: "30 min" },
];

const STATS = { activeChats: 7, todaysAppts: 4 };

// ─── STAT CARD ──────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, bg, icon, delay }: any) => (
  <Animated.View
    entering={FadeInDown.delay(delay).duration(320)}
    style={{
      flex: 1,
      backgroundColor: bg,
      borderRadius: 22,
      padding: SPACE.lg,
    }}
  >
    <View className="flex-row items-center justify-between" style={{ marginBottom: SPACE.sm }}>
      <Text style={{ fontSize: 11, color, fontWeight: "700" }}>{label}</Text>
      <Ionicons name={icon} size={15} color={color} />
    </View>
    <Text style={{ fontSize: 32, fontWeight: "800", color }}>{value}</Text>
  </Animated.View>
);

// ─── STRESS ALERT ROW ───────────────────────────────────────────────────────
const StressAlertRow = ({ alert, onChat, delay }: any) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
    <View
      className="flex-row items-center"
      style={{
        backgroundColor: alert.urgent ? ceylon.dangerBg : "#fff",
        borderRadius: 18,
        padding: SPACE.md,
        marginBottom: SPACE.sm,
        borderWidth: alert.urgent ? 0 : 1,
        borderColor: ceylon.sand,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: alert.urgent ? "#fff" : ceylon.sand,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 20 }}>{alert.emoji}</Text>
      </View>

      <View style={{ flex: 1, marginLeft: SPACE.md }}>
        <Text style={{ fontWeight: "700", fontSize: 13, color: alert.urgent ? ceylon.danger : ceylon.ink }}>
          {alert.studentTag}
        </Text>
        <Text style={{ fontSize: 11, color: alert.urgent ? "#9A4A50" : ceylon.muted, marginTop: 2 }}>
          {alert.detail}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onChat(alert);
        }}
        style={{
          backgroundColor: alert.urgent ? ceylon.danger : ceylon.sand,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: alert.urgent ? "#fff" : ceylon.ink, fontSize: 12, fontWeight: "700" }}>
          Chat
        </Text>
      </TouchableOpacity>
    </View>
  </Animated.View>
);

// ─── TODAY'S APPOINTMENT ROW ────────────────────────────────────────────────
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

// ─── BOTTOM NAV ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: "board", label: "Board", icon: "grid-outline", activeIcon: "grid" },
  { key: "chats", label: "Chats", icon: "chatbubble-outline", activeIcon: "chatbubble" },
  { key: "appts", label: "Appts", icon: "calendar-outline", activeIcon: "calendar" },
  { key: "reports", label: "Reports", icon: "bar-chart-outline", activeIcon: "bar-chart" },
] as const;

const BottomNav = ({ active, onChange }: any) => (
  <View
    className="flex-row items-center justify-between"
    style={{
      backgroundColor: "#fff",
      paddingHorizontal: SPACE.xl,
      paddingTop: SPACE.sm,
      paddingBottom: SPACE.md,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: -3 },
      elevation: 6,
    }}
  >
    {NAV_ITEMS.map((item) => {
      const isActive = active === item.key;
      return (
        <TouchableOpacity
          key={item.key}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onChange(item.key);
          }}
          className="items-center"
          style={{ flex: 1, paddingVertical: 4 }}
        >
          {item.key === "board" ? (
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: isActive ? ceylon.sage : "transparent",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 3,
              }}
            >
              <Ionicons
                name={isActive ? item.activeIcon : item.icon}
                size={20}
                color={isActive ? "#fff" : ceylon.mutedLight}
              />
            </View>
          ) : (
            <Ionicons
              name={isActive ? item.activeIcon : item.icon}
              size={22}
              color={isActive ? ceylon.teaGreen : ceylon.mutedLight}
              style={{ marginBottom: 3 }}
            />
          )}
          <Text
            style={{
              fontSize: 10,
              fontWeight: isActive ? "700" : "500",
              color: isActive ? ceylon.teaGreen : ceylon.mutedLight,
            }}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── BOARD (main dashboard) ─────────────────────────────────────────────────
const CounselorBoard = ({ onOpenChat, onViewAppointments }: any) => {
  const urgentCount = useMemo(() => STRESS_ALERTS.filter((a) => a.urgent).length, []);

  return (
    <View className="flex-1" style={{ backgroundColor: ceylon.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: SPACE.lg, paddingBottom: SPACE.xxl }}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} className="flex-row items-center justify-between" style={{ marginBottom: SPACE.xl }}>
          <View>
            <Text style={{ fontSize: 13, color: ceylon.muted }}>Welcome back,</Text>
            <Text style={{ fontSize: 20, fontWeight: "800", color: ceylon.ink, marginTop: 2 }}>
              {COUNSELOR_USER.name}
            </Text>
          </View>
          <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="notifications-outline" size={20} color={ceylon.ink} />
            {urgentCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  right: 9,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: ceylon.danger,
                }}
              />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Stat cards */}
        <View className="flex-row" style={{ gap: SPACE.md, marginBottom: SPACE.xl }}>
          <StatCard
            label="ACTIVE CHATS"
            value={STATS.activeChats}
            color={ceylon.teaGreen}
            bg={`${ceylon.sage}20`}
            icon="chatbubbles-outline"
            delay={60}
          />
          <StatCard
            label="TODAY'S APPTS"
            value={STATS.todaysAppts}
            color={ceylon.terracotta}
            bg={ceylon.sand}
            icon="calendar-outline"
            delay={120}
          />
        </View>

        {/* High-stress alerts */}
        <View className="flex-row items-center" style={{ marginBottom: SPACE.md, gap: 6 }}>
          <Ionicons name="alert-circle" size={16} color={ceylon.danger} />
          <Text style={{ fontSize: 14, fontWeight: "700", color: ceylon.ink }}>High-stress alerts</Text>
        </View>
        {STRESS_ALERTS.length === 0 ? (
          <View style={{ backgroundColor: "#fff", borderRadius: 18, padding: SPACE.lg, marginBottom: SPACE.xl, alignItems: "center" }}>
            <Ionicons name="leaf-outline" size={20} color={ceylon.sage} style={{ marginBottom: 6 }} />
            <Text style={{ fontSize: 12, color: ceylon.muted }}>No alerts right now</Text>
          </View>
        ) : (
          <View style={{ marginBottom: SPACE.xl }}>
            {STRESS_ALERTS.map((a, i) => (
              <StressAlertRow key={a.id} alert={a} onChat={onOpenChat} delay={160 + i * 60} />
            ))}
          </View>
        )}

        {/* Today's appointments */}
        <View className="flex-row items-center justify-between" style={{ marginBottom: SPACE.md }}>
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Ionicons name="calendar" size={16} color={ceylon.ink} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: ceylon.ink }}>Today`&aposs appointments</Text>
          </View>
          <TouchableOpacity onPress={onViewAppointments}>
            <Text style={{ fontSize: 12, color: ceylon.teaGreen, fontWeight: "700" }}>View all</Text>
          </TouchableOpacity>
        </View>
        {TODAYS_APPOINTMENTS.map((appt, i) => (
          <AppointmentRow key={appt.id} appt={appt} delay={300 + i * 60} />
        ))}
      </ScrollView>
    </View>
  );
};

// ─── ROOT SCREEN — swaps between Board / Chats / Appts / Reports ──────────
// Wire `ChatsView` and `AppointmentsView` to the components built separately
// (see CounselorChats.tsx and CounselorAppointmentsScreen.tsx below).
export default function CounselorDashboardScreen({ ChatsView, AppointmentsView, ReportsView }: any) {
  const [tab, setTab] = useState<"board" | "chats" | "appts" | "reports">("board");

  return (
    <View className="flex-1" style={{ backgroundColor: ceylon.background }}>
      <View style={{ flex: 1 }}>
        {tab === "board" && (
          <CounselorBoard
            onOpenChat={() => setTab("chats")}
            onViewAppointments={() => setTab("appts")}
          />
        )}
        {tab === "chats" && (ChatsView ? <ChatsView /> : <PlaceholderView label="Chats" />)}
        {tab === "appts" && (AppointmentsView ? <AppointmentsView /> : <PlaceholderView label="Appointments" />)}
        {tab === "reports" && (ReportsView ? <ReportsView /> : <PlaceholderView label="Reports" />)}
      </View>

      <BottomNav active={tab} onChange={setTab} />
    </View>
  );
}

const PlaceholderView = ({ label }: { label: string }) => (
  <View className="flex-1 items-center justify-center" style={{ backgroundColor: ceylon.background }}>
    <Text style={{ color: ceylon.muted }}>{label} view goes here</Text>
  </View>
);