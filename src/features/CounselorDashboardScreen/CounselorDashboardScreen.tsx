import React, { useState, useMemo, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, FlatList, TextInput, Platform } from "react-native";
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

const STUDENTS = [
  {
    id: "s1", anonymousId: "anon_evvi9i", stressLevel: 8, lastActive: "2 min ago",
    concern: "Exam anxiety — trembling before tests", emoji: "😰", online: true,
  },
  {
    id: "s2", anonymousId: "anon_ck3f7p", stressLevel: 6, lastActive: "15 min ago",
    concern: "Sleep deprivation, can't fall asleep before 3 AM", emoji: "😔", online: true,
  },
  {
    id: "s3", anonymousId: "anon_mh2b8q", stressLevel: 9, lastActive: "1 hour ago",
    concern: "Panic attacks during lectures", emoji: "😨", online: false,
  },
  {
    id: "s4", anonymousId: "anon_9w5d1x", stressLevel: 4, lastActive: "Yesterday",
    concern: "Feeling lonely since moving to campus", emoji: "🥺", online: true,
  },
  {
    id: "s5", anonymousId: "anon_tn6r3k", stressLevel: 7, lastActive: "3 hours ago",
    concern: "Family pressure about grades", emoji: "😮‍💨", online: false,
  },
];

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
const StressAlertRow = ({ alert, delay }: any) => (
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
const CounselorBoard = ({ onViewAppointments }: any) => {
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
              <StressAlertRow key={a.id} alert={a} delay={160 + i * 60} />
            ))}
          </View>
        )}

        {/* Today's appointments */}
        <View className="flex-row items-center justify-between" style={{ marginBottom: SPACE.md }}>
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Ionicons name="calendar" size={16} color={ceylon.ink} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: ceylon.ink }}>Today&apos;s appointments</Text>
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

// ─── CHAT ROOM (counselor chats with a student) ─────────────────────────────
const INITIAL_CHAT = [
  { id: "m1", sender: "student", text: "Hi, I've been feeling really anxious about my upcoming exams. I can't sleep properly.", time: "10:02 AM" },
  { id: "m2", sender: "counselor", text: "I'm sorry to hear that. Exam anxiety is very common and there are strategies we can try. Can you tell me more about what's keeping you up at night?", time: "10:04 AM" },
  { id: "m3", sender: "student", text: "I keep thinking I'm going to fail even though I've been studying. My heart races every time I think about the test.", time: "10:06 AM" },
];

const CounselorStudentChatRoom = ({ student, onBack }: any) => {
  const [messages, setMessages] = useState(INITIAL_CHAT);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const flatListRef = useRef<any>(null);

  const handleSend = () => {
    if (!text.trim()) return;
    const msg = {
      id: Date.now().toString(),
      sender: "counselor",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, msg]);
    setText("");

    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "s",
          sender: "student",
          text: "Thank you, that helps. I'll try that tonight.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 2500);
  };

  const isCounselor = (sender: string) => sender === "counselor";

  return (
    <View className="flex-1" style={{ backgroundColor: ceylon.background }}>
      {/* Header */}
      <View className="flex-row items-center p-3" style={{ backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: ceylon.sand }}>
        <TouchableOpacity
          onPress={onBack}
          className="w-9 h-9 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: ceylon.background }}
        >
          <Ionicons name="chevron-back" size={18} color={ceylon.ink} />
        </TouchableOpacity>
        <View
          style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: `${ceylon.sage}22`, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" }}
        >
          <Text style={{ fontSize: 19 }}>{student.emoji}</Text>
        </View>
        <View className="flex-1 ml-3">
          <Text className="font-bold text-sm" style={{ color: ceylon.ink }}>{student.anonymousId}</Text>
          <Text className="text-[11px]" style={{ color: ceylon.teaGreen }}>Stress {student.stressLevel}/10 · {student.lastActive}</Text>
        </View>
        <View className="px-2.5 py-1 rounded-xl" style={{ backgroundColor: `${ceylon.sage}18` }}>
          <Text className="text-[10px] font-bold" style={{ color: ceylon.sage }}>Student</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item: any) => item.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        className="flex-1"
        ListHeaderComponent={() => (
          <>
            <View className="px-4 pt-2">
              <View className="flex-row items-center p-3 rounded-2xl" style={{ backgroundColor: `${ceylon.sage}12`, borderWidth: 1, borderColor: `${ceylon.sage}25`, marginBottom: SPACE.sm }}>
                <Text className="text-lg mr-2">🔒</Text>
                <View className="flex-1">
                  <Text className="text-[11px] font-bold" style={{ color: ceylon.ink }}>IDENTITY PROTECTED</Text>
                  <Text className="text-[11px] mt-0.5" style={{ color: ceylon.muted }}>Conversation is confidential. {student.anonymousId}&aposs identity is protected.</Text>
                </View>
              </View>
            </View>
            <View className="flex-row px-4 pb-3" style={{ gap: SPACE.sm }}>
              <View className="flex-1 p-2.5 rounded-xl items-center" style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: ceylon.sand }}>
                <Text className="text-[10px] font-semibold" style={{ color: ceylon.mutedLight }}>YOU</Text>
                <Text className="text-xs font-bold my-0.5" style={{ color: ceylon.teaGreen }}>Counselor</Text>
                <Text className="text-[10px]" style={{ color: ceylon.teaGreen }}>✓ Visible to student</Text>
              </View>
              <View className="flex-1 p-2.5 rounded-xl items-center" style={{ backgroundColor: `${ceylon.terracotta}12`, borderWidth: 1, borderColor: `${ceylon.terracotta}30` }}>
                <Text className="text-[10px] font-semibold" style={{ color: ceylon.mutedLight }}>STUDENT</Text>
                <Text className="text-xs font-bold my-0.5" style={{ color: ceylon.terracotta }}>{student.anonymousId}</Text>
                <Text className="text-[10px]" style={{ color: ceylon.terracotta }}>🔒 Anonymous to you</Text>
              </View>
            </View>
          </>
        )}
        renderItem={({ item }: any) => {
          const fromCounselor = isCounselor(item.sender);
          return (
            <View className={`px-4 mb-3 items-end flex-row ${fromCounselor ? "flex-row-reverse" : "flex-row"}`}>
              {!fromCounselor && (
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: `${ceylon.terracotta}22`, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" }}>
                  <Text style={{ fontSize: 16 }}>{student.emoji}</Text>
                </View>
              )}
              <View className={`max-w-[72%] mx-2 ${fromCounselor ? "items-end" : "items-start"}`}>
                <View
                  style={{
                    borderRadius: 18,
                    padding: 12,
                    backgroundColor: fromCounselor ? ceylon.teaGreen : "#fff",
                    borderBottomRightRadius: fromCounselor ? 4 : 18,
                    borderBottomLeftRadius: fromCounselor ? 18 : 4,
                    shadowColor: "#000",
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                  }}
                >
                  <Text style={{ fontSize: 13.5, color: fromCounselor ? "#fff" : ceylon.ink, lineHeight: 19 }}>{item.text}</Text>
                </View>
                <Text style={{ fontSize: 10, color: ceylon.mutedLight, marginTop: 4 }}>{item.time}</Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          typing ? (
            <View className="flex-row items-center px-4 pb-2.5" style={{ gap: 8 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${ceylon.terracotta}22`, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" }}>
                <Text style={{ fontSize: 14 }}>{student.emoji}</Text>
              </View>
              <Text className="text-[11px] italic" style={{ color: ceylon.muted }}>{student.anonymousId} is typing...</Text>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <View className="flex-row items-center p-3" style={{ backgroundColor: "#fff", paddingBottom: Platform.OS === "ios" ? 24 : 12 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={`Message ${student.anonymousId}...`}
          placeholderTextColor={ceylon.mutedLight}
          className="flex-1 px-4 py-2.5 rounded-full"
          style={{ backgroundColor: ceylon.background, fontSize: 13, color: ceylon.ink }}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim()}
          className="w-10 h-10 rounded-full items-center justify-center ml-2.5"
          style={{ backgroundColor: text.trim() ? ceylon.teaGreen : ceylon.mutedLight }}
        >
          <Ionicons name="arrow-up" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── CHATS TAB (student list for counselor) ─────────────────────────────────
const StudentCard = React.memo(({ student, onChat }: any) => (
  <TouchableOpacity
    onPress={() => student.online && onChat(student)}
    className="bg-white rounded-2xl p-4 mx-4 my-1.5"
    style={{ borderWidth: 1, borderColor: ceylon.sand }}
  >
    <View className="flex-row items-start">
      <View className="relative">
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: student.online ? `${ceylon.sage}22` : ceylon.sand,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "#fff",
          }}
        >
          <Text style={{ fontSize: 26 }}>{student.emoji}</Text>
        </View>
        {student.online !== undefined && (
          <View
            style={{
              position: "absolute",
              bottom: 2,
              right: 2,
              width: 12,
              height: 12,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: "#fff",
              backgroundColor: student.online ? ceylon.teaGreen : ceylon.mutedLight,
            }}
          />
        )}
      </View>
      <View className="flex-1 ml-3">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-1">
            <Text className="font-bold text-sm" style={{ color: ceylon.ink }}>{student.anonymousId}</Text>
            <Text className="text-xs font-semibold mt-0.5" style={{ color: ceylon.teaGreen }}>
              {student.concern}
            </Text>
          </View>
          <View
            className="px-2 py-0.5 rounded-lg"
            style={{ backgroundColor: student.online ? `${ceylon.teaGreen}15` : ceylon.background }}
          >
            <Text
              className="text-[10px] font-bold"
              style={{ color: student.online ? ceylon.teaGreen : ceylon.mutedLight }}
            >
              {student.online ? "● Online" : "○ Away"}
            </Text>
          </View>
        </View>
        <Text className="text-xs mt-1.5 leading-5" style={{ color: ceylon.muted }}>{student.concern}</Text>
        <View className="flex-row flex-wrap mt-2" style={{ gap: 6 }}>
          <View className="px-2 py-0.5 rounded-lg" style={{ backgroundColor: ceylon.background, borderWidth: 1, borderColor: ceylon.sand }}>
            <Text className="text-[10px] font-medium" style={{ color: ceylon.muted }}>🔥 Stress {student.stressLevel}/10</Text>
          </View>
          <View className="px-2 py-0.5 rounded-lg" style={{ backgroundColor: ceylon.background, borderWidth: 1, borderColor: ceylon.sand }}>
            <Text className="text-[10px] font-medium" style={{ color: ceylon.muted }}>⏱ {student.lastActive}</Text>
          </View>
        </View>
      </View>
    </View>
    <View
      className="w-full mt-3 py-2.5 rounded-xl items-center"
      style={{ backgroundColor: student.online ? ceylon.teaGreen : ceylon.background }}
    >
      <Text
        className="font-bold text-xs"
        style={{ color: student.online ? "#fff" : ceylon.mutedLight }}
      >
        {student.online ? "💬 Open Chat" : "Currently Unavailable"}
      </Text>
    </View>
  </TouchableOpacity>
));
StudentCard.displayName = "StudentCard";

const CounselorChats = ({ onOpenStudentChat }: any) => {
  const onlineCount = STUDENTS.filter((s) => s.online).length;
  return (
    <View className="flex-1" style={{ backgroundColor: ceylon.background }}>
      <View className="p-4" style={{ backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: ceylon.sand }}>
        <View className="flex-row items-center">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center"
            style={{ backgroundColor: `${ceylon.sage}22`, borderWidth: 1, borderColor: `${ceylon.sage}40` }}
          >
            <Text className="text-xl">💬</Text>
          </View>
          <View className="ml-2.5">
            <Text className="font-bold text-sm" style={{ color: ceylon.ink }}>Student Chats</Text>
            <Text className="text-[11px] font-semibold" style={{ color: ceylon.teaGreen }}>
              {onlineCount} students online now
            </Text>
          </View>
        </View>
        <View
          className="mt-3 p-3 rounded-2xl"
          style={{ backgroundColor: `${ceylon.sage}12`, borderWidth: 1, borderColor: `${ceylon.sage}25` }}
        >
          <Text className="text-xs leading-5" style={{ color: ceylon.ink }}>
            Reach out to students who may need support. High-stress students are sorted to the top.
          </Text>
        </View>
      </View>

      <FlatList
        data={[...STUDENTS].sort((a, b) => b.stressLevel - a.stressLevel)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: SPACE.sm }}
        renderItem={({ item }) => <StudentCard student={item} onChat={onOpenStudentChat} />}
      />
    </View>
  );
};

// ─── ROOT SCREEN — swaps between Board / Chats / Appts / Reports ──────────
export default function CounselorDashboardScreen({ AppointmentsView, ReportsView }: any) {
  const [tab, setTab] = useState<"board" | "chats" | "appts" | "reports">("board");
  const [activeStudent, setActiveStudent] = useState<any>(null);

  const handleTabChange = (newTab: string) => {
    setTab(newTab as any);
    setActiveStudent(null);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: ceylon.background }}>
      <View style={{ flex: 1 }}>
        {tab === "board" && (
          <CounselorBoard
            onViewAppointments={() => setTab("appts")}
          />
        )}
        {tab === "chats" && activeStudent ? (
          <CounselorStudentChatRoom
            student={activeStudent}
            onBack={() => setActiveStudent(null)}
          />
        ) : (
          <CounselorChats onOpenStudentChat={setActiveStudent} />
        )}
        {tab === "appts" && (AppointmentsView ? <AppointmentsView /> : <PlaceholderView label="Appointments" />)}
        {tab === "reports" && (ReportsView ? <ReportsView /> : <PlaceholderView label="Reports" />)}
      </View>

      <BottomNav active={tab} onChange={handleTabChange} />
    </View>
  );
}

const PlaceholderView = ({ label }: { label: string }) => (
  <View className="flex-1 items-center justify-center" style={{ backgroundColor: ceylon.background }}>
    <Text style={{ color: ceylon.muted }}>{label} view goes here</Text>
  </View>
);