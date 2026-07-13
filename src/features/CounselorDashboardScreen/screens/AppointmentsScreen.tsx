import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { fetchAppointments, updateAppointmentStatus, CounselorAppointment } from "../services/appointmentService";

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
  success: "#4A7856",
  successBg: "#DCEBDD",
};

const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString([], { month: "short", day: "numeric" }),
    time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending:   { bg: `${ceylon.terracotta}20`, color: ceylon.terracotta },
  confirmed: { bg: ceylon.successBg,         color: ceylon.success },
  cancelled: { bg: ceylon.dangerBg,          color: ceylon.danger },
  completed: { bg: "#D0E4F0",                color: "#2A6A8A" },
  missed:    { bg: "#EDE0D0",                color: ceylon.muted },
};

const AppointmentRow = ({ appt, delay, onAccept, onReject, onComplete, onMissed }: any) => {
  const { date, time } = formatDateTime(appt.appointmentDateTime);
  const isPending = appt.status === "pending";
  const isConfirmed = appt.status === "confirmed";
  const s = STATUS_STYLES[appt.status] || STATUS_STYLES.pending;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 18,
          padding: SPACE.md,
          marginBottom: SPACE.sm,
          borderWidth: isPending ? 1.5 : 1,
          borderColor: isPending ? ceylon.terracotta : ceylon.sand,
        }}
      >
        <View className="flex-row items-start">
          <View
            style={{
              width: 42, height: 42, borderRadius: 21,
              backgroundColor: `${ceylon.terracotta}18`,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 20 }}>{appt.studentEmoji}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: SPACE.md }}>
            <View className="flex-row justify-between items-center">
              <Text style={{ fontWeight: "700", fontSize: 13, color: ceylon.ink }}>
                {appt.studentName}
              </Text>
              <View style={{ backgroundColor: s.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", textTransform: "capitalize", color: s.color }}>
                  {appt.status}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center" style={{ gap: 5, marginTop: 3 }}>
              <Ionicons name="calendar-outline" size={12} color={ceylon.muted} />
              <Text style={{ fontSize: 11, color: ceylon.muted }}>
                {date} at {time}
              </Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 5, marginTop: 1 }}>
              <Ionicons
                name={appt.type === "online" ? "videocam-outline" : "location-outline"}
                size={12}
                color={ceylon.muted}
              />
              <Text style={{ fontSize: 11, color: ceylon.muted }}>
                {appt.type} · {appt.durationMinutes} min
              </Text>
            </View>
          </View>
        </View>

        {isPending && (
          <View className="flex-row" style={{ gap: SPACE.sm, marginTop: SPACE.md }}>
            <TouchableOpacity
              onPress={() => onAccept(appt)}
              className="flex-1 py-2.5 rounded-xl items-center flex-row justify-center"
              style={{ backgroundColor: ceylon.success, gap: 6 }}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onReject(appt)}
              className="flex-1 py-2.5 rounded-xl items-center flex-row justify-center"
              style={{ backgroundColor: ceylon.danger, gap: 6 }}
            >
              <Ionicons name="close" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        {isConfirmed && (
          <View className="flex-row" style={{ gap: SPACE.sm, marginTop: SPACE.md }}>
            <TouchableOpacity
              onPress={() => onComplete(appt)}
              className="flex-1 py-2.5 rounded-xl items-center flex-row justify-center"
              style={{ backgroundColor: "#2A6A8A", gap: 6 }}
            >
              <Ionicons name="checkmark-done" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>Completed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onMissed(appt)}
              className="flex-1 py-2.5 rounded-xl items-center flex-row justify-center"
              style={{ backgroundColor: ceylon.muted, gap: 6 }}
            >
              <Ionicons name="close" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>Missed</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

export default function AppointmentsScreen({ onBack }: any) {
  const [appointments, setAppointments] = useState<CounselorAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      fetchAppointments(user.uid).then((data) => {
        setAppointments(data);
        setLoading(false);
      }).catch((err) => {
        console.error("fetchAppointments error", err);
        setLoading(false);
      });
    });
    return unsub;
  }, []);

  const handleAccept = async (appt: CounselorAppointment) => {
    try {
      await updateAppointmentStatus(appt.appointmentId, "confirmed");
      setAppointments((prev) =>
        prev.map((a) => a.appointmentId === appt.appointmentId ? { ...a, status: "confirmed" } : a)
      );
    } catch {
      Alert.alert("Error", "Could not accept appointment.");
    }
  };

  const handleReject = async (appt: CounselorAppointment) => {
    Alert.alert("Decline Appointment", `Cancel this session with ${appt.studentName}?`, [
      { text: "No", style: "cancel" },
      {
        text: "Yes, decline", style: "destructive",
        onPress: async () => {
          try {
            await updateAppointmentStatus(appt.appointmentId, "cancelled");
            setAppointments((prev) =>
              prev.map((a) => a.appointmentId === appt.appointmentId ? { ...a, status: "cancelled" } : a)
            );
          } catch {
            Alert.alert("Error", "Could not decline appointment.");
          }
        },
      },
    ]);
  };

  const handleComplete = async (appt: CounselorAppointment) => {
    try {
      await updateAppointmentStatus(appt.appointmentId, "completed");
      setAppointments((prev) =>
        prev.map((a) => a.appointmentId === appt.appointmentId ? { ...a, status: "completed" } : a)
      );
    } catch {
      Alert.alert("Error", "Could not mark appointment.");
    }
  };

  const handleMissed = async (appt: CounselorAppointment) => {
    Alert.alert("Mark Missed", `Mark session with ${appt.studentName} as missed?`, [
      { text: "No", style: "cancel" },
      {
        text: "Yes, missed", style: "destructive",
        onPress: async () => {
          try {
            await updateAppointmentStatus(appt.appointmentId, "missed");
            setAppointments((prev) =>
              prev.map((a) => a.appointmentId === appt.appointmentId ? { ...a, status: "missed" } : a)
            );
          } catch {
            Alert.alert("Error", "Could not mark appointment.");
          }
        },
      },
    ]);
  };

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
        <Text style={{ color: ceylon.muted, fontSize: 13 }}>Loading appointments…</Text>
      </View>
    );
  }

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
          {appointments.length} appointment{appointments.length !== 1 ? "s" : ""}
        </Animated.Text>
        {appointments.length === 0 ? (
          <View style={{ backgroundColor: "#fff", borderRadius: 18, padding: SPACE.xl, alignItems: "center" }}>
            <Ionicons name="calendar-outline" size={28} color={ceylon.mutedLight} style={{ marginBottom: SPACE.sm }} />
            <Text style={{ fontSize: 12, color: ceylon.muted }}>No appointments yet</Text>
          </View>
        ) : (
          appointments.map((appt, i) => (
            <AppointmentRow
              key={appt.appointmentId}
              appt={appt}
              delay={100 + i * 60}
              onAccept={handleAccept}
              onReject={handleReject}
              onComplete={handleComplete}
              onMissed={handleMissed}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
