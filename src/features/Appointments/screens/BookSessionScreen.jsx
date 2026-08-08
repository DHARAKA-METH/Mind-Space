import React, {
  useState,
  useMemo,
  useEffect,
} from "react";

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

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  Stack,
} from "expo-router";

import {
  Ionicons,
} from "@expo/vector-icons";

import * as Haptics from "expo-haptics";

import Animated, {
  FadeInDown,
  FadeIn,
  Layout,
} from "react-native-reanimated";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import {
  MONTH_NAMES,
  DAYS,
  TIME_SLOTS,
} from "../services/mockData";

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

/* -------------------------------------------------------------------------- */
/*                                COLOR SYSTEM                                */
/* -------------------------------------------------------------------------- */

const colors = {
  background: "#F9F5F1",

  lavender: "#CCC5E8",
  lavenderSoft: "#F2EEF9",

  purple: "#6D5AB5",
  purpleDark: "#574493",

  peach: "#F47F63",
  peachSoft: "#FDE8E2",

  text: "#1F1F2E",
  secondaryText: "#8C8992",
  lightText: "#AAA4AE",

  white: "#FFFFFF",

  border: "#ECE6E2",

  success: "#679A6D",
  successSoft: "#EAF4E8",

  danger: "#C45B65",
  dangerSoft: "#FBE8E9",
};

/* -------------------------------------------------------------------------- */
/*                                  HEADER                                    */
/* -------------------------------------------------------------------------- */

const AppointmentHeader = () => {
  return (
    <View className="flex-row items-center">
      <View
        className="
          w-10
          h-10
          rounded-2xl
          bg-[#F2EEF9]
          items-center
          justify-center
          mr-3
        "
      >
        <Ionicons
          name="calendar-outline"
          size={20}
          color={colors.purple}
        />
      </View>

      <View>
        <Text
          className="
            text-[18px]
            font-extrabold
            text-[#1F1F2E]
          "
        >
          Book a Session
        </Text>

        <Text
          className="
            text-[10.5px]
            mt-0.5
            text-[#8C8992]
          "
        >
          Find support at a time that works for you
        </Text>
      </View>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                              TOGGLE SWITCH                                 */
/* -------------------------------------------------------------------------- */

const ToggleSwitch = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    {
      id: "book",
      label: "Book Session",
      icon: "calendar-outline",
      activeIcon: "calendar",
    },
    {
      id: "booked",
      label: "My Sessions",
      icon: "list-outline",
      activeIcon: "list",
    },
  ];

  return (
    <View
      className="
        flex-row
        p-1
        rounded-[20px]
        bg-white
        border
        border-[#ECE6E2]
        shadow-sm
      "
    >
      {tabs.map((tab) => {
        const isActive =
          activeTab === tab.id;

        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.82}
            onPress={() => {
              Haptics
                .selectionAsync()
                .catch(() => {});

              onTabChange(tab.id);
            }}
            className={`
              flex-1
              flex-row
              items-center
              justify-center
              min-h-[40px]
              px-1.5
              rounded-[16px]

              ${
                isActive
                  ? "bg-[#6D5AB5]"
                  : "bg-transparent"
              }
            `}
          >
            <View
              className={`
                w-6
                h-6
                rounded-full
                items-center
                justify-center
                mr-1

                ${
                  isActive
                    ? "bg-white/15"
                    : "bg-[#F2EEF9]"
                }
              `}
            >
              <Ionicons
                name={
                  isActive
                    ? tab.activeIcon
                    : tab.icon
                }
                size={13}
                color={
                  isActive
                    ? "#FFFFFF"
                    : colors.purple
                }
              />
            </View>

            <Text
              numberOfLines={1}
              className={`
                text-[10.5px]
                font-bold

                ${
                  isActive
                    ? "text-white"
                    : "text-[#706A76]"
                }
              `}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                         APPOINTMENT STATUS CARD                            */
/* -------------------------------------------------------------------------- */

const AppointmentCard = ({
  appointment,
  counselor,
  isPast,
}) => {
  const displayDate = dayjs
    .utc(
      appointment.appointmentDateTime
    )
    .format("MMM DD, YYYY");

  const displayTime = dayjs
    .utc(
      appointment.appointmentDateTime
    )
    .format("hh:mm A");

  const statusConfig = {
    confirmed: {
      bg: colors.successSoft,
      color: colors.success,
      label: "Confirmed",
    },

    pending: {
      bg: colors.peachSoft,
      color: colors.peach,
      label: "Pending",
    },

    cancelled: {
      bg: colors.dangerSoft,
      color: colors.danger,
      label: "Cancelled",
    },
  };

  const status =
    statusConfig[
      appointment.status
    ] || statusConfig.pending;

  return (
    <Animated.View
      entering={FadeInDown
        .duration(280)
        .springify()}
      layout={Layout}
      className="
        bg-white
        rounded-[22px]
        overflow-hidden
        mb-3
        border
        border-[#ECE6E2]
      "
      style={{
        opacity: isPast ? 0.62 : 1,
      }}
    >
      <View className="p-4">
        {/* Counselor */}

        <View className="flex-row items-start">
          <View
            className="
              w-12
              h-12
              rounded-2xl
              items-center
              justify-center
              mr-3
            "
            style={{
              backgroundColor:
                counselor?.bgColor ||
                colors.lavenderSoft,
            }}
          >
            <Text className="text-[22px]">
              {counselor?.avatar ||
                "🧑‍⚕️"}
            </Text>
          </View>

          <View className="flex-1">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-2">
                <Text
                  numberOfLines={1}
                  className="
                    text-[14px]
                    font-extrabold
                    text-[#1F1F2E]
                  "
                >
                  {counselor?.name ||
                    "Counselor"}
                </Text>

                <Text
                  numberOfLines={2}
                  className="
                    mt-1
                    text-[11px]
                    leading-4
                    text-[#8C8992]
                  "
                >
                  {counselor
                    ?.specialties
                    ?.join(" · ") ||
                    "General Counseling"}
                </Text>
              </View>

              <View
                className="
                  px-2.5
                  py-1.5
                  rounded-full
                "
                style={{
                  backgroundColor:
                    status.bg,
                }}
              >
                <Text
                  className="
                    text-[9.5px]
                    font-extrabold
                  "
                  style={{
                    color:
                      status.color,
                  }}
                >
                  {status.label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Appointment details */}

        <View
          className="
            mt-4
            pt-3
            border-t
            border-[#F0EAE6]
          "
        >
          <View className="flex-row flex-wrap gap-x-4 gap-y-2">
            <View className="flex-row items-center">
              <Ionicons
                name="calendar-outline"
                size={14}
                color={
                  colors.purple
                }
              />

              <Text
                className="
                  ml-1.5
                  text-[11px]
                  font-semibold
                  text-[#1F1F2E]
                "
              >
                {displayDate}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons
                name="time-outline"
                size={14}
                color={
                  colors.purple
                }
              />

              <Text
                className="
                  ml-1.5
                  text-[11px]
                  font-semibold
                  text-[#1F1F2E]
                "
              >
                {displayTime}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons
                name={
                  appointment.type ===
                  "online"
                    ? "videocam-outline"
                    : "location-outline"
                }
                size={14}
                color={
                  colors.purple
                }
              />

              <Text
                className="
                  ml-1.5
                  text-[11px]
                  font-semibold
                  capitalize
                  text-[#1F1F2E]
                "
              >
                {appointment.type}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}

        {!isPast &&
          appointment.status !==
            "cancelled" && (
            <View className="flex-row gap-2 mt-4">
              <TouchableOpacity
                activeOpacity={0.75}
                className="
                  flex-1
                  h-10
                  rounded-xl
                  bg-[#F2EEF9]
                  items-center
                  justify-center
                "
              >
                <Text
                  className="
                    text-[11px]
                    font-bold
                    text-[#6D5AB5]
                  "
                >
                  Reschedule
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                className="
                  flex-1
                  h-10
                  rounded-xl
                  bg-[#FBE8E9]
                  items-center
                  justify-center
                "
              >
                <Text
                  className="
                    text-[11px]
                    font-bold
                    text-[#C45B65]
                  "
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}
      </View>
    </Animated.View>
  );
};

/* -------------------------------------------------------------------------- */
/*                            BOOKED DETAILS                                  */
/* -------------------------------------------------------------------------- */

const BookedDetailsView = ({
  appointments,
  counselors,
}) => {
  const now = dayjs.utc();

  const grouped = useMemo(() => {
    const upcoming =
      appointments
        .filter(
          (appointment) =>
            dayjs
              .utc(
                appointment.appointmentDateTime
              )
              .isAfter(now) &&
            appointment.status !==
              "cancelled"
        )
        .sort((a, b) =>
          dayjs
            .utc(
              a.appointmentDateTime
            )
            .diff(
              dayjs.utc(
                b.appointmentDateTime
              )
            )
        );

    const past =
      appointments
        .filter(
          (appointment) =>
            dayjs
              .utc(
                appointment.appointmentDateTime
              )
              .isBefore(now) ||
            appointment.status ===
              "cancelled"
        )
        .sort((a, b) =>
          dayjs
            .utc(
              b.appointmentDateTime
            )
            .diff(
              dayjs.utc(
                a.appointmentDateTime
              )
            )
        );

    return {
      upcoming,
      past,
    };
  }, [appointments]);

  const getCounselor = (
    counselorId
  ) =>
    counselors.find(
      (counselor) =>
        counselor.id ===
        counselorId
    );

  if (
    appointments.length === 0
  ) {
    return (
      <View className="items-center justify-center py-16">
        <View
          className="
            w-[76px]
            h-[76px]
            rounded-[26px]
            bg-[#F2EEF9]
            items-center
            justify-center
            mb-4
          "
        >
          <Ionicons
            name="calendar-outline"
            size={30}
            color={colors.purple}
          />
        </View>

        <Text
          className="
            text-[16px]
            font-extrabold
            text-[#1F1F2E]
          "
        >
          No sessions yet
        </Text>

        <Text
          className="
            text-[12px]
            leading-[18px]
            mt-1.5
            text-center
            text-[#8C8992]
            max-w-[250px]
          "
        >
          When you're ready,
          choose a counselor and
          schedule your first
          session.
        </Text>
      </View>
    );
  }

  return (
    <View className="mt-5">
      {grouped.upcoming.length >
        0 && (
        <View className="mb-7">
          <View className="flex-row items-center mb-3">
            <View
              className="
                w-8
                h-8
                rounded-xl
                bg-[#EEE9F7]
                items-center
                justify-center
                mr-2.5
              "
            >
              <Ionicons
                name="calendar-outline"
                size={15}
                color={
                  colors.purple
                }
              />
            </View>

            <View>
              <Text
                className="
                  text-[14px]
                  font-extrabold
                  text-[#1F1F2E]
                "
              >
                Upcoming sessions
              </Text>

              <Text
                className="
                  text-[10px]
                  text-[#8C8992]
                "
              >
                {
                  grouped.upcoming
                    .length
                }{" "}
                scheduled
              </Text>
            </View>
          </View>

          {grouped.upcoming.map(
            (appointment) => (
              <AppointmentCard
                key={
                  appointment.appointmentId
                }
                appointment={
                  appointment
                }
                counselor={getCounselor(
                  appointment.counselorId
                )}
                isPast={false}
              />
            )
          )}
        </View>
      )}

      {grouped.past.length >
        0 && (
        <View>
          <View className="flex-row items-center mb-3">
            <View
              className="
                w-8
                h-8
                rounded-xl
                bg-[#FDE8E2]
                items-center
                justify-center
                mr-2.5
              "
            >
              <Ionicons
                name="time-outline"
                size={15}
                color={
                  colors.peach
                }
              />
            </View>

            <View>
              <Text
                className="
                  text-[14px]
                  font-extrabold
                  text-[#1F1F2E]
                "
              >
                Previous sessions
              </Text>

              <Text
                className="
                  text-[10px]
                  text-[#8C8992]
                "
              >
                {
                  grouped.past
                    .length
                }{" "}
                sessions
              </Text>
            </View>
          </View>

          {grouped.past.map(
            (appointment) => (
              <AppointmentCard
                key={
                  appointment.appointmentId
                }
                appointment={
                  appointment
                }
                counselor={getCounselor(
                  appointment.counselorId
                )}
                isPast
              />
            )
          )}
        </View>
      )}
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                               MAIN SCREEN                                  */
/* -------------------------------------------------------------------------- */

export default function BookSessionScreen() {
  const nowGlobal = useMemo(
    () => dayjs.utc(),
    []
  );

  const todayDateStr =
    nowGlobal.format(
      "YYYY-MM-DD"
    );

  const LOGGED_USER =
    useMemo(
      () =>
        getLoggedUser() || {
          id: "",
          name: "Student",
        },
      []
    );

  const [
    appointments,
    setAppointments,
  ] = useState([]);

  const [
    counselors,
    setCounselors,
  ] = useState([]);

  const [
    selectedCounselor,
    setSelectedCounselor,
  ] = useState(null);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    calMonth,
    setCalMonth,
  ] = useState(
    nowGlobal.month()
  );

  const [
    calYear,
    setCalYear,
  ] = useState(
    nowGlobal.year()
  );

  const [
    selectedDay,
    setSelectedDay,
  ] = useState(
    nowGlobal.date()
  );

  const [
    selectedTime,
    setSelectedTime,
  ] = useState(null);

  const [
    sessionType,
    setSessionType,
  ] = useState("online");

  const [
    note,
    setNote,
  ] = useState("");

  const [
    bookingSuccess,
    setBookingSuccess,
  ] = useState(false);

  const [
    showAll,
    setShowAll,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    bookLoading,
    setBookLoading,
  ] = useState(false);

  const [
    activeView,
    setActiveView,
  ] = useState("book");

  /* ------------------------------------------------------------------------ */
  /*                              LOAD DATA                                   */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    getCounselors().then(
      setCounselors
    );

    const user =
      getLoggedUser();

    if (user) {
      fetchAppointments(
        user.id
      ).then((data) => {
        setAppointments(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                         APPOINTMENT MAP                                  */
  /* ------------------------------------------------------------------------ */

  const systemScheduleMap =
    useMemo(() => {
      const map = {};

      appointments.forEach(
        (appointment) => {
          const [
            datePart,
            timePart,
          ] =
            appointment.appointmentDateTime.split(
              "T"
            );

          const cleanTime =
            timePart.substring(
              0,
              5
            );

          if (!map[datePart]) {
            map[datePart] = {
              globalSlots: [],
              studentHasBooking:
                false,
              studentBookingDetails:
                null,
            };
          }

          map[
            datePart
          ].globalSlots.push(
            cleanTime
          );

          if (
            appointment.studentId ===
            LOGGED_USER.id
          ) {
            map[
              datePart
            ].studentHasBooking =
              true;

            map[
              datePart
            ].studentBookingDetails =
              appointment;
          }
        }
      );

      return map;
    }, [
      appointments,
      LOGGED_USER.id,
    ]);

  /* ------------------------------------------------------------------------ */
  /*                          MY APPOINTMENTS                                 */
  /* ------------------------------------------------------------------------ */

  const myAppointments =
    useMemo(
      () =>
        appointments.filter(
          (appointment) =>
            appointment.studentId ===
            LOGGED_USER.id
        ),
      [
        appointments,
        LOGGED_USER.id,
      ]
    );

  /* ------------------------------------------------------------------------ */
  /*                         FILTER COUNSELORS                                */
  /* ------------------------------------------------------------------------ */

  const filteredCounselors =
    useMemo(() => {
      if (!searchQuery.trim()) {
        return counselors;
      }

      const query =
        searchQuery.toLowerCase();

      return counselors.filter(
        (counselor) =>
          counselor.name
            .toLowerCase()
            .includes(query) ||
          counselor.specialties.some(
            (specialty) =>
              specialty
                .toLowerCase()
                .includes(query)
          )
      );
    }, [
      searchQuery,
      counselors,
    ]);

  /* ------------------------------------------------------------------------ */
  /*                          SELECTED DATE                                   */
  /* ------------------------------------------------------------------------ */

  const selectedDateStr =
    selectedDay
      ? dateKey(
          calYear,
          calMonth,
          selectedDay
        )
      : null;

  const myExistingOnDate =
    selectedDateStr
      ? systemScheduleMap[
          selectedDateStr
        ]?.studentBookingDetails ||
        null
      : null;

  const counselorMyAppointments =
    useMemo(() => {
      if (!selectedCounselor) {
        return [];
      }

      return myAppointments.filter(
        (appointment) =>
          appointment.counselorId ===
          selectedCounselor.id
      );
    }, [
      selectedCounselor,
      myAppointments,
    ]);

  const daysInMonth =
    getDaysInMonth(
      calYear,
      calMonth
    );

  const firstDay =
    getFirstDayOfMonth(
      calYear,
      calMonth
    );

  /* ------------------------------------------------------------------------ */
  /*                            MONTH CONTROLS                                */
  /* ------------------------------------------------------------------------ */

  const canGoPrevMonth = () => {
    if (
      calYear >
      nowGlobal.year()
    ) {
      return true;
    }

    if (
      calYear ===
        nowGlobal.year() &&
      calMonth >
        nowGlobal.month()
    ) {
      return true;
    }

    return false;
  };

  function prevMonth() {
    if (!canGoPrevMonth()) {
      return;
    }

    Haptics
      .selectionAsync()
      .catch(() => {});

    if (calMonth === 0) {
      setCalMonth(11);

      setCalYear(
        (year) => year - 1
      );
    } else {
      setCalMonth(
        (month) =>
          month - 1
      );
    }

    setSelectedDay(1);
    setSelectedTime(null);
  }

  function nextMonth() {
    Haptics
      .selectionAsync()
      .catch(() => {});

    if (calMonth === 11) {
      setCalMonth(0);

      setCalYear(
        (year) => year + 1
      );
    } else {
      setCalMonth(
        (month) =>
          month + 1
      );
    }

    setSelectedDay(1);
    setSelectedTime(null);
  }

  /* ------------------------------------------------------------------------ */
  /*                                BOOK                                     */
  /* ------------------------------------------------------------------------ */

  async function handleBook() {
    if (
      !selectedCounselor ||
      !selectedDay ||
      !selectedTime ||
      !selectedDateStr ||
      !LOGGED_USER.id
    ) {
      return;
    }

    const targetTimeISO =
      timeSlotToISO(
        selectedTime
      );

    const daySchedule =
      systemScheduleMap[
        selectedDateStr
      ];

    if (
      daySchedule?.studentHasBooking
    ) {
      return;
    }

    if (
      daySchedule?.globalSlots.includes(
        targetTimeISO
      )
    ) {
      return;
    }

    if (
      (daySchedule?.globalSlots
        .length || 0) >=
      TIME_SLOTS.length
    ) {
      return;
    }

    setBookLoading(true);

    try {
      const appointmentData = {
        studentId:
          LOGGED_USER.id,

        counselorId:
          selectedCounselor.id,

        appointmentDateTime:
          `${selectedDateStr}T${targetTimeISO}:00Z`,

        durationMinutes: 45,

        type: sessionType,

        note: note.trim(),
      };

      const newId =
        await createAppointment(
          appointmentData
        );

      const newAppointment = {
        ...appointmentData,

        appointmentId:
          newId,

        status: "pending",

        rescheduleCount: 0,

        createdAt:
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString(),
      };

      Haptics
        .notificationAsync(
          Haptics
            .NotificationFeedbackType
            .Success
        )
        .catch(() => {});

      setAppointments(
        (previous) => [
          ...previous,
          newAppointment,
        ]
      );

      setBookingSuccess(true);

      setTimeout(
        () =>
          setBookingSuccess(
            false
          ),
        4000
      );

      setSelectedDay(
        nowGlobal.date()
      );

      setSelectedTime(null);

      setNote("");
    } catch (error) {
      Haptics
        .notificationAsync(
          Haptics
            .NotificationFeedbackType
            .Error
        )
        .catch(() => {});

      Alert.alert(
        "Booking Failed",
        error.message ||
          "Could not create appointment. Please try again."
      );
    } finally {
      setBookLoading(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                              BOOKING STATE                               */
  /* ------------------------------------------------------------------------ */

  const targetTimeISO =
    selectedTime
      ? timeSlotToISO(
          selectedTime
        )
      : null;

  const selectedDaySchedule =
    selectedDateStr
      ? systemScheduleMap[
          selectedDateStr
        ]
      : null;

  const isSelectedTimeTaken =
    !!targetTimeISO &&
    selectedDaySchedule?.globalSlots.includes(
      targetTimeISO
    );

  const isSelectedDayFull =
    (selectedDaySchedule
      ?.globalSlots.length ||
      0) >=
    TIME_SLOTS.length;

  const canBook =
    !!selectedCounselor &&
    !!selectedDay &&
    !!selectedTime &&
    !myExistingOnDate &&
    !isSelectedTimeTaken &&
    !isSelectedDayFull;

  /* ------------------------------------------------------------------------ */
  /*                                LOADING                                   */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: () => (
              <AppointmentHeader />
            ),

            headerShadowVisible:
              false,

            headerStyle: {
              backgroundColor:
                colors.background,
            },

            headerTintColor:
              colors.purple,

            headerTitleAlign:
              "left",
          }}
        />

        <SafeAreaView
          edges={[
            "left",
            "right",
            "bottom",
          ]}
          className="
            flex-1
            bg-[#F9F5F1]
            items-center
            justify-center
          "
        >
          <View
            className="
              w-[72px]
              h-[72px]
              rounded-[24px]
              bg-[#F2EEF9]
              items-center
              justify-center
              mb-4
            "
          >
            <ActivityIndicator
              size="small"
              color={
                colors.purple
              }
            />
          </View>

          <Text
            className="
              text-[14px]
              font-bold
              text-[#1F1F2E]
            "
          >
            Finding available
            counselors…
          </Text>

          <Text
            className="
              mt-1.5
              text-[11px]
              text-[#8C8992]
            "
          >
            Preparing your
            booking options
          </Text>
        </SafeAreaView>
      </>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                                 SCREEN                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <AppointmentHeader />
          ),

          headerShadowVisible:
            false,

          headerStyle: {
            backgroundColor:
              colors.background,
          },

          headerTintColor:
            colors.purple,

          headerTitleAlign:
            "left",
        }}
      />

      <SafeAreaView
        edges={[
          "left",
          "right",
          "bottom",
        ]}
        className="
          flex-1
          bg-[#F9F5F1]
        "
      >
        <KeyboardAvoidingView
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
          keyboardVerticalOffset={
            Platform.OS === "ios"
              ? 88
              : 0
          }
          className="flex-1"
        >
          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="
              px-[18px]
              pt-4
              pb-10
            "
          >
            {/* Toggle */}

            <ToggleSwitch
              activeTab={
                activeView
              }
              onTabChange={
                setActiveView
              }
            />

            {/* ========================================================== */}
            {/* BOOK VIEW                                                  */}
            {/* ========================================================== */}

            {activeView ===
              "book" && (
              <Animated.View
                entering={FadeIn.duration(
                  200
                )}
              >
                {/* Intro */}

                <View className="mt-6 mb-5">
                  <Text
                    className="
                      text-[11px]
                      tracking-[1px]
                      font-extrabold
                      text-[#6D5AB5]
                      uppercase
                    "
                  >
                    Personal support
                  </Text>

                  <Text
                    className="
                      mt-1.5
                      text-[16px]
                      leading-7
                      font-extrabold
                      text-[#1F1F2E]
                    "
                  >
                    Choose someone
                    you feel
                    comfortable
                    talking with
                  </Text>

                  <Text
                    className="
                      mt-1.5
                      text-[12px]
                      leading-[18px]
                      text-[#8C8992]
                    "
                  >
                    Select a counselor,
                    choose a suitable
                    date and time, and
                    request your
                    session.
                  </Text>
                </View>

                {/* Success */}

                {bookingSuccess && (
                  <Animated.View
                    entering={FadeInDown.duration(
                      250
                    )}
                    className="
                      flex-row
                      items-center
                      bg-[#EAF4E8]
                      border
                      border-[#D5E8D3]
                      rounded-[20px]
                      px-4
                      py-3.5
                      mb-5
                    "
                  >
                    <View
                      className="
                        w-9
                        h-9
                        rounded-full
                        bg-white
                        items-center
                        justify-center
                        mr-3
                      "
                    >
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={
                          colors.success
                        }
                      />
                    </View>

                    <View className="flex-1">
                      <Text
                        className="
                          text-[12px]
                          font-bold
                          text-[#4F8056]
                        "
                      >
                        Appointment
                        requested
                      </Text>

                      <Text
                        className="
                          mt-0.5
                          text-[10.5px]
                          leading-[15px]
                          text-[#6D8A71]
                        "
                      >
                        We'll let you
                        know once your
                        counselor
                        confirms it.
                      </Text>
                    </View>
                  </Animated.View>
                )}

                {/* ------------------------------------------------------ */}
                {/* COUNSELOR SEARCH                                       */}
                {/* ------------------------------------------------------ */}

                <SectionTitle
                  icon="people-outline"
                  title="Choose your counselor"
                  subtitle="Find someone who matches what you'd like support with"
                />

                <View
                  className="
                    h-12
                    mb-4
                    px-4
                    flex-row
                    items-center
                    bg-white
                    rounded-2xl
                    border
                    border-[#ECE6E2]
                  "
                >
                  <Ionicons
                    name="search-outline"
                    size={17}
                    color={
                      colors.secondaryText
                    }
                  />

                  <TextInput
                    value={
                      searchQuery
                    }
                    onChangeText={
                      setSearchQuery
                    }
                    placeholder="Search name or specialty"
                    placeholderTextColor="#AAA4AE"
                    className="
                      flex-1
                      ml-2.5
                      p-0
                      text-[13px]
                      text-[#1F1F2E]
                    "
                  />

                  {searchQuery !==
                    "" && (
                    <TouchableOpacity
                      onPress={() =>
                        setSearchQuery(
                          ""
                        )
                      }
                    >
                      <Ionicons
                        name="close-circle"
                        size={17}
                        color="#AAA4AE"
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Counselors */}

                <View className="mb-5">
                  {filteredCounselors.length ===
                    0 && (
                    <View className="items-center py-8">
                      <View
                        className="
                          w-12
                          h-12
                          rounded-2xl
                          bg-[#F2EEF9]
                          items-center
                          justify-center
                          mb-3
                        "
                      >
                        <Ionicons
                          name="search-outline"
                          size={21}
                          color={
                            colors.purple
                          }
                        />
                      </View>

                      <Text
                        className="
                          text-[12px]
                          font-semibold
                          text-[#8C8992]
                        "
                      >
                        No counselors
                        found
                      </Text>
                    </View>
                  )}

                  {(showAll
                    ? filteredCounselors
                    : filteredCounselors.slice(
                        0,
                        3
                      )
                  ).map(
                    (
                      counselor,
                      index
                    ) => {
                      const chosen =
                        selectedCounselor
                          ?.id ===
                        counselor.id;

                      const myCount =
                        myAppointments.filter(
                          (
                            appointment
                          ) =>
                            appointment.counselorId ===
                            counselor.id
                        ).length;

                      return (
                        <Animated.View
                          key={
                            counselor.id
                          }
                          entering={FadeInDown
                            .delay(
                              index *
                                45
                            )
                            .duration(
                              240
                            )}
                        >
                          <TouchableOpacity
                            activeOpacity={
                              0.82
                            }
                            onPress={() => {
                              Haptics
                                .selectionAsync()
                                .catch(
                                  () =>
                                    {}
                                );

                              setSelectedCounselor(
                                counselor
                              );

                              setSelectedDay(
                                nowGlobal.date()
                              );

                              setSelectedTime(
                                null
                              );
                            }}
                            className={`
                              flex-row
                              items-center
                              p-3.5
                              mb-2.5
                              rounded-[20px]
                              border

                              ${
                                chosen
                                  ? "bg-[#F2EEF9] border-[#6D5AB5]"
                                  : "bg-white border-[#ECE6E2]"
                              }
                            `}
                          >
                            {/* Avatar */}

                            <View
                              className="
                                w-12
                                h-12
                                rounded-2xl
                                items-center
                                justify-center
                                mr-3
                              "
                              style={{
                                backgroundColor:
                                  counselor.bgColor ||
                                  colors.lavenderSoft,
                              }}
                            >
                              <Text className="text-[23px]">
                                {
                                  counselor.avatar
                                }
                              </Text>
                            </View>

                            {/* Info */}

                            <View className="flex-1">
                              <Text
                                numberOfLines={
                                  1
                                }
                                className={`
                                  text-[14px]
                                  font-extrabold

                                  ${
                                    chosen
                                      ? "text-[#6D5AB5]"
                                      : "text-[#1F1F2E]"
                                  }
                                `}
                              >
                                {
                                  counselor.name
                                }
                              </Text>

                              <Text
                                numberOfLines={
                                  2
                                }
                                className="
                                  mt-1
                                  text-[11px]
                                  leading-[15px]
                                  text-[#8C8992]
                                "
                              >
                                {counselor.specialties.join(
                                  " · "
                                )}
                              </Text>

                              {myCount >
                                0 && (
                                <View
                                  className="
                                    self-start
                                    mt-2
                                    px-2.5
                                    py-1
                                    bg-white
                                    rounded-full
                                  "
                                >
                                  <Text
                                    className="
                                      text-[9px]
                                      font-bold
                                      text-[#6D5AB5]
                                    "
                                  >
                                    {
                                      myCount
                                    }{" "}
                                    previous{" "}
                                    {myCount >
                                    1
                                      ? "sessions"
                                      : "session"}
                                  </Text>
                                </View>
                              )}
                            </View>

                            {/* Selection */}

                            <View
                              className={`
                                px-3
                                py-2
                                rounded-xl

                                ${
                                  chosen
                                    ? "bg-[#6D5AB5]"
                                    : "bg-[#F9F5F1]"
                                }
                              `}
                            >
                              <Text
                                className={`
                                  text-[10.5px]
                                  font-bold

                                  ${
                                    chosen
                                      ? "text-white"
                                      : "text-[#8C8992]"
                                  }
                                `}
                              >
                                {chosen
                                  ? "✓ Selected"
                                  : "Select"}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        </Animated.View>
                      );
                    }
                  )}

                  {filteredCounselors.length >
                    3 && (
                    <TouchableOpacity
                      activeOpacity={
                        0.7
                      }
                      onPress={() => {
                        Haptics
                          .selectionAsync()
                          .catch(
                            () => {}
                          );

                        setShowAll(
                          (value) =>
                            !value
                        );
                      }}
                      className="
                        self-center
                        mt-2
                        px-4
                        py-2
                        rounded-full
                        bg-[#F2EEF9]
                      "
                    >
                      <Text
                        className="
                          text-[11px]
                          font-bold
                          text-[#6D5AB5]
                        "
                      >
                        {showAll
                          ? "Show less"
                          : `Show ${
                              filteredCounselors.length -
                              3
                            } more`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Existing sessions */}

                {selectedCounselor &&
                  counselorMyAppointments.length >
                    0 && (
                    <Animated.View
                      entering={FadeIn.duration(
                        220
                      )}
                      className="
                        bg-[#F2EEF9]
                        rounded-[20px]
                        p-4
                        mb-5
                        border
                        border-[#E4DCEF]
                      "
                    >
                      <Text
                        className="
                          text-[12px]
                          font-bold
                          text-[#6D5AB5]
                          mb-3
                        "
                      >
                        Your sessions
                        with{" "}
                        {selectedCounselor.name
                          .split(
                            " "
                          )
                          .pop()}
                      </Text>

                      {counselorMyAppointments.map(
                        (
                          appointment
                        ) => {
                          const displayDate =
                            dayjs
                              .utc(
                                appointment.appointmentDateTime
                              )
                              .format(
                                "DD MMM YYYY · hh:mm A"
                              );

                          return (
                            <View
                              key={
                                appointment.appointmentId
                              }
                              className="
                                bg-white
                                rounded-xl
                                px-3
                                py-2.5
                                mb-2
                              "
                            >
                              <View className="flex-row items-center">
                                <Ionicons
                                  name="calendar-outline"
                                  size={
                                    13
                                  }
                                  color={
                                    colors.purple
                                  }
                                />

                                <Text
                                  className="
                                    ml-1.5
                                    flex-1
                                    text-[10.5px]
                                    text-[#1F1F2E]
                                  "
                                >
                                  {
                                    displayDate
                                  }
                                </Text>

                                <Text
                                  className="
                                    text-[9px]
                                    font-bold
                                    capitalize
                                    text-[#8C8992]
                                  "
                                >
                                  {
                                    appointment.status
                                  }
                                </Text>
                              </View>
                            </View>
                          );
                        }
                      )}
                    </Animated.View>
                  )}

                {/* ------------------------------------------------------ */}
                {/* CALENDAR                                               */}
                {/* ------------------------------------------------------ */}

                <SectionTitle
                  icon="calendar-outline"
                  title="Choose a date"
                  subtitle="Select a day that feels convenient for you"
                />

                <View
                  className="
                    bg-white
                    rounded-[26px]
                    p-4
                    mb-5
                    border
                    border-[#ECE6E2]
                    shadow-sm
                  "
                >
                  {/* Month */}

                  <View className="flex-row items-center justify-between mb-4">
                    <TouchableOpacity
                      disabled={
                        !canGoPrevMonth()
                      }
                      onPress={
                        prevMonth
                      }
                      className="
                        w-10
                        h-10
                        rounded-2xl
                        bg-[#F2EEF9]
                        items-center
                        justify-center
                      "
                      style={{
                        opacity:
                          canGoPrevMonth()
                            ? 1
                            : 0.35,
                      }}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={18}
                        color={
                          colors.purple
                        }
                      />
                    </TouchableOpacity>

                    <Text
                      className="
                        text-[16px]
                        font-extrabold
                        text-[#1F1F2E]
                      "
                    >
                      {
                        MONTH_NAMES[
                          calMonth
                        ]
                      }{" "}
                      {calYear}
                    </Text>

                    <TouchableOpacity
                      onPress={
                        nextMonth
                      }
                      className="
                        w-10
                        h-10
                        rounded-2xl
                        bg-[#F2EEF9]
                        items-center
                        justify-center
                      "
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={
                          colors.purple
                        }
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Weekdays */}

                  <View className="flex-row mb-2">
                    {DAYS.map(
                      (day) => (
                        <Text
                          key={
                            day
                          }
                          className="
                            text-center
                            text-[10px]
                            font-extrabold
                            text-[#AAA4AE]
                          "
                          style={{
                            width:
                              "14.28%",
                          }}
                        >
                          {
                            day
                          }
                        </Text>
                      )
                    )}
                  </View>

                  {/* Dates */}

                  <View className="flex-row flex-wrap">
                    {Array.from({
                      length:
                        firstDay,
                    }).map(
                      (
                        _,
                        index
                      ) => (
                        <View
                          key={`empty-${index}`}
                          style={{
                            width:
                              "14.28%",
                            aspectRatio: 1,
                          }}
                        />
                      )
                    )}

                    {Array.from({
                      length:
                        daysInMonth,
                    }).map(
                      (
                        _,
                        index
                      ) => {
                        const day =
                          index +
                          1;

                        const loopDateStr =
                          dateKey(
                            calYear,
                            calMonth,
                            day
                          );

                        const isToday =
                          loopDateStr ===
                          todayDateStr;

                        const isPast =
                          loopDateStr <
                          todayDateStr;

                        const metadata =
                          systemScheduleMap[
                            loopDateStr
                          ];

                        const totalBookedSlots =
                          metadata
                            ?.globalSlots
                            .length ||
                          0;

                        const hasBookings =
                          totalBookedSlots >
                          0;

                        const full =
                          totalBookedSlots >=
                          TIME_SLOTS.length;

                        const selected =
                          selectedDay ===
                          day;

                        return (
                          <View
                            key={
                              day
                            }
                            className="items-center my-1"
                            style={{
                              width:
                                "14.28%",
                            }}
                          >
                            <TouchableOpacity
                              disabled={
                                isPast ||
                                full
                              }
                              activeOpacity={
                                0.75
                              }
                              onPress={() => {
                                if (
                                  isPast
                                ) {
                                  return;
                                }

                                Haptics
                                  .selectionAsync()
                                  .catch(
                                    () =>
                                      {}
                                  );

                                setSelectedDay(
                                  day
                                );

                                setSelectedTime(
                                  null
                                );
                              }}
                              className={`
                                w-full
                                aspect-square
                                rounded-[14px]
                                items-center
                                justify-center

                                ${
                                  selected
                                    ? "bg-[#6D5AB5]"
                                    : isToday
                                    ? "bg-[#F2EEF9]"
                                    : "bg-transparent"
                                }
                              `}
                              style={{
                                opacity:
                                  isPast
                                    ? 0.3
                                    : 1,

                                borderWidth:
                                  isToday &&
                                  !selected
                                    ? 1
                                    : 0,

                                borderColor:
                                  colors.purple,
                              }}
                            >
                              <Text
                                className={`
                                  text-[14px]

                                  ${
                                    selected ||
                                    isToday
                                      ? "font-extrabold"
                                      : "font-medium"
                                  }

                                  ${
                                    selected
                                      ? "text-white"
                                      : full
                                      ? "text-[#C45B65]"
                                      : isToday
                                      ? "text-[#6D5AB5]"
                                      : "text-[#1F1F2E]"
                                  }
                                `}
                              >
                                {
                                  day
                                }
                              </Text>

                              {isToday && (
                                <View
                                  className={`
                                    mt-0.5
                                    w-1
                                    h-1
                                    rounded-full

                                    ${
                                      selected
                                        ? "bg-white"
                                        : "bg-[#6D5AB5]"
                                    }
                                  `}
                                />
                              )}
                            </TouchableOpacity>

                            {hasBookings &&
                              !selected &&
                              !isPast && (
                                <View
                                  className="
                                    mt-1
                                    w-1
                                    h-1
                                    rounded-full
                                  "
                                  style={{
                                    backgroundColor:
                                      full
                                        ? colors.danger
                                        : colors.peach,
                                  }}
                                />
                              )}
                          </View>
                        );
                      }
                    )}
                  </View>

                  {/* Legend */}

                  <View
                    className="
                      flex-row
                      items-center
                      gap-4
                      mt-4
                      pt-3
                      border-t
                      border-[#F0EAE6]
                    "
                  >
                    <LegendDot
                      color={
                        colors.purple
                      }
                      label="Selected"
                    />

                    <LegendDot
                      color={
                        colors.peach
                      }
                      label="Bookings"
                    />

                    <LegendDot
                      color={
                        colors.danger
                      }
                      label="Full"
                    />
                  </View>
                </View>

                {/* Selected date */}

                {selectedDay && (
                  <Animated.View
                    entering={FadeInDown.duration(
                      220
                    )}
                    className={`
                      flex-row
                      items-center
                      justify-between
                      rounded-[18px]
                      px-4
                      py-3
                      mb-5
                      border

                      ${
                        myExistingOnDate ||
                        isSelectedDayFull
                          ? "bg-[#FBE8E9] border-[#F3D2D5]"
                          : "bg-[#F2EEF9] border-[#E5DDEF]"
                      }
                    `}
                  >
                    <View className="flex-row items-center flex-1">
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color={
                          myExistingOnDate ||
                          isSelectedDayFull
                            ? colors.danger
                            : colors.purple
                        }
                      />

                      <Text
                        className={`
                          ml-2
                          text-[12px]
                          font-bold

                          ${
                            myExistingOnDate ||
                            isSelectedDayFull
                              ? "text-[#C45B65]"
                              : "text-[#6D5AB5]"
                          }
                        `}
                      >
                        {formatDisplayDate(
                          calYear,
                          calMonth,
                          selectedDay
                        )}
                      </Text>
                    </View>

                    {myExistingOnDate && (
                      <Text
                        className="
                          text-[10px]
                          font-bold
                          text-[#C45B65]
                        "
                      >
                        Already booked
                      </Text>
                    )}

                    {!myExistingOnDate &&
                      isSelectedDayFull && (
                        <Text
                          className="
                            text-[10px]
                            font-bold
                            text-[#C45B65]
                          "
                        >
                          Fully booked
                        </Text>
                      )}
                  </Animated.View>
                )}

                {/* ------------------------------------------------------ */}
                {/* TIME                                                   */}
                {/* ------------------------------------------------------ */}

                <SectionTitle
                  icon="time-outline"
                  title="Choose a time"
                  subtitle="Available 45-minute session slots"
                />

                <View className="gap-2.5 mb-6">
                  {TIME_SLOTS.map(
                    (time) => {
                      const selected =
                        selectedTime ===
                        time;

                      const currentSlotISO =
                        timeSlotToISO(
                          time
                        );

                      const taken =
                        selectedDaySchedule?.globalSlots.includes(
                          currentSlotISO
                        );

                      const disabled =
                        taken ||
                        !selectedDay ||
                        !!myExistingOnDate;

                      return (
                        <TouchableOpacity
                          key={
                            time
                          }
                          disabled={
                            disabled
                          }
                          activeOpacity={
                            0.8
                          }
                          onPress={() => {
                            Haptics
                              .selectionAsync()
                              .catch(
                                () =>
                                  {}
                              );

                            setSelectedTime(
                              time
                            );
                          }}
                          className={`
                            min-h-[54px]
                            px-4
                            rounded-[18px]
                            flex-row
                            items-center
                            justify-between
                            border

                            ${
                              selected
                                ? "bg-[#6D5AB5] border-[#6D5AB5]"
                                : taken
                                ? "bg-[#FBE8E9] border-[#F0D1D4]"
                                : "bg-white border-[#ECE6E2]"
                            }
                          `}
                          style={{
                            opacity:
                              disabled &&
                              !selected
                                ? 0.62
                                : 1,
                          }}
                        >
                          <View className="flex-row items-center">
                            <View
                              className={`
                                w-9
                                h-9
                                rounded-xl
                                items-center
                                justify-center
                                mr-3

                                ${
                                  selected
                                    ? "bg-white/15"
                                    : "bg-[#F2EEF9]"
                                }
                              `}
                            >
                              <Ionicons
                                name={
                                  time.includes(
                                    "AM"
                                  )
                                    ? "partly-sunny-outline"
                                    : "moon-outline"
                                }
                                size={
                                  17
                                }
                                color={
                                  selected
                                    ? "#FFFFFF"
                                    : colors.purple
                                }
                              />
                            </View>

                            <Text
                              className={`
                                text-[14px]
                                font-bold

                                ${
                                  selected
                                    ? "text-white"
                                    : taken
                                    ? "text-[#C45B65]"
                                    : "text-[#1F1F2E]"
                                }
                              `}
                            >
                              {
                                time
                              }
                            </Text>
                          </View>

                          <View
                            className={`
                              px-3
                              py-1.5
                              rounded-full

                              ${
                                selected
                                  ? "bg-white/15"
                                  : taken
                                  ? "bg-[#F4D6D8]"
                                  : "bg-[#F9F5F1]"
                              }
                            `}
                          >
                            <Text
                              className={`
                                text-[9.5px]
                                font-bold

                                ${
                                  selected
                                    ? "text-white"
                                    : taken
                                    ? "text-[#C45B65]"
                                    : "text-[#8C8992]"
                                }
                              `}
                            >
                              {selected
                                ? "Selected"
                                : taken
                                ? "Booked"
                                : "Available"}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>

                {/* ------------------------------------------------------ */}
                {/* SESSION TYPE                                           */}
                {/* ------------------------------------------------------ */}

                <SectionTitle
                  icon="options-outline"
                  title="Session type"
                  subtitle="Choose how you'd like to meet"
                />

                <View className="flex-row gap-3 mb-6">
                  {[
                    "online",
                    "physical",
                  ].map(
                    (type) => {
                      const selected =
                        sessionType ===
                        type;

                      return (
                        <TouchableOpacity
                          key={
                            type
                          }
                          activeOpacity={
                            0.8
                          }
                          onPress={() => {
                            Haptics
                              .selectionAsync()
                              .catch(
                                () =>
                                  {}
                              );

                            setSessionType(
                              type
                            );
                          }}
                          className={`
                            flex-1
                            min-h-[54px]
                            flex-row
                            items-center
                            justify-center
                            rounded-[18px]
                            border

                            ${
                              selected
                                ? "bg-[#6D5AB5] border-[#6D5AB5]"
                                : "bg-white border-[#ECE6E2]"
                            }
                          `}
                        >
                          <Ionicons
                            name={
                              type ===
                              "online"
                                ? "videocam-outline"
                                : "location-outline"
                            }
                            size={
                              16
                            }
                            color={
                              selected
                                ? "#FFFFFF"
                                : colors.purple
                            }
                          />

                          <Text
                            className={`
                              ml-2
                              text-[12px]
                              font-bold
                              capitalize

                              ${
                                selected
                                  ? "text-white"
                                  : "text-[#1F1F2E]"
                              }
                            `}
                          >
                            {
                              type
                            }
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>

                {/* ------------------------------------------------------ */}
                {/* NOTE                                                   */}
                {/* ------------------------------------------------------ */}

                <SectionTitle
                  icon="document-text-outline"
                  title="Anything you'd like to share?"
                  subtitle="Optional — this can help your counselor prepare"
                />

                <TextInput
                  value={note}
                  onChangeText={
                    setNote
                  }
                  placeholder="Briefly describe what you'd like to discuss..."
                  placeholderTextColor="#AAA4AE"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                  className="
                    min-h-[105px]
                    bg-white
                    border
                    border-[#ECE6E2]
                    rounded-[20px]
                    px-4
                    py-3.5
                    text-[13px]
                    leading-5
                    text-[#1F1F2E]
                  "
                />

                <Text
                  className="
                    text-right
                    mt-1.5
                    mb-6
                    text-[9.5px]
                    text-[#AAA4AE]
                  "
                >
                  {note.length}/500
                </Text>

                {/* ------------------------------------------------------ */}
                {/* SUMMARY                                                */}
                {/* ------------------------------------------------------ */}

                {selectedCounselor &&
                  selectedDay &&
                  selectedTime &&
                  !isSelectedTimeTaken &&
                  !myExistingOnDate && (
                    <Animated.View
                      entering={FadeInDown.duration(
                        220
                      )}
                      className="
                        bg-[#F2EEF9]
                        border
                        border-[#E4DCEF]
                        rounded-[22px]
                        p-4
                        mb-5
                      "
                    >
                      <View className="flex-row items-center mb-3">
                        <View
                          className="
                            w-8
                            h-8
                            rounded-xl
                            bg-white
                            items-center
                            justify-center
                            mr-2.5
                          "
                        >
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={
                              17
                            }
                            color={
                              colors.purple
                            }
                          />
                        </View>

                        <Text
                          className="
                            text-[13px]
                            font-extrabold
                            text-[#6D5AB5]
                          "
                        >
                          Booking
                          summary
                        </Text>
                      </View>

                      {[
                        [
                          "Counselor",
                          selectedCounselor.name,
                        ],
                        [
                          "Date",
                          formatDisplayDate(
                            calYear,
                            calMonth,
                            selectedDay
                          ),
                        ],
                        [
                          "Time",
                          selectedTime,
                        ],
                        [
                          "Type",
                          sessionType
                            .charAt(
                              0
                            )
                            .toUpperCase() +
                            sessionType.slice(
                              1
                            ),
                        ],
                        [
                          "Duration",
                          "45 minutes",
                        ],
                        [
                          "Student",
                          LOGGED_USER.name,
                        ],
                      ].map(
                        ([
                          label,
                          value,
                        ]) => (
                          <View
                            key={
                              label
                            }
                            className="
                              flex-row
                              justify-between
                              items-start
                              py-2
                              border-b
                              border-[#E5DEEE]
                            "
                          >
                            <Text
                              className="
                                text-[11px]
                                text-[#8C8992]
                              "
                            >
                              {
                                label
                              }
                            </Text>

                            <Text
                              numberOfLines={
                                2
                              }
                              className="
                                max-w-[60%]
                                text-right
                                text-[11px]
                                font-bold
                                text-[#1F1F2E]
                              "
                            >
                              {
                                value
                              }
                            </Text>
                          </View>
                        )
                      )}
                    </Animated.View>
                  )}

                {/* ------------------------------------------------------ */}
                {/* CONFIRM                                                */}
                {/* ------------------------------------------------------ */}

                <TouchableOpacity
                  disabled={
                    !canBook ||
                    bookLoading
                  }
                  activeOpacity={
                    0.85
                  }
                  onPress={
                    handleBook
                  }
                  className={`
                    min-h-[56px]
                    rounded-[19px]
                    flex-row
                    items-center
                    justify-center

                    ${
                      canBook &&
                      !bookLoading
                        ? "bg-[#6D5AB5]"
                        : "bg-[#C6C0C9]"
                    }
                  `}
                >
                  {bookLoading ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <Ionicons
                      name="calendar-outline"
                      size={17}
                      color="#FFFFFF"
                    />
                  )}

                  <Text
                    className="
                      ml-2
                      text-[14px]
                      font-extrabold
                      text-white
                    "
                  >
                    {bookLoading
                      ? "Requesting..."
                      : "Request Appointment"}
                  </Text>
                </TouchableOpacity>

                <Text
                  className="
                    mt-2
                    text-center
                    text-[9.5px]
                    leading-[14px]
                    text-[#8C8992]
                  "
                >
                  Your appointment
                  will remain pending
                  until the counselor
                  confirms it.
                </Text>
              </Animated.View>
            )}

            {/* ========================================================== */}
            {/* MY SESSIONS                                               */}
            {/* ========================================================== */}

            {activeView ===
              "booked" && (
              <Animated.View
                entering={FadeIn.duration(
                  200
                )}
              >
                <View className="mt-6">
                  <Text
                    className="
                      text-[11px]
                      tracking-[1px]
                      font-extrabold
                      text-[#6D5AB5]
                      uppercase
                    "
                  >
                    Your support
                  journey
                </Text>

                  <Text
                    className="
                      mt-1.5
                      text-[22px]
                      leading-7
                      font-extrabold
                      text-[#1F1F2E]
                    "
                  >
                    Your counseling
                    sessions
                  </Text>

                  <Text
                    className="
                      mt-1.5
                      text-[12px]
                      leading-[18px]
                      text-[#8C8992]
                    "
                  >
                    View upcoming
                    appointments and
                    revisit your
                    previous sessions.
                  </Text>
                </View>

                <BookedDetailsView
                  appointments={
                    myAppointments
                  }
                  counselors={
                    counselors
                  }
                />
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SECTION TITLE                                 */
/* -------------------------------------------------------------------------- */

function SectionTitle({
  icon,
  title,
  subtitle,
}) {
  return (
    <View className="flex-row items-start mb-2">
      <View
        className="
          w-7
          h-7
          rounded-lg
          bg-[#F2EEF9]
          items-center
          justify-center
          mr-2
        "
      >
        <Ionicons
          name={icon}
          size={14}
          color="#6D5AB5"
        />
      </View>

      <View className="flex-1">
        <Text
          className="
            text-[11px]
            font-extrabold
            text-[#1F1F2E]
          "
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            className="
              mt-0.5
              text-[9px]
              leading-[13px]
              text-[#8C8992]
            "
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                               LEGEND DOT                                   */
/* -------------------------------------------------------------------------- */

function LegendDot({
  color,
  label,
}) {
  return (
    <View className="flex-row items-center">
      <View
        className="
          w-2
          h-2
          rounded-full
          mr-1.5
        "
        style={{
          backgroundColor: color,
        }}
      />

      <Text
        className="
          text-[9px]
          text-[#8C8992]
        "
      >
        {label}
      </Text>
    </View>
  );
}