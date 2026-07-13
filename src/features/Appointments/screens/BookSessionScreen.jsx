import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn, Layout } from "react-native-reanimated";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { MONTH_NAMES, DAYS, TIME_SLOTS } from "../services/mockData";
import {
  getCounselors,
  getLoggedUser,
  fetchAppointments,
  createAppointment,
} from "../services/appointmentService";
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  dateKey,
  formatDisplayDate,
  timeSlotToISO,
} from "../hooks/dateHelpers";

dayjs.extend(utc);

// ─── THEME ────────────────────────────────────────────────────────────────
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

export default function BookSessionScreen() {
  const nowGlobal = useMemo(() => dayjs.utc(), []);
  const todayDateStr = nowGlobal.format("YYYY-MM-DD");
  const LOGGED_USER = useMemo(() => getLoggedUser() || { id: "", name: "Student" }, []);

  const [appointments, setAppointments] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [calMonth, setCalMonth] = useState(nowGlobal.month());
  const [calYear, setCalYear] = useState(nowGlobal.year());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [sessionType, setSessionType] = useState("online");
  const [note, setNote] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookLoading, setBookLoading] = useState(false);

  useEffect(() => {
    getCounselors().then(setCounselors);
    const user = getLoggedUser();
    if (user) {
      fetchAppointments(user.id).then((data) => {
        setAppointments(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const systemScheduleMap = useMemo(() => {
    const map = {};
    appointments.forEach((appt) => {
      const [datePart, timePart] = appt.appointmentDateTime.split("T");
      const cleanTime = timePart.substring(0, 5);
      if (!map[datePart]) {
        map[datePart] = { globalSlots: [], studentHasBooking: false, studentBookingDetails: null };
      }
      map[datePart].globalSlots.push(cleanTime);
      if (appt.studentId === LOGGED_USER.id) {
        map[datePart].studentHasBooking = true;
        map[datePart].studentBookingDetails = appt;
      }
    });
    return map;
  }, [appointments]);

  const myAppointments = useMemo(
    () => appointments.filter((a) => a.studentId === LOGGED_USER.id),
    [appointments]
  );

  const filteredCounselors = useMemo(() => {
    if (!searchQuery.trim()) return counselors;
    const q = searchQuery.toLowerCase();
    return counselors.filter(
      (c) => c.name.toLowerCase().includes(q) || c.specialties.some((s) => s.toLowerCase().includes(q))
    );
  }, [searchQuery, counselors]);

  const selectedDateStr = selectedDay ? dateKey(calYear, calMonth, selectedDay) : null;
  const myExistingOnDate = selectedDateStr ? systemScheduleMap[selectedDateStr]?.studentBookingDetails || null : null;

  const counselorMyAppointments = useMemo(() => {
    if (!selectedCounselor) return [];
    return myAppointments.filter((a) => a.counselorId === selectedCounselor.id);
  }, [selectedCounselor, myAppointments]);

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  function prevMonth() {
    Haptics.selectionAsync().catch(() => {});
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else setCalMonth((m) => m - 1);
    setSelectedDay(null);
    setSelectedTime(null);
  }

  function nextMonth() {
    Haptics.selectionAsync().catch(() => {});
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else setCalMonth((m) => m + 1);
    setSelectedDay(null);
    setSelectedTime(null);
  }

  async function handleBook() {
    if (!selectedCounselor || !selectedDay || !selectedTime || !selectedDateStr || !LOGGED_USER.id) return;

    const targetTimeISO = timeSlotToISO(selectedTime);
    const daySchedule = systemScheduleMap[selectedDateStr];

    if (daySchedule?.studentHasBooking) return;
    if (daySchedule?.globalSlots.includes(targetTimeISO)) return;
    if ((daySchedule?.globalSlots.length || 0) >= TIME_SLOTS.length) return;

    setBookLoading(true);
    try {
      const appointmentData = {
        studentId: LOGGED_USER.id,
        counselorId: selectedCounselor.id,
        appointmentDateTime: `${selectedDateStr}T${targetTimeISO}:00Z`,
        durationMinutes: 45,
        type: sessionType,
        note: note.trim(),
      };

      const newId = await createAppointment(appointmentData);
      const newAppointment = {
        ...appointmentData,
        appointmentId: newId,
        status: "pending",
        rescheduleCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setAppointments((prev) => [...prev, newAppointment]);
      setBookingSuccess(true);
      setTimeout(() => setBookingSuccess(false), 4000);

      setSelectedDay(null);
      setSelectedTime(null);
      setNote("");
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert("Booking Failed", error.message || "Could not create appointment. Please try again.");
    } finally {
      setBookLoading(false);
    }
  }

  const targetTimeISO = selectedTime ? timeSlotToISO(selectedTime) : null;
  const selectedDaySchedule = systemScheduleMap[selectedDateStr];
  const isSelectedTimeTaken = targetTimeISO && selectedDaySchedule?.globalSlots.includes(targetTimeISO);
  const isSelectedDayFull = (selectedDaySchedule?.globalSlots.length || 0) >= TIME_SLOTS.length;

  const canBook =
    !!selectedCounselor && !!selectedDay && !!selectedTime && !myExistingOnDate && !isSelectedTimeTaken && !isSelectedDayFull;

  const accentColor = selectedCounselor?.color || ceylon.teaGreen;
  const accentBg = selectedCounselor?.bgColor || `${ceylon.sage}18`;

  // ─── LOADING STATE ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: ceylon.background }}>
        <Stack.Screen
          options={{
            headerTitle: "Book a session",
            headerStyle: { backgroundColor: ceylon.cream },
            headerShadowVisible: false,
          }}
        />
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: "#fff",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: SPACE.md,
          }}
        >
          <ActivityIndicator color={ceylon.sage} />
        </View>
        <Text style={{ color: ceylon.muted, fontSize: 13 }}>Finding available counselors…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: ceylon.background }}>
      <Stack.Screen
        options={{
          headerTitle: "Book a session",
          headerTitleStyle: { fontWeight: "700", fontSize: 17, color: ceylon.ink },
          headerStyle: { backgroundColor: ceylon.cream },
          headerShadowVisible: false,
          headerLeft: () => null,
          headerBackVisible: false,
          headerShown: true,
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: SPACE.lg, paddingBottom: SPACE.xxl, paddingTop: SPACE.lg }}
          showsVerticalScrollIndicator={false}
          className="flex-1"
        >
          {/* Success banner */}
          {bookingSuccess && (
            <Animated.View
              entering={FadeInDown.duration(280)}
              style={{
                backgroundColor: ceylon.successBg,
                borderRadius: 18,
                padding: SPACE.md,
                marginBottom: SPACE.lg,
                flexDirection: "row",
                alignItems: "center",
                gap: SPACE.sm,
              }}
            >
              <Ionicons name="checkmark-circle" size={20} color={ceylon.success} />
              <Text style={{ color: ceylon.success, fontSize: 12, fontWeight: "600", flex: 1 }}>
                Appointment requested! You&apos;ll be notified once it&apos;s confirmed.
              </Text>
            </Animated.View>
          )}

          {/* Search */}
          <Text style={{ fontSize: 12, fontWeight: "700", color: ceylon.mutedLight, marginBottom: SPACE.sm }}>
            Choose your counselor
          </Text>
          <View
            className="flex-row items-center"
            style={{ backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: SPACE.md, height: 46, marginBottom: SPACE.lg }}
          >
            <Ionicons name="search" size={16} color={ceylon.mutedLight} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name or specialty..."
              placeholderTextColor={ceylon.mutedLight}
              style={{ flex: 1, marginLeft: SPACE.sm, fontSize: 13, color: ceylon.ink }}
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={16} color={ceylon.mutedLight} />
              </TouchableOpacity>
            )}
          </View>

          {/* Counselor list */}
          <View style={{ marginBottom: SPACE.lg }}>
            {filteredCounselors.length === 0 && (
              <View style={{ alignItems: "center", paddingVertical: SPACE.xl }}>
                <Ionicons name="search-outline" size={22} color={ceylon.mutedLight} style={{ marginBottom: 6 }} />
                <Text style={{ color: ceylon.mutedLight, fontSize: 12 }}>No counselors found</Text>
              </View>
            )}

            {(showAll ? filteredCounselors : filteredCounselors.slice(0, 3)).map((c, i) => {
              const chosen = selectedCounselor?.id === c.id;
              const myCount = myAppointments.filter((a) => a.counselorId === c.id).length;
              return (
                <Animated.View key={c.id} entering={FadeInDown.delay(i * 50).duration(260)}>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setSelectedCounselor(c);
                      setSelectedDay(null);
                      setSelectedTime(null);
                    }}
                    activeOpacity={0.8}
                    style={{
                      borderColor: chosen ? c.color : ceylon.sand,
                      borderWidth: chosen ? 2 : 1.5,
                      backgroundColor: chosen ? c.bgColor : "#fff",
                      marginBottom: SPACE.sm,
                      borderRadius: 18,
                      flexDirection: "row",
                      alignItems: "center",
                      padding: SPACE.md,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: c.bgColor,
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: SPACE.md,
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>{c.avatar}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: chosen ? c.color : ceylon.ink, fontSize: 14, fontWeight: "700" }}>
                        {c.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: ceylon.muted, marginTop: 2 }}>
                        {c.specialties.join(" · ")}
                      </Text>
                      {myCount > 0 && (
                        <View
                          style={{
                            backgroundColor: c.bgColor,
                            alignSelf: "flex-start",
                            marginTop: 4,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ color: c.color, fontSize: 10, fontWeight: "700" }}>
                            {myCount} session{myCount > 1 ? "s" : ""} booked
                          </Text>
                        </View>
                      )}
                    </View>
                    <View
                      style={{
                        backgroundColor: chosen ? c.color : ceylon.background,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: chosen ? "#fff" : ceylon.muted, fontSize: 12, fontWeight: "700" }}>
                        {chosen ? "✓ Chosen" : "Select"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}

            {filteredCounselors.length > 3 && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setShowAll((v) => !v);
                }}
                style={{ paddingVertical: SPACE.xs, alignItems: "center" }}
              >
                <Text style={{ color: ceylon.teaGreen, fontSize: 12, fontWeight: "700" }}>
                  {showAll ? "▲ Show less" : `▼ Show ${filteredCounselors.length - 3} more counselors`}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Existing sessions with selected counselor */}
          {selectedCounselor && counselorMyAppointments.length > 0 && (
            <Animated.View
              entering={FadeIn.duration(240)}
              style={{
                backgroundColor: selectedCounselor.bgColor,
                borderColor: `${selectedCounselor.color}33`,
                borderWidth: 1,
                borderRadius: 18,
                padding: SPACE.md,
                marginBottom: SPACE.lg,
              }}
            >
              <Text style={{ color: selectedCounselor.color, fontSize: 12, fontWeight: "700", marginBottom: SPACE.sm }}>
                Your sessions with {selectedCounselor.name.split(" ").pop()}
              </Text>
              {counselorMyAppointments.map((a) => {
                const displayDate = dayjs.utc(a.appointmentDateTime).format("DD MMM YYYY · hh:mm A");
                const statusMeta =
                  a.status === "confirmed"
                    ? { bg: ceylon.successBg, color: ceylon.success }
                    : a.status === "pending"
                    ? { bg: `${ceylon.terracotta}20`, color: ceylon.terracotta }
                    : { bg: ceylon.dangerBg, color: ceylon.danger };

                return (
                  <View
                    key={a.appointmentId}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 12,
                      padding: SPACE.sm,
                      marginBottom: SPACE.xs + 2,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <Ionicons name="calendar-outline" size={12} color={ceylon.muted} />
                      <Text style={{ fontSize: 12, color: ceylon.ink }}>{displayDate}</Text>
                    </View>
                    <View className="flex-row" style={{ gap: 4 }}>
                      <View style={{ backgroundColor: ceylon.sand, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ color: ceylon.ink, fontSize: 10, fontWeight: "700", textTransform: "capitalize" }}>
                          {a.type}
                        </Text>
                      </View>
                      <View style={{ backgroundColor: statusMeta.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ color: statusMeta.color, fontSize: 10, fontWeight: "700", textTransform: "capitalize" }}>
                          {a.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </Animated.View>
          )}

          {/* Calendar */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 24,
              padding: SPACE.lg,
              marginBottom: SPACE.lg,
              shadowColor: ceylon.sage,
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACE.lg }}>
              <TouchableOpacity
                onPress={prevMonth}
                style={{ backgroundColor: ceylon.background, width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons name="chevron-back" size={18} color={ceylon.ink} />
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: "800", color: ceylon.ink }}>
                {MONTH_NAMES[calMonth]} {calYear}
              </Text>
              <TouchableOpacity
                onPress={nextMonth}
                style={{ backgroundColor: ceylon.background, width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons name="chevron-forward" size={18} color={ceylon.ink} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: SPACE.xs + 2 }}>
              {DAYS.map((d) => (
                <Text key={d} style={{ width: "14.28%", textAlign: "center", fontSize: 12, fontWeight: "700", color: ceylon.mutedLight }}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {Array.from({ length: firstDay }).map((_, i) => (
                <View key={`e-${i}`} style={{ width: "14.28%", aspectRatio: 1 }} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const loopDateStr = dateKey(calYear, calMonth, day);
                const isToday = loopDateStr === todayDateStr;
                const isPast = loopDateStr < todayDateStr;
                const dayMetadata = systemScheduleMap[loopDateStr];
                const totalBookedSlots = dayMetadata?.globalSlots.length || 0;
                const hasBookings = totalBookedSlots > 0;
                const full = totalBookedSlots >= TIME_SLOTS.length;
                const selected = selectedDay === day;

                return (
                  <TouchableOpacity
                    key={day}
                    disabled={isPast || full}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setSelectedDay(day);
                      setSelectedTime(null);
                    }}
                    style={{
                      width: "14.28%",
                      aspectRatio: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 14,
                      marginVertical: 3,
                      backgroundColor: selected ? accentColor : isToday ? accentBg : "transparent",
                      opacity: isPast ? 0.3 : 1,
                      position: "relative",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: selected || isToday ? "800" : "400",
                        color: selected ? "#fff" : full ? ceylon.danger : isToday ? accentColor : ceylon.ink,
                      }}
                    >
                      {day}
                    </Text>
                    {hasBookings && !selected && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: 3,
                          width: 5,
                          height: 5,
                          borderRadius: 3,
                          backgroundColor: full ? ceylon.danger : accentColor,
                        }}
                      />
                    )}
                    {full && !selected && (
                      <View style={{ position: "absolute", top: 2, right: 1, backgroundColor: ceylon.dangerBg, borderRadius: 3, paddingHorizontal: 2 }}>
                        <Text style={{ fontSize: 7, color: ceylon.danger, fontWeight: "700" }}>FULL</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: "row", gap: SPACE.md, marginTop: SPACE.md, paddingTop: SPACE.sm, borderTopWidth: 0.5, borderTopColor: ceylon.sand }}>
              {[
                { color: accentColor, label: "Booked" },
                { color: ceylon.danger, label: "Full (3/3)" },
                { color: accentBg, label: "Today", border: accentColor },
              ].map(({ color, label, border }) => (
                <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, borderWidth: border ? 1 : 0, borderColor: border || "transparent" }} />
                  <Text style={{ fontSize: 10, color: ceylon.mutedLight }}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Selected day banner */}
          {selectedDay && (
            <Animated.View
              entering={FadeInDown.duration(220)}
              style={{
                backgroundColor: myExistingOnDate || isSelectedDayFull ? ceylon.dangerBg : accentBg,
                borderRadius: 14,
                padding: SPACE.md,
                marginBottom: SPACE.lg,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: myExistingOnDate || isSelectedDayFull ? ceylon.danger : accentColor, fontSize: 12, fontWeight: "700" }}>
                {formatDisplayDate(calYear, calMonth, selectedDay)}
              </Text>
              {myExistingOnDate && (
                <Text style={{ color: ceylon.danger, fontSize: 11, fontWeight: "700" }}>⚠ Already booked this day</Text>
              )}
              {!myExistingOnDate && isSelectedDayFull && (
                <Text style={{ color: ceylon.danger, fontSize: 11, fontWeight: "700" }}>⚠ All slots full</Text>
              )}
            </Animated.View>
          )}

          {/* Time slots */}
          <Text style={{ fontSize: 12, color: ceylon.mutedLight, fontWeight: "700", marginBottom: SPACE.sm }}>Select time</Text>
          <View style={{ gap: SPACE.sm, marginBottom: SPACE.lg }}>
            {TIME_SLOTS.map((t) => {
              const sel = selectedTime === t;
              const currentSlotISO = timeSlotToISO(t);
              const taken = selectedDaySchedule?.globalSlots.includes(currentSlotISO);
              const disabled = taken || !selectedDay || !!myExistingOnDate;

              return (
                <TouchableOpacity
                  key={t}
                  disabled={disabled}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSelectedTime(t);
                  }}
                  style={{
                    borderColor: sel ? accentColor : taken ? "#E8A6AA" : ceylon.sand,
                    borderWidth: sel ? 2 : 1.5,
                    backgroundColor: sel ? accentColor : taken ? ceylon.dangerBg : "#fff",
                    opacity: disabled && !sel ? 0.65 : 1,
                    paddingVertical: SPACE.md,
                    paddingHorizontal: SPACE.lg,
                    borderRadius: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE.sm }}>
                    <Ionicons name={t.includes("AM") ? "partly-sunny-outline" : "moon-outline"} size={18} color={sel ? "#fff" : ceylon.muted} />
                    <Text style={{ color: sel ? "#fff" : taken ? ceylon.danger : ceylon.ink, fontSize: 15, fontWeight: "700" }}>
                      {t}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: sel ? "rgba(255,255,255,0.25)" : taken ? "#F2D5D5" : ceylon.background,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "700", color: sel ? "#fff" : taken ? ceylon.danger : ceylon.muted }}>
                      {sel ? "✓ Selected" : taken ? "Booked" : "Available"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Session type */}
          <Text style={{ fontSize: 12, color: ceylon.mutedLight, fontWeight: "700", marginBottom: SPACE.sm }}>Session type</Text>
          <View style={{ flexDirection: "row", gap: SPACE.sm, marginBottom: SPACE.lg }}>
            {["online", "physical"].map((type) => {
              const sel = sessionType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSessionType(type);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: SPACE.md,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 6,
                    backgroundColor: sel ? accentColor : "#fff",
                    borderWidth: 1.5,
                    borderColor: sel ? "transparent" : ceylon.sand,
                  }}
                >
                  <Ionicons name={type === "online" ? "videocam-outline" : "location-outline"} size={15} color={sel ? "#fff" : ceylon.muted} />
                  <Text style={{ color: sel ? "#fff" : ceylon.ink, fontSize: 13, fontWeight: "700", textTransform: "capitalize" }}>
                    {type} {sel ? " ✓" : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Note */}
          <Text style={{ fontSize: 12, color: ceylon.mutedLight, fontWeight: "700", marginBottom: SPACE.sm }}>
            Add a note (optional)
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Describe what you'd like to discuss in this session..."
            placeholderTextColor={ceylon.mutedLight}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{
              backgroundColor: "#fff",
              borderWidth: 1.5,
              borderColor: ceylon.sand,
              borderRadius: 16,
              padding: SPACE.md,
              fontSize: 13,
              color: ceylon.ink,
              minHeight: 84,
              marginBottom: SPACE.xs,
            }}
          />
          <Text style={{ fontSize: 10, color: ceylon.mutedLight, textAlign: "right", marginBottom: SPACE.lg }}>
            {note.length} characters
          </Text>

          {/* Summary */}
          {selectedCounselor && selectedDay && selectedTime && !isSelectedTimeTaken && !myExistingOnDate && (
            <Animated.View
              entering={FadeInDown.duration(240)}
              style={{
                backgroundColor: accentBg,
                borderColor: `${accentColor}33`,
                borderWidth: 1,
                borderRadius: 18,
                padding: SPACE.lg,
                marginBottom: SPACE.lg,
              }}
            >
              <Text style={{ color: accentColor, fontSize: 12, fontWeight: "700", marginBottom: SPACE.sm }}>
                Booking summary
              </Text>
              {[
                ["Counselor", selectedCounselor.name],
                ["Date", formatDisplayDate(calYear, calMonth, selectedDay)],
                ["Time", selectedTime],
                ["Type", sessionType.charAt(0).toUpperCase() + sessionType.slice(1)],
                ["Duration", "45 minutes"],
                ["Student", LOGGED_USER.name],
              ].map(([label, val]) => (
                <View
                  key={label}
                  style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: `${ceylon.sand}` }}
                >
                  <Text style={{ color: ceylon.muted, fontSize: 12 }}>{label}</Text>
                  <Text style={{ color: ceylon.ink, fontSize: 12, fontWeight: "600" }}>{val}</Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Confirm button */}
          <TouchableOpacity
            disabled={!canBook || bookLoading}
            onPress={handleBook}
            activeOpacity={0.85}
            style={{
              backgroundColor: canBook && !bookLoading ? accentColor : ceylon.mutedLight,
              borderRadius: 18,
              paddingVertical: SPACE.md + 4,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: SPACE.sm,
              shadowColor: canBook && !bookLoading ? accentColor : "transparent",
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: canBook && !bookLoading ? 4 : 0,
            }}
          >
            {bookLoading && <ActivityIndicator color="#fff" size="small" />}
            <Text style={{ color: canBook && !bookLoading ? "#fff" : "#fff", fontSize: 15, fontWeight: "700" }}>
              {bookLoading ? "Booking..." : "Confirm Appointment"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}