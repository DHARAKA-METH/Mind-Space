import React, { useState, useEffect, useMemo, useLayoutEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { getAuth } from "firebase/auth";
import { useNavigation } from "expo-router";
import AppointmentsScreen from "./screens/AppointmentsScreen";
import ChatScreen from "./screens/ChatScreen";
import {
  fetchCounselorName, fetchTodayAppointments, fetchStressAlerts, fetchActiveChatsCount,
  TodayAppointment, StressAlert,
} from "./services/dashboardService";
import { findConversationByStudent } from "./services/counselorService";

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

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#4A7856",
  pending: "#C97B4A",
  cancelled: "#B5555C",
  completed: "#3D7A9A",
  missed: "#8A7A63",
};

const StatCard = ({ label, value, color, bg, icon, delay }: any) => (
  <Animated.View
    entering={FadeInDown.delay(delay).duration(320)}
    style={{ flex: 1, backgroundColor: bg, borderRadius: 22, padding: SPACE.lg }}
  >
    <View className="flex-row items-center justify-between" style={{ marginBottom: SPACE.sm }}>
      <Text style={{ fontSize: 11, color, fontWeight: "700" }}>{label}</Text>
      <Ionicons name={icon} size={15} color={color} />
    </View>
    <Text style={{ fontSize: 32, fontWeight: "800", color }}>{value}</Text>
  </Animated.View>
);

const StressAlertRow = ({ alert, delay, onPress }: any) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center"
      style={{
        backgroundColor: alert.urgency === "high" ? ceylon.dangerBg : "#fff",
        borderRadius: 18,
        padding: SPACE.md,
        marginBottom: SPACE.sm,
        borderWidth: alert.urgency === "high" ? 0 : 1,
        borderColor: ceylon.sand,
      }}
    >
      <View
        style={{
          width: 42, height: 42, borderRadius: 21,
          backgroundColor: alert.urgency === "high" ? "#fff" : ceylon.sand,
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 20 }}>{alert.emoji}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: SPACE.md }}>
        <Text style={{ fontWeight: "700", fontSize: 13, color: alert.urgency === "high" ? ceylon.danger : ceylon.ink }}>
          {alert.studentName}
        </Text>
        <Text style={{ fontSize: 11, color: alert.urgency === "high" ? "#9A4A50" : ceylon.muted, marginTop: 2 }}>
          {alert.detail}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={ceylon.mutedLight} />
    </TouchableOpacity>
  </Animated.View>
);

const statusBadge = (status: string) => {
  const bg = STATUS_COLORS[status] || ceylon.muted;
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <View
      style={{
        backgroundColor: `${bg}20`,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: "600", color: bg }}>{label}</Text>
    </View>
  );
};

const AppointmentRow = ({ appt, delay }: any) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
    <View
      className="flex-row items-center"
      style={{ backgroundColor: "#fff", borderRadius: 18, padding: SPACE.md, marginBottom: SPACE.sm }}
    >
      <View
        style={{
          width: 42, height: 42, borderRadius: 21,
          backgroundColor: `${ceylon.terracotta}18`,
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Ionicons name="alarm-outline" size={18} color={ceylon.terracotta} />
      </View>
      <View style={{ flex: 1, marginLeft: SPACE.md }}>
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <Text style={{ fontWeight: "700", fontSize: 13, color: ceylon.ink }}>
            {appt.time} — {appt.studentName}
          </Text>
          {statusBadge(appt.status)}
        </View>
        <View className="flex-row items-center" style={{ gap: 5, marginTop: 3 }}>
          <Ionicons name={appt.type === "Online" ? "videocam-outline" : "location-outline"} size={12} color={ceylon.muted} />
          <Text style={{ fontSize: 11, color: ceylon.muted }}>{appt.type}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={ceylon.mutedLight} />
    </View>
  </Animated.View>
);

type ScreenState = "board" | "chats" | "appointments";

const HEADER_TITLES: Record<ScreenState, string> = {
  board: "Board",
  chats: "Chats",
  appointments: "Appointments",
};

const CounselorBoard = ({ onViewAppointments, onAlertPress }: any) => {
  const [loading, setLoading] = useState(true);
  const [counselorName, setCounselorName] = useState("");
  const [activeChats, setActiveChats] = useState(0);
  const [todaysAppts, setTodaysAppts] = useState(0);
  const [appointments, setAppointments] = useState<TodayAppointment[]>([]);
  const [alerts, setAlerts] = useState<StressAlert[]>([]);
  const uid = getAuth().currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const [name, chatsCount, todayAppts, stressAlerts] = await Promise.all([
          fetchCounselorName(uid),
          fetchActiveChatsCount(uid),
          fetchTodayAppointments(uid),
          fetchStressAlerts(uid),
        ]);
        setCounselorName(name);
        setActiveChats(chatsCount);
        setTodaysAppts(todayAppts.length);
        setAppointments(todayAppts);
        setAlerts(stressAlerts);
      } catch (err) {
        console.error("Board fetch error", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: ceylon.background }}>
        <View
          style={{
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: "#fff",
            alignItems: "center", justifyContent: "center",
            marginBottom: SPACE.md,
          }}
        >
          <ActivityIndicator color={ceylon.sage} size="small" />
        </View>
        <Text style={{ color: ceylon.muted, fontSize: 13 }}>Loading board…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: ceylon.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: SPACE.lg, paddingBottom: 100 }}
      >
        <View className="flex-row" style={{ gap: SPACE.md, marginBottom: SPACE.xl }}>
          <StatCard label="ACTIVE CHATS" value={activeChats} color={ceylon.teaGreen} bg={`${ceylon.sage}20`} icon="chatbubbles-outline" delay={60} />
          <StatCard label="TODAY'S APPTS" value={todaysAppts} color={ceylon.terracotta} bg={ceylon.sand} icon="calendar-outline" delay={120} />
        </View>

        <View className="flex-row items-center" style={{ marginBottom: SPACE.md, gap: 6 }}>
          <Ionicons name="alert-circle" size={16} color={ceylon.danger} />
          <Text style={{ fontSize: 14, fontWeight: "700", color: ceylon.ink }}>High-stress alerts</Text>
        </View>
        {alerts.length === 0 ? (
          <View style={{ backgroundColor: "#fff", borderRadius: 18, padding: SPACE.lg, marginBottom: SPACE.xl, alignItems: "center" }}>
            <Ionicons name="leaf-outline" size={20} color={ceylon.sage} style={{ marginBottom: 6 }} />
            <Text style={{ fontSize: 12, color: ceylon.muted }}>No alerts right now</Text>
          </View>
        ) : (
          <View style={{ marginBottom: SPACE.xl }}>
            {alerts.map((a, i) => (
              <StressAlertRow
                key={a.id}
                alert={a}
                delay={160 + i * 60}
                onPress={() => onAlertPress?.(a)}
              />
            ))}
          </View>
        )}

        <View className="flex-row items-center justify-between" style={{ marginBottom: SPACE.md }}>
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Ionicons name="calendar" size={16} color={ceylon.ink} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: ceylon.ink }}>Today&apos;s appointments</Text>
          </View>
          <TouchableOpacity onPress={onViewAppointments}>
            <Text style={{ fontSize: 12, color: ceylon.teaGreen, fontWeight: "700" }}>View all</Text>
          </TouchableOpacity>
        </View>
        {appointments.length === 0 ? (
          <View style={{ backgroundColor: "#fff", borderRadius: 18, padding: SPACE.lg, alignItems: "center" }}>
            <Ionicons name="calendar-outline" size={20} color={ceylon.mutedLight} style={{ marginBottom: 6 }} />
            <Text style={{ fontSize: 12, color: ceylon.muted }}>No appointments scheduled today</Text>
          </View>
        ) : (
          appointments.map((appt, i) => (
            <AppointmentRow key={appt.id} appt={appt} delay={300 + i * 60} />
          ))
        )}
      </ScrollView>
    </View>
  );
};

// ─── FOOTER ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: "board", label: "Board", icon: "grid-outline", activeIcon: "grid" },
  { key: "chats", label: "Chats", icon: "chatbubble-outline", activeIcon: "chatbubble" },
  { key: "appointments", label: "Appts", icon: "calendar-outline", activeIcon: "calendar" },
] as const;

const BottomNav = ({ active, onChange }: any) => (
  <View
    pointerEvents="box-none"
    className="items-center"
    style={{ position: "absolute", bottom: 24, left: 0, right: 0 }}
  >
    <View
      className="flex-row items-center justify-center"
      style={{
        backgroundColor: "#fff",
        borderRadius: 50,
        borderWidth: 1,
        borderColor: "#ebb557",
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 4,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
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
                name={isActive ? item.activeIcon : item.icon}
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

export default function CounselorDashboardScreen() {
  const [screen, setScreen] = useState<ScreenState>("board");
  const navigation = useNavigation();
  const [openConversationId, setOpenConversationId] = useState<string | undefined>();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: HEADER_TITLES[screen],
      headerBackVisible: false,
      headerShadowVisible: false,
      headerStyle: {
        backgroundColor: ceylon.background,
      },
    });
  }, [navigation, screen]);

  const handleAlertPress = async (alert: StressAlert) => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;
    const conversationId = await findConversationByStudent(uid, alert.studentId);
    if (conversationId) {
      setOpenConversationId(conversationId);
      setScreen("chats");
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: ceylon.background }}>
      <View style={{ flex: 1 }}>
        {screen === "board" && (
          <CounselorBoard
            onViewAppointments={() => setScreen("appointments")}
            onAlertPress={handleAlertPress}
          />
        )}
        {screen === "chats" && (
          <ChatScreen
            openConversationId={openConversationId}
            onBackToBoard={() => {
              setOpenConversationId(undefined);
              setScreen("board");
            }}
          />
        )}
        {screen === "appointments" && (
          <AppointmentsScreen onBack={() => setScreen("board")} />
        )}
      </View>
      <BottomNav active={screen} onChange={(key: string) => setScreen(key as ScreenState)} />
    </View>
  );
}
