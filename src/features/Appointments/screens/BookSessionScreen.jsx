import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  MONTH_NAMES,
  DAYS,
  TIME_SLOTS,
  COUNSELORS,
  INITIAL_APPOINTMENTS,
} from "../services/mockData";
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  dateKey,
  formatDisplayDate,
  timeSlotToISO,
} from "../hooks/dateHelpers";

// Initialize Day.js Global UTC Plugin
dayjs.extend(utc);

// ─── Logged-in User Context Mock ──────────────────────────────────────────────
const LOGGED_USER = {
  id: "U001",
  name: "Kasun Perera",
};

// ─── Main Functional Component ────────────────────────────────────────────────
export default function BookSessionScreen() {
  // Lock current baseline to absolute Global UTC Time
  const nowGlobal = useMemo(() => dayjs.utc(), []);
  const todayDateStr = nowGlobal.format("YYYY-MM-DD");
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [calMonth, setCalMonth] = useState(nowGlobal.month()); // 0-11
  const [calYear, setCalYear] = useState(nowGlobal.year());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [sessionType, setSessionType] = useState("online");
  const [note, setNote] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // 1. Compute Optimized Appointment Lookups (O(1) Hash Map)
  const systemScheduleMap = useMemo(() => {
    const map = {};
    appointments.forEach((appt) => {
      const [datePart, timePart] = appt.appointmentDateTime.split("T");
      const cleanTime = timePart.substring(0, 5); // Extracts "HH:MM"

      if (!map[datePart]) {
        map[datePart] = {
          globalSlots: [],
          studentHasBooking: false,
          studentBookingDetails: null,
        };
      }
      map[datePart].globalSlots.push(cleanTime);

      if (appt.studentId === LOGGED_USER.id) {
        map[datePart].studentHasBooking = true;
        map[datePart].studentBookingDetails = appt;
      }
    });
    return map;
  }, [appointments]);

  // Filter out current user's profile appointments for history stream
  const myAppointments = useMemo(() => {
    return appointments.filter((a) => a.studentId === LOGGED_USER.id);
  }, [appointments]);

  // Counselor search filtration logic
  const filteredCounselors = useMemo(() => {
    if (!searchQuery.trim()) return COUNSELORS;
    const q = searchQuery.toLowerCase();
    return COUNSELORS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.specialties.some((s) => s.toLowerCase().includes(q)),
    );
  }, [searchQuery]);

  const selectedDateStr = selectedDay
    ? dateKey(calYear, calMonth, selectedDay)
    : null;
  const myExistingOnDate = selectedDateStr
    ? systemScheduleMap[selectedDateStr]?.studentBookingDetails || null
    : null;

  // Selected counselor profile tracking
  const counselorMyAppointments = useMemo(() => {
    if (!selectedCounselor) return [];
    return myAppointments.filter((a) => a.counselorId === selectedCounselor.id);
  }, [selectedCounselor, myAppointments]);

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  // ── Navigation Rules ──
  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else setCalMonth((m) => m - 1);
    setSelectedDay(null);
    setSelectedTime(null);
  }

  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else setCalMonth((m) => m + 1);
    setSelectedDay(null);
    setSelectedTime(null);
  }

  function handleBook() {
    if (!selectedCounselor || !selectedDay || !selectedTime || !selectedDateStr)
      return;

    const targetTimeISO = timeSlotToISO(selectedTime);
    const daySchedule = systemScheduleMap[selectedDateStr];

    // Final safety validations
    if (daySchedule?.studentHasBooking) return;
    if (daySchedule?.globalSlots.includes(targetTimeISO)) return;
    if ((daySchedule?.globalSlots.length || 0) >= TIME_SLOTS.length) return;

    const newAppointment = {
      appointmentId: `APP${String(appointments.length + 1).padStart(3, "0")}`,
      studentId: LOGGED_USER.id,
      counselorId: selectedCounselor.id,
      appointmentDateTime: `${selectedDateStr}T${targetTimeISO}:00Z`, // Clean Normalized ISO
      durationMinutes: 45,
      type: sessionType,
      status: "pending",
      rescheduleCount: 0,
      createdAt: dayjs.utc().toISOString(),
      updatedAt: dayjs.utc().toISOString(),
      note: note.trim(),
    };

    console.log(
      "🚀 Booking Submitted Successfully:",
      JSON.stringify(newAppointment, null, 2),
    );

    setAppointments((prev) => [...prev, newAppointment]);
    setBookingSuccess(true);
    setTimeout(() => setBookingSuccess(false), 4000);

    setSelectedDay(null);
    setSelectedTime(null);
    setNote("");
  }

  const targetTimeISO = selectedTime ? timeSlotToISO(selectedTime) : null;
  const selectedDaySchedule = systemScheduleMap[selectedDateStr];
  const isSelectedTimeTaken =
    targetTimeISO && selectedDaySchedule?.globalSlots.includes(targetTimeISO);
  const isSelectedDayFull =
    (selectedDaySchedule?.globalSlots.length || 0) >= TIME_SLOTS.length;

  const canBook =
    !!selectedCounselor &&
    !!selectedDay &&
    !!selectedTime &&
    !myExistingOnDate &&
    !isSelectedTimeTaken &&
    !isSelectedDayFull;

  const accentColor = selectedCounselor?.color || "#7C3AED";

  return (
    <View className="flex-1 bg-[#F5F3FF]">
      {/* Dynamic Native Stack Configuration (Fixed Top Element Context) */}
      <Stack.Screen
        options={{
          headerTitle: "Book a session",
          headerTitleStyle: { fontWeight: "600", fontSize: 18 },
          headerStyle: { backgroundColor: "#F9FAF5" },
          headerShadowVisible: false,
          headerLeft: () => null,
          headerBackVisible: false,
          headerShown: true, // 👈 Ensures the navigation header stays fixed and visible
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Removed pt-12 to prevent elements from dropping down out of viewport */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
          className="flex-1"
        >
          {/* Success Alert Feedback Banner */}
          {bookingSuccess && (
            <View className="bg-emerald-100 border border-emerald-300 rounded-2xl p-4 mb-4">
              <Text className="text-emerald-800 text-xs font-semibold">
                ✅ Appointment confirmed! System states synced to global UTC database context.
              </Text>
            </View>
          )}

          {/* Search Bar Input Container */}
          <Text className="text-gray-500 font-semibold text-xs mb-2">
            Choose your counselor
          </Text>
          <View className="bg-gray-100 rounded-2xl px-4 py-3 flex-row items-center mb-4">
            <Text className="text-gray-400 mr-2 text-sm">🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name or specialty..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-sm text-gray-900 p-0"
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Text className="text-gray-400 text-sm ml-2">✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Counselor Selector Group */}
          <View className="mb-4">
            {filteredCounselors.length === 0 && (
              <Text className="text-gray-400 text-xs text-center py-4">
                No counselors found
              </Text>
            )}
            {(showAll
              ? filteredCounselors
              : filteredCounselors.slice(0, 3)
            ).map((c) => {
              const chosen = selectedCounselor?.id === c.id;
              const myCount = myAppointments.filter(
                (a) => a.counselorId === c.id,
              ).length;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => {
                    setSelectedCounselor(c);
                    setSelectedDay(null);
                    setSelectedTime(null);
                  }}
                  style={{
                    borderColor: chosen ? c.color : "#E5E7EB",
                    borderWidth: chosen ? 2 : 1.5,
                    backgroundColor: chosen ? c.bgColor : "#FFFFFF",
                    marginBottom: 8,
                    borderRadius: 16,
                    flex_direction: "row",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 14,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: c.bgColor,
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{c.avatar}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: chosen ? c.color : "#111827",
                        fontSize: 14,
                        fontWeight: "700",
                      }}
                    >
                      {c.name}
                    </Text>
                    <Text
                      style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}
                    >
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
                        <Text
                          style={{
                            color: c.color,
                            fontSize: 10,
                            fontWeight: "700",
                          }}
                        >
                          {myCount} session{myCount > 1 ? "s" : ""} booked
                        </Text>
                      </View>
                    )}
                  </View>
                  <View
                    style={{
                      backgroundColor: chosen ? c.color : "#F3F4F6",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: chosen ? "#fff" : "#374151",
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      {chosen ? "✓ Chosen" : "Select"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {filteredCounselors.length > 3 && (
              <TouchableOpacity
                onPress={() => setShowAll((v) => !v)}
                style={{ paddingVertical: 4 }}
              >
                <Text
                  style={{ color: "#7C3AED", fontSize: 12, fontWeight: "600" }}
                >
                  {showAll
                    ? "▲ Show less"
                    : `▼ Show ${filteredCounselors.length - 3} more counselors`}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Existing Counselor Booking Relations */}
          {selectedCounselor && counselorMyAppointments.length > 0 && (
            <View
              style={{
                backgroundColor: selectedCounselor.bgColor,
                borderColor: `${selectedCounselor.color}33`,
                borderWidth: 1,
                borderRadius: 16,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  color: selectedCounselor.color,
                  fontSize: 12,
                  fontWeight: "700",
                  marginBottom: 8,
                }}
              >
                📌 Your sessions with {selectedCounselor.name.split(" ").pop()}
              </Text>
              {counselorMyAppointments.map((a) => {
                const displayDate = dayjs
                  .utc(a.appointmentDateTime)
                  .format("DD MMM YYYY · hh:mm A");
                return (
                  <View
                    key={a.appointmentId}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 10,
                      padding: 10,
                      marginBottom: 6,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 12, color: "#374151" }}>
                      📅 {displayDate}
                    </Text>
                    <View
                      style={{
                        backgroundColor:
                          a.type === "online" ? "#DBEAFE" : "#F3E8FF",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: a.type === "online" ? "#1D4ED8" : "#7C3AED",
                          fontSize: 10,
                          fontWeight: "700",
                        }}
                      >
                        {a.type}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Calendar Card Component Engine */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 24,
              padding: 16,
              marginBottom: 16,
              shadowColor: "#7C3AED",
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <TouchableOpacity
                onPress={prevMonth}
                style={{
                  backgroundColor: "#F3F4F6",
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#374151" }}>‹</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827" }}>
                {MONTH_NAMES[calMonth]} {calYear}
              </Text>
              <TouchableOpacity
                onPress={nextMonth}
                style={{
                  backgroundColor: "#F3F4F6",
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#374151" }}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 6 }}>
              {DAYS.map((d) => (
                <Text
                  key={d}
                  style={{
                    width: "14.28%",
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: "700",
                    color: "#9CA3AF",
                  }}
                >
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
                      backgroundColor: selected
                        ? accentColor
                        : isToday
                          ? "#F3E8FF"
                          : "transparent",
                      opacity: isPast ? 0.3 : 1,
                      position: "relative",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: selected || isToday ? "800" : "400",
                        color: selected
                          ? "#fff"
                          : full
                            ? "#EF4444"
                            : isToday
                              ? "#7C3AED"
                              : "#374151",
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
                          backgroundColor: full ? "#EF4444" : accentColor,
                        }}
                      />
                    )}
                    {full && !selected && (
                      <View
                        style={{
                          position: "absolute",
                          top: 2,
                          right: 1,
                          backgroundColor: "#FEE2E2",
                          borderRadius: 3,
                          paddingHorizontal: 2,
                        }}
                      >
                        <Text style={{ fontSize: 7, color: "#EF4444", fontWeight: "700" }}>
                          FULL
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Color Indicators Legend Layout */}
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                marginTop: 12,
                paddingTop: 10,
                borderTopWidth: 0.5,
                borderTopColor: "#E5E7EB",
              }}
            >
              {[
                { color: accentColor, label: "Booked" },
                { color: "#EF4444", label: "Full (3/3)" },
                { color: "#F3E8FF", label: "Today", border: "#7C3AED" },
              ].map(({ color, label, border }) => (
                <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: color,
                      borderWidth: border ? 1 : 0,
                      borderColor: border || "transparent",
                    }}
                  />
                  <Text style={{ fontSize: 10, color: "#9CA3AF" }}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Dynamic Context Banner Rules */}
          {selectedDay && (
            <View
              style={{
                backgroundColor: myExistingOnDate
                  ? "#FEF2F2"
                  : isSelectedDayFull
                    ? "#FEF2F2"
                    : "#F3E8FF",
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  color: myExistingOnDate
                    ? "#B91C1C"
                    : isSelectedDayFull
                      ? "#B91C1C"
                      : "#6D28D9",
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                ⦾ {formatDisplayDate(calYear, calMonth, selectedDay)}
              </Text>
              {myExistingOnDate && (
                <Text style={{ color: "#DC2626", fontSize: 11, fontWeight: "700" }}>
                  ⚠ You already booked this day
                </Text>
              )}
              {!myExistingOnDate && isSelectedDayFull && (
                <Text style={{ color: "#EF4444", fontSize: 11, fontWeight: "700" }}>
                  ⚠ All 3 slots full
                </Text>
              )}
            </View>
          )}

          {/* Time Slots Option Group */}
          <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "700", marginBottom: 8 }}>
            Select time
          </Text>
          <View style={{ gap: 10, marginBottom: 16 }}>
            {TIME_SLOTS.map((t) => {
              const sel = selectedTime === t;
              const currentSlotISO = timeSlotToISO(t);
              const taken = selectedDaySchedule?.globalSlots.includes(currentSlotISO);
              const disabled = taken || !selectedDay || !!myExistingOnDate;

              return (
                <TouchableOpacity
                  key={t}
                  disabled={disabled}
                  onPress={() => setSelectedTime(t)}
                  style={{
                    borderColor: sel ? accentColor : taken ? "#FCA5A5" : "#E5E7EB",
                    borderWidth: sel ? 2 : 1.5,
                    backgroundColor: sel ? accentColor : taken ? "#FEF2F2" : "#F9FAFB",
                    opacity: disabled && !sel ? 0.65 : 1,
                    paddingVertical: 15,
                    paddingHorizontal: 18,
                    borderRadius: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Text style={{ fontSize: 18 }}>{t.includes("AM") ? "🌤" : "🌇"}</Text>
                    <Text
                      style={{
                        color: sel ? "#fff" : taken ? "#EF4444" : "#374151",
                        fontSize: 15,
                        fontWeight: "700",
                      }}
                    >
                      {t}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: sel
                        ? "rgba(255,255,255,0.25)"
                        : taken
                          ? "#FEE2E2"
                          : "#E5E7EB",
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: sel ? "#fff" : taken ? "#EF4444" : "#6B7280",
                      }}
                    >
                      {sel ? "✓ Selected" : taken ? "Booked" : "Available"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Session Type Group */}
          <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "700", marginBottom: 8 }}>
            Session type
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            {["online", "physical"].map((type) => {
              const sel = sessionType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSessionType(type)}
                  style={{
                    flex: 1,
                    paddingVertical: 13,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: sel ? accentColor : "#F9FAFB",
                    borderWidth: 1.5,
                    borderColor: sel ? "transparent" : "#E5E7EB",
                  }}
                >
                  <Text style={{ color: sel ? "#fff" : "#374151", fontSize: 13, fontWeight: "700" }}>
                    {type === "online" ? "💻 Online" : "🏥 Physical"} {sel ? " ✓" : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Student Session Notes Module */}
          <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "700", marginBottom: 8 }}>
            📝 Add a note (optional)
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Describe what you'd like to discuss in this session..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{
              backgroundColor: "#F9FAFB",
              borderWidth: 1.5,
              borderColor: "#E5E7EB",
              borderRadius: 14,
              padding: 14,
              fontSize: 13,
              color: "#374151",
              minHeight: 80,
              marginBottom: 4,
            }}
          />
          <Text style={{ fontSize: 10, color: "#9CA3AF", textAlign: "right", marginBottom: 16 }}>
            {note.length} characters
          </Text>

          {/* Structural Review Summary Card Component */}
          {selectedCounselor &&
            selectedDay &&
            selectedTime &&
            !isSelectedTimeTaken &&
            !myExistingOnDate && (
              <View
                style={{
                  backgroundColor: selectedCounselor.bgColor,
                  borderColor: `${selectedCounselor.color}33`,
                  borderWidth: 1,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    color: selectedCounselor.color,
                    fontSize: 12,
                    fontWeight: "700",
                    marginBottom: 10,
                  }}
                >
                  📋 Booking Summary
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
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingVertical: 5,
                      borderBottomWidth: 0.5,
                      borderBottomColor: "#E5E7EB80",
                    }}
                  >
                    <Text style={{ color: "#6B7280", fontSize: 12 }}>{label}</Text>
                    <Text style={{ color: "#374151", fontSize: 12, fontWeight: "600" }}>{val}</Text>
                  </View>
                ))}
              </View>
            )}

          {/* Dynamic Action Trigger Button */}
          <TouchableOpacity
            disabled={!canBook}
            onPress={handleBook}
            style={{
              backgroundColor: canBook ? accentColor : "#E5E7EB",
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: canBook ? accentColor : "transparent",
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: canBook ? 4 : 0,
            }}
          >
            <Text style={{ color: canBook ? "#fff" : "#9CA3AF", fontSize: 15, fontWeight: "700" }}>
              Confirm Appointment
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}