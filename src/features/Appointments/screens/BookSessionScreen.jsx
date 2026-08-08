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
  updateAppointmentStatus,
  hideAppointmentForStudent,
  fetchCurrentStressPercentage,
} from "../services/appointmentService";

import {
  getDaysInMonth,
  getFirstDayOfMonth,
  dateKey,
  formatDisplayDate,
  timeSlotToISO,
} from "../hooks/dateHelpers";

import {
  commonColors,
  spacing,
  studentColors,
  typography,
} from "@/src/theme";

dayjs.extend(utc);

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
          bg-app-primarySoft
          items-center
          justify-center
          mr-3
        "
      >
        <Ionicons
          name="calendar-outline"
          size={20}
          color={studentColors.primary}
        />
      </View>

      <View>
        <Text
          className="
            text-subtitle
            font-extrabold
            text-app-textPrimary
          "
        >
          Book a Session
        </Text>

        <Text
          className="
            text-caption
            mt-0.5
            text-app-textSecondary
          "
        >
          Find support at a time that works for you
        </Text>
      </View>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                            STRESS INSIGHT CARD                             */
/* -------------------------------------------------------------------------- */

const getStressInsight = (percentage) => {
  if (percentage <= 30) {
    return {
      label: "Low",
      message: "You seem to be managing well. Support can help you stay balanced.",
      color: studentColors.success,
      softColor: studentColors.successSoft,
    };
  }

  if (percentage <= 60) {
    return {
      label: "Moderate",
      message: "A conversation may help you unpack what has been weighing on you.",
      color: studentColors.warning,
      softColor: studentColors.warningSoft,
    };
  }

  return {
    label: "High",
    message: "Reaching out is a positive next step. Choose someone you feel safe with.",
    color: studentColors.error,
    softColor: studentColors.errorSoft,
  };
};

const StressInsightCard = ({ percentage, loading }) => {
  if (loading) {
    return (
      <View className="mb-5 min-h-[116px] items-center justify-center rounded-[22px] border border-app-border bg-app-surface">
        <ActivityIndicator color={studentColors.primary} />
        <Text className="mt-2 text-caption text-app-textSecondary">
          Checking your latest mood insight...
        </Text>
      </View>
    );
  }

  if (percentage === null) {
    return (
      <View
        accessible
        accessibilityLabel="No recent stress level is available"
        className="mb-5 flex-row items-center rounded-[22px] border border-app-border bg-app-surface p-4"
      >
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-app-primarySoft">
          <Ionicons name="pulse-outline" size={22} color={studentColors.primary} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-body font-extrabold text-app-textPrimary">
            Stress insight unavailable
          </Text>
          <Text className="mt-1 text-caption text-app-textSecondary">
            Complete a mood check-in to see your latest stress percentage here.
          </Text>
        </View>
      </View>
    );
  }

  const insight = getStressInsight(percentage);

  return (
    <Animated.View
      entering={FadeInDown.duration(260)}
      className="mb-5 overflow-hidden rounded-[22px] border border-app-border bg-app-surface p-4"
    >
      <View
        pointerEvents="none"
        className="absolute -right-8 -top-10 h-28 w-28 rounded-full"
        style={{ backgroundColor: insight.softColor }}
      />

      <View className="flex-row items-center">
        <View
          className="h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: insight.softColor }}
        >
          <Ionicons name="pulse" size={22} color={insight.color} />
        </View>

        <View className="ml-3 flex-1">
          <Text className="text-caption font-bold uppercase text-app-textSecondary">
            Current stress
          </Text>
          <View className="mt-0.5 flex-row items-center">
            <Text className="text-body font-extrabold text-app-textPrimary">
              {insight.label}
            </Text>
            <View
              className="ml-2 rounded-full px-2 py-0.5"
              style={{ backgroundColor: insight.softColor }}
            >
              <Text className="text-caption font-bold" style={{ color: insight.color }}>
                Latest check-in
              </Text>
            </View>
          </View>
        </View>

        <Text className="text-heading font-extrabold" style={{ color: insight.color }}>
          {percentage}%
        </Text>
      </View>

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: percentage }}
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-app-borderSoft"
      >
        <View
          className="h-full rounded-full"
          style={{ width: `${percentage}%`, backgroundColor: insight.color }}
        />
      </View>

      <Text className="mt-3 text-caption leading-5 text-app-textSecondary">
        {insight.message}
      </Text>
    </Animated.View>
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
        bg-app-surface
        border
        border-app-border
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
                  ? "bg-app-primary"
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
                    ? "bg-app-surface/15"
                    : "bg-app-primarySoft"
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
                    ? commonColors.white
                    : studentColors.primary
                }
              />
            </View>

            <Text
              numberOfLines={1}
              className={`
                text-caption
                font-bold

                ${
                  isActive
                    ? "text-app-surface"
                    : "text-app-textSecondary"
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
  isNext = false,
  onCancel,
  onRemove,
  actionLoading = false,
}) => {
  const appointmentTime = dayjs.utc(
    appointment.appointmentDateTime
  );

  const displayDate = appointmentTime.format(
    "MMM DD, YYYY"
  );

  const displayTime = appointmentTime.format(
    "hh:mm A"
  );

  const statusConfig = {
    confirmed: {
      bg: studentColors.successSoft,
      color: studentColors.success,
      label: "Confirmed",
    },

    pending: {
      bg: studentColors.accentSoft,
      color: studentColors.accent,
      label: "Pending",
    },

    cancelled: {
      bg: studentColors.errorSoft,
      color: studentColors.error,
      label: "Cancelled",
    },

    completed: {
      bg: studentColors.primarySoft,
      color: studentColors.primaryMuted,
      label: "Completed",
    },

    missed: {
      bg: studentColors.borderSoft,
      color: studentColors.textSecondary,
      label: "Missed",
    },
  };

  const status =
    statusConfig[appointment.status] ||
    statusConfig.pending;

  const isFuture = appointmentTime.isAfter(
    dayjs.utc()
  );

  const canCancel =
    isFuture &&
    ["pending", "confirmed"].includes(
      appointment.status
    );

  const canRemove =
    !isFuture ||
    ["cancelled", "completed", "missed"].includes(
      appointment.status
    );

  return (
    <Animated.View
      entering={FadeInDown
        .duration(260)
        .springify()}
      layout={Layout}
      className={`
        bg-app-surface
        rounded-[22px]
        overflow-hidden
        mb-3
        border

        ${
          isNext
            ? "border-app-primaryLight"
            : "border-app-border"
        }
      `}
      style={{
        opacity:
          isPast &&
          appointment.status !== "cancelled"
            ? 0.72
            : 1,
      }}
    >
      {isNext && (
        <View
          className="
            flex-row
            items-center
            px-4
            py-2.5
            bg-app-primarySoft
            border-b
            border-app-primaryLight
          "
        >
          <Ionicons
            name="sparkles-outline"
            size={13}
            color={studentColors.primary}
          />

          <Text
            className="
              ml-1.5
              text-caption
              font-extrabold
              uppercase
              text-app-primary
            "
            style={{
              letterSpacing: typography.letterSpacing.label,
            }}
          >
            Next session
          </Text>
        </View>
      )}

      <View className="p-4">
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
                studentColors.primarySoft,
            }}
          >
            <Text className="text-title">
              {counselor?.avatar || "🧑‍⚕️"}
            </Text>
          </View>

          <View className="flex-1">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-2">
                <Text
                  numberOfLines={1}
                  className="
                    text-body
                    font-extrabold
                    text-app-textPrimary
                  "
                >
                  {counselor?.name || "Counselor"}
                </Text>

                <Text
                  numberOfLines={2}
                  className="
                    mt-1
                    text-caption
                    text-app-textSecondary
                  "
                >
                  {counselor?.specialties?.join(
                    " · "
                  ) || "General Counseling"}
                </Text>
              </View>

              <View
                className="
                  px-2.5
                  py-1.5
                  rounded-full
                "
                style={{
                  backgroundColor: status.bg,
                }}
              >
                <Text
                  className="
                    text-caption
                    font-extrabold
                  "
                  style={{
                    color: status.color,
                  }}
                >
                  {status.label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View
          className="
            mt-4
            pt-3
            border-t
            border-app-borderSoft
          "
        >
          <View className="flex-row flex-wrap gap-x-4 gap-y-2">
            <View className="flex-row items-center">
              <Ionicons
                name="calendar-outline"
                size={14}
                color={studentColors.primary}
              />

              <Text
                className="
                  ml-1.5
                  text-caption
                  font-semibold
                  text-app-textPrimary
                "
              >
                {displayDate}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons
                name="time-outline"
                size={14}
                color={studentColors.primary}
              />

              <Text
                className="
                  ml-1.5
                  text-caption
                  font-semibold
                  text-app-textPrimary
                "
              >
                {displayTime}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons
                name={
                  appointment.type === "online"
                    ? "videocam-outline"
                    : "location-outline"
                }
                size={14}
                color={studentColors.primary}
              />

              <Text
                className="
                  ml-1.5
                  text-caption
                  font-semibold
                  capitalize
                  text-app-textPrimary
                "
              >
                {appointment.type}
              </Text>
            </View>
          </View>
        </View>

        {canCancel && (
          <TouchableOpacity
            activeOpacity={0.78}
            disabled={actionLoading}
            onPress={() => onCancel?.(appointment)}
            className="
              mt-4
              h-10
              rounded-[13px]
              bg-app-errorSoft
              border
              border-app-error/20
              flex-row
              items-center
              justify-center
            "
          >
            {actionLoading ? (
              <ActivityIndicator
                size="small"
                color={studentColors.error}
              />
            ) : (
              <>
                <Ionicons
                  name="close-circle-outline"
                  size={15}
                  color={studentColors.error}
                />

                <Text
                  className="
                    ml-1.5
                    text-caption
                    font-bold
                    text-app-error
                  "
                >
                  Cancel session
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {canRemove && (
          <TouchableOpacity
            activeOpacity={0.75}
            disabled={actionLoading}
            onPress={() => onRemove?.(appointment)}
            className="
              self-end
              mt-3
              flex-row
              items-center
              px-2
              py-1.5
            "
          >
            {actionLoading ? (
              <ActivityIndicator
                size="small"
                color={studentColors.textSecondary}
              />
            ) : (
              <>
                <Ionicons
                  name="trash-outline"
                  size={13}
                  color={studentColors.textSecondary}
                />

                <Text
                  className="
                    ml-1
                    text-caption
                    font-semibold
                    text-app-textSecondary
                  "
                >
                  Remove
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

/* -------------------------------------------------------------------------- */
/*                            BOOKED DETAILS                                  */
/* -------------------------------------------------------------------------- */

const SESSION_FILTERS = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "history", label: "History" },
];

const BookedDetailsView = ({
  appointments,
  counselors,
  onCancel,
  onRemove,
  actionId,
}) => {
  const [filter, setFilter] = useState("all");

  const now = dayjs.utc();

  const getCounselor = (counselorId) =>
    counselors.find(
      (counselor) =>
        counselor.id === counselorId
    );

  const sessionData = useMemo(() => {
    const visible = appointments.filter(
      (appointment) =>
        !appointment.hiddenByStudent
    );

    const upcoming = visible
      .filter((appointment) => {
        const future = dayjs
          .utc(appointment.appointmentDateTime)
          .isAfter(now);

        return (
          future &&
          ["pending", "confirmed"].includes(
            appointment.status
          )
        );
      })
      .sort((a, b) =>
        dayjs
          .utc(a.appointmentDateTime)
          .diff(
            dayjs.utc(
              b.appointmentDateTime
            )
          )
      );

    const history = visible
      .filter((appointment) => {
        const future = dayjs
          .utc(appointment.appointmentDateTime)
          .isAfter(now);

        return (
          !future ||
          [
            "cancelled",
            "completed",
            "missed",
          ].includes(appointment.status)
        );
      })
      .sort((a, b) =>
        dayjs
          .utc(b.appointmentDateTime)
          .diff(
            dayjs.utc(
              a.appointmentDateTime
            )
          )
      );

    return {
      visible,
      upcoming,
      nextSession: upcoming[0] || null,
      remainingUpcoming: upcoming.slice(1),
      history,
      pending: upcoming.filter(
        (appointment) =>
          appointment.status === "pending"
      ),
      confirmed: upcoming.filter(
        (appointment) =>
          appointment.status === "confirmed"
      ),
    };
  }, [appointments]);

  const renderCard = (
    appointment,
    options = {}
  ) => (
    <AppointmentCard
      key={appointment.appointmentId}
      appointment={appointment}
      counselor={getCounselor(
        appointment.counselorId
      )}
      isPast={
        !dayjs
          .utc(
            appointment.appointmentDateTime
          )
          .isAfter(now)
      }
      isNext={options.isNext}
      onCancel={onCancel}
      onRemove={onRemove}
      actionLoading={
        actionId ===
        appointment.appointmentId
      }
    />
  );

  const filteredList =
    filter === "pending"
      ? sessionData.pending
      : filter === "confirmed"
      ? sessionData.confirmed
      : filter === "history"
      ? sessionData.history
      : [];

  if (sessionData.visible.length === 0) {
    return (
      <View className="items-center justify-center py-16">
        <View
          className="
            w-[70px]
            h-[70px]
            rounded-[24px]
            bg-app-primarySoft
            items-center
            justify-center
            mb-4
          "
        >
          <Ionicons
            name="calendar-outline"
            size={28}
            color={studentColors.primary}
          />
        </View>

        <Text
          className="
            text-body
            font-extrabold
            text-app-textPrimary
          "
        >
          No sessions yet
        </Text>

        <Text
          className="
            text-caption
            mt-1.5
            text-center
            text-app-textSecondary
            max-w-[250px]
          "
        >
          When you&apos;re ready, choose a
          counselor and schedule your
          first session.
        </Text>
      </View>
    );
  }

  return (
    <View className="mt-5">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingRight: 10,
        }}
        className="mb-5"
      >
        {SESSION_FILTERS.map((item) => {
          const selected = filter === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.78}
              onPress={() => {
                Haptics
                  .selectionAsync()
                  .catch(() => {});

                setFilter(item.id);
              }}
              className={`
                px-3.5
                py-2
                mr-2
                rounded-full
                border

                ${
                  selected
                    ? "bg-app-primarySoft border-app-primaryLight"
                    : "bg-app-surface border-app-border"
                }
              `}
            >
              <Text
                className={`
                  text-caption
                  font-bold

                  ${
                    selected
                      ? "text-app-primary"
                      : "text-app-textSecondary"
                  }
                `}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {(filter === "all" ||
        filter === "upcoming") && (
        <>
          {sessionData.nextSession ? (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View
                  className="
                    w-8
                    h-8
                    rounded-xl
                    bg-app-primarySoft
                    items-center
                    justify-center
                    mr-2.5
                  "
                >
                  <Ionicons
                    name="sparkles-outline"
                    size={15}
                    color={studentColors.primary}
                  />
                </View>

                <View>
                  <Text
                    className="
                      text-body
                      font-extrabold
                      text-app-textPrimary
                    "
                  >
                    Next session
                  </Text>

                  <Text
                    className="
                      text-caption
                      text-app-textSecondary
                    "
                  >
                    Your nearest upcoming appointment
                  </Text>
                </View>
              </View>

              {renderCard(
                sessionData.nextSession,
                { isNext: true }
              )}
            </View>
          ) : (
            <View
              className="
                bg-app-surface
                border
                border-app-border
                rounded-[20px]
                py-6
                items-center
                mb-6
              "
            >
              <Ionicons
                name="calendar-clear-outline"
                size={22}
                color={studentColors.textMuted}
              />

              <Text
                className="
                  mt-2
                  text-caption
                  font-semibold
                  text-app-textSecondary
                "
              >
                No upcoming sessions
              </Text>
            </View>
          )}

          {sessionData.remainingUpcoming.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View
                  className="
                    w-8
                    h-8
                    rounded-xl
                    bg-app-primarySoft
                    items-center
                    justify-center
                    mr-2.5
                  "
                >
                  <Ionicons
                    name="calendar-outline"
                    size={15}
                    color={studentColors.primary}
                  />
                </View>

                <View>
                  <Text
                    className="
                      text-body
                      font-extrabold
                      text-app-textPrimary
                    "
                  >
                    Upcoming
                  </Text>

                  <Text
                    className="
                      text-caption
                      text-app-textSecondary
                    "
                  >
                    {sessionData.remainingUpcoming.length}{" "}
                    more scheduled
                  </Text>
                </View>
              </View>

              {sessionData.remainingUpcoming.map(
                (appointment) =>
                  renderCard(appointment)
              )}
            </View>
          )}

          {filter === "all" &&
            sessionData.history.length > 0 && (
              <View>
                <View className="flex-row items-center mb-3">
                  <View
                    className="
                      w-8
                      h-8
                      rounded-xl
                      bg-app-accentSoft
                      items-center
                      justify-center
                      mr-2.5
                    "
                  >
                    <Ionicons
                      name="time-outline"
                      size={15}
                      color={studentColors.accent}
                    />
                  </View>

                  <View>
                    <Text
                      className="
                        text-body
                        font-extrabold
                        text-app-textPrimary
                      "
                    >
                      History
                    </Text>

                    <Text
                      className="
                        text-caption
                        text-app-textSecondary
                      "
                    >
                      {sessionData.history.length}{" "}
                      previous or cancelled
                    </Text>
                  </View>
                </View>

                {sessionData.history.map(
                  (appointment) =>
                    renderCard(appointment)
                )}
              </View>
            )}
        </>
      )}

      {["pending", "confirmed", "history"].includes(
        filter
      ) && (
        <View>
          <View className="flex-row items-center justify-between mb-3">
            <Text
              className="
                text-body
                font-extrabold
                text-app-textPrimary
              "
            >
              {filter === "pending"
                ? "Pending requests"
                : filter === "confirmed"
                ? "Confirmed sessions"
                : "Session history"}
            </Text>

            <Text
              className="
                text-caption
                text-app-textSecondary
              "
            >
              {filteredList.length}
            </Text>
          </View>

          {filteredList.length > 0 ? (
            filteredList.map((appointment) =>
              renderCard(appointment)
            )
          ) : (
            <View
              className="
                bg-app-surface
                border
                border-app-border
                rounded-[20px]
                py-7
                items-center
              "
            >
              <Ionicons
                name="filter-outline"
                size={22}
                color={studentColors.textMuted}
              />

              <Text
                className="
                  mt-2
                  text-caption
                  font-semibold
                  text-app-textSecondary
                "
              >
                No sessions in this filter
              </Text>
            </View>
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
    sessionActionId,
    setSessionActionId,
  ] = useState(null);

  const [
    activeView,
    setActiveView,
  ] = useState("book");

  const [
    stressPercentage,
    setStressPercentage,
  ] = useState(null);

  const [
    stressLoading,
    setStressLoading,
  ] = useState(true);

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
      fetchCurrentStressPercentage(
        user.id
      )
        .then(
          setStressPercentage
        )
        .catch((error) => {
          console.error(
            "Could not load stress insight:",
            error
          );
          setStressPercentage(null);
        })
        .finally(() =>
          setStressLoading(false)
        );

      fetchAppointments(
        user.id
      ).then((data) => {
        setAppointments(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
      setStressLoading(false);
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
          // Cancelled sessions must not keep a date/time blocked.
          if (appointment.status === "cancelled") {
            return;
          }

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
              LOGGED_USER.id &&
            !appointment.hiddenByStudent
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
  /*                         SESSION ACTIONS                                  */
  /* ------------------------------------------------------------------------ */

  const handleCancelAppointment = (appointment) => {
    const counselor = counselors.find(
      (item) =>
        item.id === appointment.counselorId
    );

    const counselorName =
      counselor?.name || "your counselor";

    Alert.alert(
      "Cancel session",
      `Cancel your session with ${counselorName}?`,
      [
        {
          text: "Keep session",
          style: "cancel",
        },
        {
          text: "Cancel session",
          style: "destructive",
          onPress: async () => {
            try {
              setSessionActionId(
                appointment.appointmentId
              );

              await updateAppointmentStatus(
                appointment.appointmentId,
                "cancelled"
              );

              setAppointments((previous) =>
                previous.map((item) =>
                  item.appointmentId ===
                  appointment.appointmentId
                    ? {
                        ...item,
                        status: "cancelled",
                        updatedAt:
                          new Date().toISOString(),
                      }
                    : item
                )
              );

              Haptics
                .notificationAsync(
                  Haptics
                    .NotificationFeedbackType
                    .Success
                )
                .catch(() => {});
            } catch (error) {
              console.error(
                "Cancel appointment error:",
                error
              );

              Alert.alert(
                "Could not cancel",
                "Please try again."
              );
            } finally {
              setSessionActionId(null);
            }
          },
        },
      ]
    );
  };

  const handleRemoveAppointment = (appointment) => {
    Alert.alert(
      "Remove session",
      "Remove this session from My Sessions? This only hides it from your list and does not erase the counselor record.",
      [
        {
          text: "Keep",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setSessionActionId(
                appointment.appointmentId
              );

              await hideAppointmentForStudent(
                appointment.appointmentId
              );

              setAppointments((previous) =>
                previous.map((item) =>
                  item.appointmentId ===
                  appointment.appointmentId
                    ? {
                        ...item,
                        hiddenByStudent: true,
                      }
                    : item
                )
              );

              Haptics
                .selectionAsync()
                .catch(() => {});
            } catch (error) {
              console.error(
                "Remove appointment error:",
                error
              );

              Alert.alert(
                "Could not remove",
                "Please try again."
              );
            } finally {
              setSessionActionId(null);
            }
          },
        },
      ]
    );
  };

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
                studentColors.background,
            },

            headerTintColor:
              studentColors.primary,

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
            bg-app-background
            items-center
            justify-center
          "
        >
          <View
            className="
              w-[72px]
              h-[72px]
              rounded-[24px]
              bg-app-primarySoft
              items-center
              justify-center
              mb-4
            "
          >
            <ActivityIndicator
              size="small"
              color={
                studentColors.primary
              }
            />
          </View>

          <Text
            className="
              text-body
              font-bold
              text-app-textPrimary
            "
          >
            Finding available
            counselors…
          </Text>

          <Text
            className="
              mt-1.5
              text-caption
              text-app-textSecondary
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
              studentColors.background,
          },

          headerTintColor:
            studentColors.primary,

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
          bg-app-background
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
            contentContainerStyle={{
              paddingHorizontal: spacing.screen,
            }}
            contentContainerClassName="
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
                      text-caption
                      font-extrabold
                      text-app-primary
                      uppercase
                    "
                    style={{
                      letterSpacing: typography.letterSpacing.wide,
                    }}
                  >
                    Personal support
                  </Text>

                  <Text
                    className="
                      mt-1.5
                      text-body-lg
                      font-extrabold
                      text-app-textPrimary
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
                      text-caption
                      text-app-textSecondary
                    "
                  >
                    Select a counselor,
                    choose a suitable
                    date and time, and
                    request your
                    session.
                  </Text>
                </View>

                <StressInsightCard
                  percentage={
                    stressPercentage
                  }
                  loading={
                    stressLoading
                  }
                />

                {/* Success */}

                {bookingSuccess && (
                  <Animated.View
                    entering={FadeInDown.duration(
                      250
                    )}
                    className="
                      flex-row
                      items-center
                      bg-app-successSoft
                      border
                      border-app-success/20
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
                        bg-app-surface
                        items-center
                        justify-center
                        mr-3
                      "
                    >
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={
                          studentColors.success
                        }
                      />
                    </View>

                    <View className="flex-1">
                      <Text
                        className="
                          text-caption
                          font-bold
                          text-app-success
                        "
                      >
                        Appointment
                        requested
                      </Text>

                      <Text
                        className="
                          mt-0.5
                          text-caption
                          text-app-success
                        "
                      >
                        We&apos;ll let you
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
                    bg-app-surface
                    rounded-2xl
                    border
                    border-app-border
                  "
                >
                  <Ionicons
                    name="search-outline"
                    size={17}
                    color={
                      studentColors.textSecondary
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
                    placeholderTextColor={studentColors.textMuted}
                    className="
                      flex-1
                      ml-2.5
                      p-0
                      text-body-sm
                      text-app-textPrimary
                    "
                  />

                  {searchQuery !==
                    "" && (
                    <TouchableOpacity
                      accessibilityLabel="Clear counselor search"
                      onPress={() =>
                        setSearchQuery(
                          ""
                        )
                      }
                    >
                      <Ionicons
                        name="close-circle"
                        size={17}
                        color={studentColors.textMuted}
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
                          bg-app-primarySoft
                          items-center
                          justify-center
                          mb-3
                        "
                      >
                        <Ionicons
                          name="search-outline"
                          size={21}
                          color={
                            studentColors.primary
                          }
                        />
                      </View>

                      <Text
                        className="
                          text-caption
                          font-semibold
                          text-app-textSecondary
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
                                  ? "bg-app-primarySoft border-app-primary"
                                  : "bg-app-surface border-app-border"
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
                                  studentColors.primarySoft,
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
                                  text-body
                                  font-extrabold

                                  ${
                                    chosen
                                      ? "text-app-primary"
                                      : "text-app-textPrimary"
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
                                  text-caption
                                  text-app-textSecondary
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
                                    bg-app-surface
                                    rounded-full
                                  "
                                >
                                  <Text
                                    className="
                                      text-caption
                                      font-bold
                                      text-app-primary
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
                                    ? "bg-app-primary"
                                    : "bg-app-background"
                                }
                              `}
                            >
                              <Text
                                className={`
                                  text-caption
                                  font-bold

                                  ${
                                    chosen
                                      ? "text-app-surface"
                                      : "text-app-textSecondary"
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
                        bg-app-primarySoft
                      "
                    >
                      <Text
                        className="
                          text-caption
                          font-bold
                          text-app-primary
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
                        bg-app-primarySoft
                        rounded-[20px]
                        p-4
                        mb-5
                        border
                        border-app-primaryLight
                      "
                    >
                      <Text
                        className="
                          text-caption
                          font-bold
                          text-app-primary
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
                                bg-app-surface
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
                                    studentColors.primary
                                  }
                                />

                                <Text
                                  className="
                                    ml-1.5
                                    flex-1
                                    text-caption
                                    text-app-textPrimary
                                  "
                                >
                                  {
                                    displayDate
                                  }
                                </Text>

                                <Text
                                  className="
                                    text-caption
                                    font-bold
                                    capitalize
                                    text-app-textSecondary
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
                    bg-app-surface
                    rounded-[26px]
                    p-4
                    mb-5
                    border
                    border-app-border
                    shadow-sm
                  "
                >
                  {/* Month */}

                  <View className="flex-row items-center justify-between mb-4">
                    <TouchableOpacity
                      accessibilityLabel="Previous month"
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
                        bg-app-primarySoft
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
                          studentColors.primary
                        }
                      />
                    </TouchableOpacity>

                    <Text
                      className="
                        text-body-lg
                        font-extrabold
                        text-app-textPrimary
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
                      accessibilityLabel="Next month"
                      onPress={
                        nextMonth
                      }
                      className="
                        w-10
                        h-10
                        rounded-2xl
                        bg-app-primarySoft
                        items-center
                        justify-center
                      "
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={
                          studentColors.primary
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
                            text-caption
                            font-extrabold
                            text-app-textMuted
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
                                    ? "bg-app-primary"
                                    : isToday
                                    ? "bg-app-primarySoft"
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
                                  studentColors.primary,
                              }}
                            >
                              <Text
                                className={`
                                  text-body

                                  ${
                                    selected ||
                                    isToday
                                      ? "font-extrabold"
                                      : "font-medium"
                                  }

                                  ${
                                    selected
                                      ? "text-app-surface"
                                      : full
                                      ? "text-app-error"
                                      : isToday
                                      ? "text-app-primary"
                                      : "text-app-textPrimary"
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
                                        ? "bg-app-surface"
                                        : "bg-app-primary"
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
                                        ? studentColors.error
                                        : studentColors.accent,
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
                      border-app-borderSoft
                    "
                  >
                    <LegendDot
                      color={
                        studentColors.primary
                      }
                      label="Selected"
                    />

                    <LegendDot
                      color={
                        studentColors.accent
                      }
                      label="Bookings"
                    />

                    <LegendDot
                      color={
                        studentColors.error
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
                          ? "bg-app-errorSoft border-app-error/20"
                          : "bg-app-primarySoft border-app-primaryLight"
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
                            ? studentColors.error
                            : studentColors.primary
                        }
                      />

                      <Text
                        className={`
                          ml-2
                          text-caption
                          font-bold

                          ${
                            myExistingOnDate ||
                            isSelectedDayFull
                              ? "text-app-error"
                              : "text-app-primary"
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
                          text-caption
                          font-bold
                          text-app-error
                        "
                      >
                        Already booked
                      </Text>
                    )}

                    {!myExistingOnDate &&
                      isSelectedDayFull && (
                        <Text
                          className="
                            text-caption
                            font-bold
                            text-app-error
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
                                ? "bg-app-primary border-app-primary"
                                : taken
                                ? "bg-app-errorSoft border-app-error/20"
                                : "bg-app-surface border-app-border"
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
                                    ? "bg-app-surface/15"
                                    : "bg-app-primarySoft"
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
                                    ? commonColors.white
                                    : studentColors.primary
                                }
                              />
                            </View>

                            <Text
                              className={`
                                text-body
                                font-bold

                                ${
                                  selected
                                    ? "text-app-surface"
                                    : taken
                                    ? "text-app-error"
                                    : "text-app-textPrimary"
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
                                  ? "bg-app-surface/15"
                                  : taken
                                  ? "bg-app-errorSoft"
                                  : "bg-app-background"
                              }
                            `}
                          >
                            <Text
                              className={`
                                text-caption
                                font-bold

                                ${
                                  selected
                                    ? "text-app-surface"
                                    : taken
                                    ? "text-app-error"
                                    : "text-app-textSecondary"
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
                                ? "bg-app-primary border-app-primary"
                                : "bg-app-surface border-app-border"
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
                                ? commonColors.white
                                : studentColors.primary
                            }
                          />

                          <Text
                            className={`
                              ml-2
                              text-caption
                              font-bold
                              capitalize

                              ${
                                selected
                                ? "text-app-surface"
                                : "text-app-textPrimary"
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
                  placeholderTextColor={studentColors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                  className="
                    min-h-[105px]
                    bg-app-surface
                    border
                    border-app-border
                    rounded-[20px]
                    px-4
                    py-3.5
                    text-body-sm
                    text-app-textPrimary
                  "
                />

                <Text
                  className="
                    text-right
                    mt-1.5
                    mb-6
                    text-caption
                    text-app-textMuted
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
                        bg-app-primarySoft
                        border
                        border-app-primaryLight
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
                            bg-app-surface
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
                              studentColors.primary
                            }
                          />
                        </View>

                        <Text
                          className="
                            text-body-sm
                            font-extrabold
                            text-app-primary
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
                              border-app-primaryLight
                            "
                          >
                            <Text
                              className="
                                text-caption
                                text-app-textSecondary
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
                                text-caption
                                font-bold
                                text-app-textPrimary
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
                        ? "bg-app-primary"
                        : "bg-app-textMuted"
                    }
                  `}
                >
                  {bookLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={commonColors.white}
                    />
                  ) : (
                    <Ionicons
                      name="calendar-outline"
                      size={17}
                      color={commonColors.white}
                    />
                  )}

                  <Text
                    className="
                      ml-2
                      text-body
                      font-extrabold
                      text-app-surface
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
                    text-caption
                    text-app-textSecondary
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
                      text-caption
                      font-extrabold
                      text-app-primary
                      uppercase
                    "
                    style={{
                      letterSpacing: typography.letterSpacing.wide,
                    }}
                  >
                    Your support
                  journey
                </Text>

                  <Text
                    className="
                      mt-1.5
                      text-title
                      font-extrabold
                      text-app-textPrimary
                    "
                  >
                    Your counseling
                    sessions
                  </Text>

                  <Text
                    className="
                      mt-1.5
                      text-caption
                      text-app-textSecondary
                    "
                  >
                    See your next session,
                    manage upcoming bookings,
                    and review your history.
                  </Text>
                </View>

                <BookedDetailsView
                  appointments={
                    myAppointments
                  }
                  counselors={
                    counselors
                  }
                  onCancel={
                    handleCancelAppointment
                  }
                  onRemove={
                    handleRemoveAppointment
                  }
                  actionId={
                    sessionActionId
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
          bg-app-primarySoft
          items-center
          justify-center
          mr-2
        "
      >
        <Ionicons
          name={icon}
          size={14}
          color={studentColors.primary}
        />
      </View>

      <View className="flex-1">
        <Text
          className="
            text-caption
            font-extrabold
            text-app-textPrimary
          "
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            className="
              mt-0.5
              text-caption
              text-app-textSecondary
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
          text-caption
          text-app-textSecondary
        "
      >
        {label}
      </Text>
    </View>
  );
}
