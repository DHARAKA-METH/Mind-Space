import React, {
  useState,
  useEffect,
  useLayoutEffect,
} from "react";

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import * as Haptics from "expo-haptics";

import Animated, {
  FadeInDown,
  FadeIn,
} from "react-native-reanimated";

import {
  getAuth,
  signOut,
} from "firebase/auth";

import {
  useNavigation,
  router,
} from "expo-router";

import AppointmentsScreen from "./screens/AppointmentsScreen";
import ChatScreen from "./screens/ChatScreen";

import {
  fetchCounselorName,
  fetchTodayAppointments,
  fetchStressAlerts,
  fetchActiveChatsCount,
  TodayAppointment,
  StressAlert,
} from "./services/dashboardService";

import {
  findConversationByStudent,
} from "./services/counselorService";

/* -------------------------------------------------------------------------- */
/*                             COUNSELOR PALETTE                              */
/* -------------------------------------------------------------------------- */

const COLORS = {
  background: "#F5F7F6",

  teal: "#4F7C78",
  tealDark: "#3F6864",

  tealSoft: "#E7F0EE",
  tealVerySoft: "#F1F6F5",

  amber: "#D79A5B",
  amberSoft: "#FAEEE2",

  blue: "#64869B",
  blueSoft: "#E8F0F4",

  text: "#25312F",
  secondaryText: "#71807C",
  lightText: "#9BA6A3",

  white: "#FFFFFF",
  border: "#E2E9E6",

  danger: "#B85C62",
  dangerSoft: "#F8E8E9",

  success: "#56836C",
  successSoft: "#E5F0E9",
};

/* -------------------------------------------------------------------------- */
/*                               SCREEN TYPES                                 */
/* -------------------------------------------------------------------------- */

type ScreenState =
  | "board"
  | "chats"
  | "appointments";

const HEADER_TITLES: Record<
  ScreenState,
  string
> = {
  board: "Counselor Dashboard",
  chats: "Student Chats",
  appointments: "Appointments",
};

/* -------------------------------------------------------------------------- */
/*                              STATUS COLORS                                 */
/* -------------------------------------------------------------------------- */

const STATUS_COLORS: Record<
  string,
  {
    color: string;
    bg: string;
  }
> = {
  confirmed: {
    color: COLORS.success,
    bg: COLORS.successSoft,
  },

  pending: {
    color: COLORS.amber,
    bg: COLORS.amberSoft,
  },

  cancelled: {
    color: COLORS.danger,
    bg: COLORS.dangerSoft,
  },

  completed: {
    color: COLORS.blue,
    bg: COLORS.blueSoft,
  },

  missed: {
    color: COLORS.secondaryText,
    bg: "#EEF1F0",
  },
};

/* -------------------------------------------------------------------------- */
/*                             HEADER ACTIONS                                 */
/* -------------------------------------------------------------------------- */

const HeaderActions = ({
  notificationCount,
  onNotificationPress,
  onProfilePress,
}: {
  notificationCount: number;

  onNotificationPress: () => void;

  onProfilePress: () => void;
}) => {
  return (
    <View
      className="
        flex-row
        items-center
        mr-2
      "
    >
      {/* ============================================================ */}
      {/* NOTIFICATIONS                                                */}
      {/* ============================================================ */}

      <TouchableOpacity
        activeOpacity={0.72}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        onPress={() => {
          Haptics
            .selectionAsync()
            .catch(() => {});

          onNotificationPress();
        }}
        className="
          w-10
          h-10
          rounded-[14px]
          bg-white
          border
          border-[#E2E9E6]
          items-center
          justify-center
          mr-2
        "
      >
        <Ionicons
          name="notifications-outline"
          size={19}
          color={COLORS.teal}
        />

        {notificationCount > 0 && (
          <View
            className="
              absolute
              -right-1
              -top-1
              min-w-[17px]
              h-[17px]
              px-1
              rounded-full
              bg-[#B85C62]
              border-2
              border-[#F5F7F6]
              items-center
              justify-center
            "
          >
            <Text
              className="
                text-[7.5px]
                font-extrabold
                text-white
              "
            >
              {notificationCount > 9
                ? "9+"
                : notificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* ============================================================ */}
      {/* PROFILE                                                      */}
      {/* ============================================================ */}

      <TouchableOpacity
        activeOpacity={0.72}
        accessibilityRole="button"
        accessibilityLabel="Profile menu"
        onPress={() => {
          Haptics
            .selectionAsync()
            .catch(() => {});

          onProfilePress();
        }}
        className="
          w-10
          h-10
          rounded-[14px]
          bg-[#E7F0EE]
          border
          border-[#D6E5E2]
          items-center
          justify-center
        "
      >
        <Ionicons
          name="person-outline"
          size={19}
          color={COLORS.tealDark}
        />
      </TouchableOpacity>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                             PROFILE POPUP                                  */
/* -------------------------------------------------------------------------- */

const ProfilePopup = ({
  visible,
  onClose,
  counselorName,
  email,
  onLogout,
}: {
  visible: boolean;

  onClose: () => void;

  counselorName: string;

  email: string;

  onLogout: () => void;
}) => {
  const initial =
    counselorName?.trim()?.[0]
      ?.toUpperCase() || "C";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* close overlay */}

      <Pressable
        onPress={onClose}
        className="
          flex-1
          bg-black/15
        "
      >
        {/* popup */}

        <Pressable
          onPress={() => {}}
          className="
            absolute
            top-[76px]
            right-4
            w-[270px]
            bg-white
            rounded-[24px]
            border
            border-[#E2E9E6]
            overflow-hidden
          "
          style={{
            shadowColor: "#25312F",

            shadowOpacity: 0.12,

            shadowRadius: 18,

            shadowOffset: {
              width: 0,
              height: 6,
            },

            elevation: 10,
          }}
        >
          {/* ======================================================== */}
          {/* USER INFO                                                */}
          {/* ======================================================== */}

          <View
            className="
              p-4
              bg-[#F1F6F5]
              border-b
              border-[#E2E9E6]
            "
          >
            <View className="flex-row items-center">
              <View
                className="
                  w-12
                  h-12
                  rounded-[17px]
                  bg-[#4F7C78]
                  items-center
                  justify-center
                "
              >
                <Text
                  className="
                    text-[18px]
                    font-extrabold
                    text-white
                  "
                >
                  {initial}
                </Text>
              </View>

              <View className="flex-1 ml-3">
                <Text
                  numberOfLines={1}
                  className="
                    text-[13px]
                    font-extrabold
                    text-[#25312F]
                  "
                >
                  {counselorName ||
                    "Counselor"}
                </Text>

                <Text
                  numberOfLines={1}
                  className="
                    text-[9.5px]
                    text-[#71807C]
                    mt-0.5
                  "
                >
                  {email ||
                    "Counselor account"}
                </Text>

                <View
                  className="
                    self-start
                    mt-1.5
                    px-2
                    py-1
                    rounded-full
                    bg-[#E7F0EE]
                  "
                >
                  <Text
                    className="
                      text-[8px]
                      font-bold
                      text-[#4F7C78]
                    "
                  >
                    COUNSELOR
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ======================================================== */}
          {/* MENU                                                     */}
          {/* ======================================================== */}

          <View className="p-2">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onLogout}
              className="
                flex-row
                items-center
                min-h-[48px]
                px-3
                rounded-[16px]
              "
            >
              <View
                className="
                  w-9
                  h-9
                  rounded-[13px]
                  bg-[#F8E8E9]
                  items-center
                  justify-center
                "
              >
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color={COLORS.danger}
                />
              </View>

              <View className="flex-1 ml-3">
                <Text
                  className="
                    text-[12px]
                    font-bold
                    text-[#B85C62]
                  "
                >
                  Log out
                </Text>

                <Text
                  className="
                    text-[9px]
                    text-[#9BA6A3]
                    mt-0.5
                  "
                >
                  Sign out of your
                  counselor account
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={15}
                color={COLORS.lightText}
              />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/*                           NOTIFICATION POPUP                               */
/* -------------------------------------------------------------------------- */

const NotificationPopup = ({
  visible,
  onClose,
  count,
  onViewAlerts,
}: {
  visible: boolean;

  onClose: () => void;

  count: number;

  onViewAlerts: () => void;
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="
          flex-1
          bg-black/15
        "
      >
        <Pressable
          onPress={() => {}}
          className="
            absolute
            top-[76px]
            right-[58px]
            w-[275px]
            bg-white
            rounded-[24px]
            border
            border-[#E2E9E6]
            overflow-hidden
          "
          style={{
            shadowColor: "#25312F",

            shadowOpacity: 0.12,

            shadowRadius: 18,

            shadowOffset: {
              width: 0,
              height: 6,
            },

            elevation: 10,
          }}
        >
          {/* header */}

          <View
            className="
              flex-row
              items-center
              justify-between
              p-4
              border-b
              border-[#E2E9E6]
            "
          >
            <View className="flex-row items-center">
              <View
                className="
                  w-9
                  h-9
                  rounded-[13px]
                  bg-[#E7F0EE]
                  items-center
                  justify-center
                  mr-2.5
                "
              >
                <Ionicons
                  name="notifications-outline"
                  size={17}
                  color={COLORS.teal}
                />
              </View>

              <View>
                <Text
                  className="
                    text-[13px]
                    font-extrabold
                    text-[#25312F]
                  "
                >
                  Notifications
                </Text>

                <Text
                  className="
                    text-[9px]
                    text-[#71807C]
                  "
                >
                  Counselor attention
                  center
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              className="
                w-8
                h-8
                rounded-full
                bg-[#F1F6F5]
                items-center
                justify-center
              "
            >
              <Ionicons
                name="close"
                size={15}
                color={COLORS.secondaryText}
              />
            </TouchableOpacity>
          </View>

          {/* body */}

          <View className="p-4">
            {count > 0 ? (
              <>
                <View
                  className="
                    flex-row
                    items-center
                    p-3.5
                    rounded-[18px]
                    bg-[#F8E8E9]
                    border
                    border-[#F0D0D3]
                  "
                >
                  <View
                    className="
                      w-10
                      h-10
                      rounded-[14px]
                      bg-white
                      items-center
                      justify-center
                    "
                  >
                    <Ionicons
                      name="warning-outline"
                      size={18}
                      color={COLORS.danger}
                    />
                  </View>

                  <View className="flex-1 ml-3">
                    <Text
                      className="
                        text-[11px]
                        font-extrabold
                        text-[#B85C62]
                      "
                    >
                      {count} stress{" "}
                      {count === 1
                        ? "alert"
                        : "alerts"}
                    </Text>

                    <Text
                      className="
                        text-[9.5px]
                        leading-[14px]
                        text-[#8E6568]
                        mt-0.5
                      "
                    >
                      Some students may
                      need your attention.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onViewAlerts}
                  className="
                    h-11
                    mt-3
                    rounded-[15px]
                    bg-[#4F7C78]
                    flex-row
                    items-center
                    justify-center
                  "
                >
                  <Text
                    className="
                      text-[11px]
                      font-bold
                      text-white
                    "
                  >
                    View stress alerts
                  </Text>

                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color="#FFFFFF"
                    style={{
                      marginLeft: 4,
                    }}
                  />
                </TouchableOpacity>
              </>
            ) : (
              <View className="items-center py-5">
                <View
                  className="
                    w-12
                    h-12
                    rounded-[17px]
                    bg-[#E5F0E9]
                    items-center
                    justify-center
                    mb-3
                  "
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={22}
                    color={COLORS.success}
                  />
                </View>

                <Text
                  className="
                    text-[12px]
                    font-bold
                    text-[#25312F]
                  "
                >
                  You're all caught up
                </Text>

                <Text
                  className="
                    text-[9.5px]
                    text-[#71807C]
                    text-center
                    mt-1
                  "
                >
                  There are no current
                  stress alerts.
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  STAT CARD                                 */
/* -------------------------------------------------------------------------- */

const StatCard = ({
  label,
  value,
  icon,
  color,
  bg,
  delay,
}: any) => {
  return (
    <Animated.View
      entering={FadeInDown
        .delay(delay)
        .duration(280)}
      className="
        flex-1
        rounded-[24px]
        p-4
        border
        border-[#E2E9E6]
      "
      style={{
        backgroundColor: bg,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View
          className="
            w-9
            h-9
            rounded-[13px]
            bg-white
            items-center
            justify-center
          "
        >
          <Ionicons
            name={icon}
            size={17}
            color={color}
          />
        </View>

        <Ionicons
          name="trending-up-outline"
          size={14}
          color={color}
        />
      </View>

      <Text
        className="
          text-[30px]
          font-extrabold
          mt-3
        "
        style={{
          color,
        }}
      >
        {value}
      </Text>

      <Text
        className="
          text-[10px]
          font-bold
          tracking-[0.7px]
          uppercase
          mt-1
        "
        style={{
          color,
        }}
      >
        {label}
      </Text>
    </Animated.View>
  );
};

/* -------------------------------------------------------------------------- */
/*                              STATUS BADGE                                  */
/* -------------------------------------------------------------------------- */

const StatusBadge = ({
  status,
}: {
  status: string;
}) => {
  const style =
    STATUS_COLORS[status] ||
    STATUS_COLORS.missed;

  return (
    <View
      className="
        px-2.5
        py-1
        rounded-full
      "
      style={{
        backgroundColor:
          style.bg,
      }}
    >
      <Text
        className="
          text-[9px]
          font-bold
          capitalize
        "
        style={{
          color:
            style.color,
        }}
      >
        {status}
      </Text>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                             STRESS ALERT ROW                               */
/* -------------------------------------------------------------------------- */

const StressAlertRow = ({
  alert,
  delay,
  onPress,
}: any) => {
  const isHigh =
    alert.urgency === "high";

  return (
    <Animated.View
      entering={FadeInDown
        .delay(delay)
        .duration(280)}
    >
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onPress}
        className={`
          flex-row
          items-center
          rounded-[20px]
          p-3.5
          mb-2.5
          border

          ${
            isHigh
              ? "bg-[#F8E8E9] border-[#F0D0D3]"
              : "bg-white border-[#E2E9E6]"
          }
        `}
      >
        <View
          className={`
            w-11
            h-11
            rounded-[15px]
            items-center
            justify-center

            ${
              isHigh
                ? "bg-white"
                : "bg-[#FAEEE2]"
            }
          `}
        >
          <Text className="text-[20px]">
            {alert.emoji}
          </Text>
        </View>

        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text
              numberOfLines={1}
              className={`
                flex-1
                text-[13px]
                font-extrabold

                ${
                  isHigh
                    ? "text-[#B85C62]"
                    : "text-[#25312F]"
                }
              `}
            >
              {alert.studentName}
            </Text>

            {isHigh && (
              <View
                className="
                  bg-white
                  px-2
                  py-1
                  rounded-full
                "
              >
                <Text
                  className="
                    text-[8.5px]
                    font-extrabold
                    text-[#B85C62]
                  "
                >
                  HIGH
                </Text>
              </View>
            )}
          </View>

          <Text
            numberOfLines={2}
            className="
              text-[11px]
              leading-4
              mt-1
              text-[#71807C]
            "
          >
            {alert.detail}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={16}
          color={COLORS.lightText}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

/* -------------------------------------------------------------------------- */
/*                          APPOINTMENT ROW                                   */
/* -------------------------------------------------------------------------- */

const AppointmentRow = ({
  appt,
  delay,
}: any) => {
  return (
    <Animated.View
      entering={FadeInDown
        .delay(delay)
        .duration(280)}
    >
      <View
        className="
          flex-row
          items-center
          bg-white
          border
          border-[#E2E9E6]
          rounded-[20px]
          p-3.5
          mb-2.5
        "
      >
        <View
          className="
            w-11
            h-11
            rounded-[15px]
            bg-[#FAEEE2]
            items-center
            justify-center
          "
        >
          <Ionicons
            name="time-outline"
            size={19}
            color={COLORS.amber}
          />
        </View>

        <View className="flex-1 ml-3">
          <View className="flex-row items-center flex-wrap">
            <Text
              className="
                text-[13px]
                font-extrabold
                text-[#25312F]
                mr-2
              "
            >
              {appt.time}
            </Text>

            <StatusBadge
              status={appt.status}
            />
          </View>

          <Text
            numberOfLines={1}
            className="
              text-[11.5px]
              font-semibold
              text-[#25312F]
              mt-1
            "
          >
            {appt.studentName}
          </Text>

          <View className="flex-row items-center mt-1">
            <Ionicons
              name={
                appt.type === "Online"
                  ? "videocam-outline"
                  : "location-outline"
              }
              size={12}
              color={
                COLORS.secondaryText
              }
            />

            <Text
              className="
                ml-1
                text-[10px]
                text-[#71807C]
              "
            >
              {appt.type}
            </Text>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={16}
          color={COLORS.lightText}
        />
      </View>
    </Animated.View>
  );
};

/* -------------------------------------------------------------------------- */
/*                            COUNSELOR BOARD                                 */
/* -------------------------------------------------------------------------- */

const CounselorBoard = ({
  onViewAppointments,
  onAlertPress,
  onCounselorLoaded,
  onAlertCountChange,
}: {
  onViewAppointments:
    () => void;

  onAlertPress:
    (alert: StressAlert) => void;

  onCounselorLoaded?:
    (name: string) => void;

  onAlertCountChange?:
    (count: number) => void;
}) => {
  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    counselorName,
    setCounselorName,
  ] = useState("");

  const [
    activeChats,
    setActiveChats,
  ] = useState(0);

  const [
    todaysAppts,
    setTodaysAppts,
  ] = useState(0);

  const [
    appointments,
    setAppointments,
  ] =
    useState<
      TodayAppointment[]
    >([]);

  const [
    alerts,
    setAlerts,
  ] =
    useState<
      StressAlert[]
    >([]);

  const uid =
    getAuth()
      .currentUser?.uid;

  /* ------------------------------------------------------------------------ */
  /*                              LOAD DASHBOARD                              */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const loadBoard =
      async () => {
        try {
          const [
            name,
            chatsCount,
            todayAppts,
            stressAlerts,
          ] =
            await Promise.all([
              fetchCounselorName(
                uid
              ),

              fetchActiveChatsCount(
                uid
              ),

              fetchTodayAppointments(
                uid
              ),

              fetchStressAlerts(
                uid
              ),
            ]);

          setCounselorName(
            name
          );

          setActiveChats(
            chatsCount
          );

          setTodaysAppts(
            todayAppts.length
          );

          setAppointments(
            todayAppts
          );

          setAlerts(
            stressAlerts
          );

          onCounselorLoaded?.(
            name
          );

          onAlertCountChange?.(
            stressAlerts.length
          );
        } catch (error) {
          console.error(
            "Board fetch error",
            error
          );
        } finally {
          setLoading(
            false
          );
        }
      };

    loadBoard();
  }, [
    uid,
    onCounselorLoaded,
    onAlertCountChange,
  ]);

  /* ------------------------------------------------------------------------ */
  /*                                LOADING                                   */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <View
        className="
          flex-1
          bg-[#F5F7F6]
          items-center
          justify-center
        "
      >
        <View
          className="
            w-16
            h-16
            rounded-[22px]
            bg-[#E7F0EE]
            items-center
            justify-center
            mb-4
          "
        >
          <ActivityIndicator
            color={
              COLORS.teal
            }
          />
        </View>

        <Text
          className="
            text-[13px]
            font-semibold
            text-[#71807C]
          "
        >
          Preparing your
          dashboard…
        </Text>
      </View>
    );
  }

  const displayName =
    counselorName?.trim() ||
    "Counselor";

  /* ------------------------------------------------------------------------ */
  /*                                SCREEN                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <View
      className="
        flex-1
        bg-[#F5F7F6]
      "
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={{
          paddingHorizontal:
            18,

          paddingTop:
            16,

          paddingBottom:
            110,
        }}
      >
        {/* ============================================================ */}
        {/* WELCOME                                                     */}
        {/* ============================================================ */}

        <Animated.View
          entering={FadeIn.duration(
            250
          )}
          className="
            bg-[#E7F0EE]
            border
            border-[#D8E5E2]
            rounded-[26px]
            p-5
            mb-5
            overflow-hidden
          "
        >
          <View
            pointerEvents="none"
            className="
              absolute
              -right-8
              -top-8
              w-28
              h-28
              rounded-full
              bg-white/30
            "
          />

          <View
            className="
              w-10
              h-10
              rounded-[14px]
              bg-white
              items-center
              justify-center
              mb-3
            "
          >
            <Ionicons
              name="heart-outline"
              size={19}
              color={COLORS.teal}
            />
          </View>

          <Text
            className="
              text-[10px]
              font-bold
              tracking-[0.8px]
              uppercase
              text-[#4F7C78]
            "
          >
            Today's overview
          </Text>

          <Text
            className="
              text-[21px]
              leading-7
              font-extrabold
              text-[#25312F]
              mt-1
            "
          >
            Welcome back,{" "}
            {displayName}
          </Text>

          <Text
            className="
              text-[11.5px]
              leading-[17px]
              text-[#71807C]
              mt-1
            "
          >
            Here's what may need
            your attention today.
          </Text>
        </Animated.View>

        {/* ============================================================ */}
        {/* STATS                                                       */}
        {/* ============================================================ */}

        <View className="flex-row mb-6">
          <View className="flex-1 mr-1.5">
            <StatCard
              label="Active chats"
              value={
                activeChats
              }
              icon="chatbubbles-outline"
              color={
                COLORS.teal
              }
              bg={
                COLORS.tealSoft
              }
              delay={50}
            />
          </View>

          <View className="flex-1 ml-1.5">
            <StatCard
              label="Today's appts"
              value={
                todaysAppts
              }
              icon="calendar-outline"
              color={
                COLORS.amber
              }
              bg={
                COLORS.amberSoft
              }
              delay={100}
            />
          </View>
        </View>

        {/* ============================================================ */}
        {/* ALERTS                                                      */}
        {/* ============================================================ */}

        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View
              className="
                w-8
                h-8
                rounded-xl
                bg-[#F8E8E9]
                items-center
                justify-center
                mr-2.5
              "
            >
              <Ionicons
                name="warning-outline"
                size={15}
                color={
                  COLORS.danger
                }
              />
            </View>

            <View>
              <Text
                className="
                  text-[14px]
                  font-extrabold
                  text-[#25312F]
                "
              >
                Stress alerts
              </Text>

              <Text
                className="
                  text-[10px]
                  text-[#71807C]
                "
              >
                Students who may
                need attention
              </Text>
            </View>
          </View>

          {alerts.length > 0 && (
            <View
              className="
                min-w-7
                h-7
                px-2
                rounded-full
                bg-[#F8E8E9]
                items-center
                justify-center
              "
            >
              <Text
                className="
                  text-[10px]
                  font-extrabold
                  text-[#B85C62]
                "
              >
                {alerts.length}
              </Text>
            </View>
          )}
        </View>

        {alerts.length === 0 ? (
          <View
            className="
              bg-white
              border
              border-[#E2E9E6]
              rounded-[20px]
              items-center
              py-6
              mb-6
            "
          >
            <View
              className="
                w-10
                h-10
                rounded-[14px]
                bg-[#E5F0E9]
                items-center
                justify-center
                mb-2.5
              "
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={
                  COLORS.success
                }
              />
            </View>

            <Text
              className="
                text-[12px]
                font-semibold
                text-[#71807C]
              "
            >
              No urgent alerts
              right now
            </Text>
          </View>
        ) : (
          <View className="mb-6">
            {alerts.map(
              (
                alert,
                index
              ) => (
                <StressAlertRow
                  key={alert.id}
                  alert={alert}
                  delay={
                    140 +
                    index * 50
                  }
                  onPress={() =>
                    onAlertPress(
                      alert
                    )
                  }
                />
              )
            )}
          </View>
        )}

        {/* ============================================================ */}
        {/* APPOINTMENTS                                                */}
        {/* ============================================================ */}

        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View
              className="
                w-8
                h-8
                rounded-xl
                bg-[#FAEEE2]
                items-center
                justify-center
                mr-2.5
              "
            >
              <Ionicons
                name="calendar-outline"
                size={15}
                color={
                  COLORS.amber
                }
              />
            </View>

            <View>
              <Text
                className="
                  text-[14px]
                  font-extrabold
                  text-[#25312F]
                "
              >
                Today's appointments
              </Text>

              <Text
                className="
                  text-[10px]
                  text-[#71807C]
                "
              >
                Your scheduled
                sessions
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={
              onViewAppointments
            }
            className="
              px-3
              py-1.5
              rounded-full
              bg-[#E7F0EE]
            "
          >
            <Text
              className="
                text-[10.5px]
                font-bold
                text-[#4F7C78]
              "
            >
              View all
            </Text>
          </TouchableOpacity>
        </View>

        {appointments.length ===
        0 ? (
          <View
            className="
              bg-white
              border
              border-[#E2E9E6]
              rounded-[20px]
              py-6
              items-center
            "
          >
            <Ionicons
              name="calendar-clear-outline"
              size={23}
              color={
                COLORS.lightText
              }
            />

            <Text
              className="
                mt-2
                text-[11.5px]
                text-[#71807C]
              "
            >
              No sessions scheduled
              today
            </Text>
          </View>
        ) : (
          appointments.map(
            (
              appointment,
              index
            ) => (
              <AppointmentRow
                key={
                  appointment.id
                }
                appt={
                  appointment
                }
                delay={
                  280 +
                  index * 50
                }
              />
            )
          )
        )}
      </ScrollView>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                              BOTTOM NAV                                    */
/* -------------------------------------------------------------------------- */

const NAV_ITEMS = [
  {
    key: "board",
    label: "Board",
    icon: "grid-outline",
    activeIcon: "grid",
  },

  {
    key: "chats",
    label: "Chats",
    icon: "chatbubble-outline",
    activeIcon:
      "chatbubble",
  },

  {
    key: "appointments",
    label: "Appointments",
    icon: "calendar-outline",
    activeIcon:
      "calendar",
  },
] as const;

const BottomNav = ({
  active,
  onChange,
}: {
  active: ScreenState;

  onChange:
    (screen: ScreenState) => void;
}) => {
  return (
    <View
      pointerEvents="box-none"
      className="
        absolute
        bottom-4
        left-0
        right-0
        items-center
      "
    >
      <View
        className="
          flex-row
          items-center
          px-2
          py-1.5
          rounded-[24px]
          bg-white
          border
          border-[#E2E9E6]
        "
        style={{
          shadowColor:
            "#25312F",

          shadowOpacity:
            0.07,

          shadowRadius:
            12,

          shadowOffset: {
            width: 0,
            height: 4,
          },

          elevation: 4,
        }}
      >
        {NAV_ITEMS.map(
          (item) => {
            const isActive =
              active ===
              item.key;

            return (
              <TouchableOpacity
                key={
                  item.key
                }
                activeOpacity={
                  0.75
                }
                accessibilityRole="button"
                accessibilityLabel={
                  item.label
                }
                accessibilityState={{
                  selected:
                    isActive,
                }}
                onPress={() => {
                  Haptics
                    .selectionAsync()
                    .catch(
                      () => {}
                    );

                  onChange(
                    item.key
                  );
                }}
                className="
                  w-[58px]
                  h-[48px]
                  items-center
                  justify-center
                "
              >
                <View
                  className={`
                    w-10
                    h-10
                    rounded-[14px]
                    items-center
                    justify-center

                    ${
                      isActive
                        ? "bg-[#E7F0EE]"
                        : "bg-transparent"
                    }
                  `}
                >
                  <Ionicons
                    name={
                      isActive
                        ? item.activeIcon
                        : item.icon
                    }
                    size={
                      isActive
                        ? 21
                        : 20
                    }
                    color={
                      isActive
                        ? COLORS.teal
                        : COLORS.lightText
                    }
                  />

                  {isActive && (
                    <View
                      className="
                        absolute
                        -bottom-0.5
                        w-1
                        h-1
                        rounded-full
                        bg-[#4F7C78]
                      "
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          }
        )}
      </View>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                            MAIN DASHBOARD                                  */
/* -------------------------------------------------------------------------- */

export default function CounselorDashboardScreen() {
  const [
    screen,
    setScreen,
  ] =
    useState<ScreenState>(
      "board"
    );

  const [
    openConversationId,
    setOpenConversationId,
  ] = useState<
    string | undefined
  >();

  const [
    chatRoomOpen,
    setChatRoomOpen,
  ] =
    useState(false);

  /* header data */

  const [
    counselorName,
    setCounselorName,
  ] =
    useState(
      "Counselor"
    );

  const [
    notificationCount,
    setNotificationCount,
  ] =
    useState(0);

  /* popups */

  const [
    profileOpen,
    setProfileOpen,
  ] =
    useState(false);

  const [
    notificationOpen,
    setNotificationOpen,
  ] =
    useState(false);

  const [
    loggingOut,
    setLoggingOut,
  ] =
    useState(false);

  const navigation =
    useNavigation();

  const auth =
    getAuth();

  const counselorEmail =
    auth.currentUser
      ?.email || "";

  /* ------------------------------------------------------------------------ */
  /*                             STACK HEADER                                 */
  /* ------------------------------------------------------------------------ */

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle:
        HEADER_TITLES[
          screen
        ],

      headerBackVisible:
        false,

      headerShadowVisible:
        false,

      /*
        Hide the parent header only
        while an actual conversation
        is open.
      */

      headerShown:
        !(
          screen ===
            "chats" &&
          chatRoomOpen
        ),

      headerStyle: {
        backgroundColor:
          COLORS.background,
      },

      headerTitleStyle: {
        color:
          COLORS.text,

        fontSize: 17,

        fontWeight:
          "700",
      },

      headerTintColor:
        COLORS.teal,

      /* ============================================================ */
      /* NOTIFICATION + PROFILE                                      */
      /* ============================================================ */

      headerRight: () => (
        <HeaderActions
          notificationCount={
            notificationCount
          }
          onNotificationPress={() => {
            setProfileOpen(
              false
            );

            setNotificationOpen(
              true
            );
          }}
          onProfilePress={() => {
            setNotificationOpen(
              false
            );

            setProfileOpen(
              true
            );
          }}
        />
      ),
    });
  }, [
    navigation,
    screen,
    chatRoomOpen,
    notificationCount,
  ]);

  /* ------------------------------------------------------------------------ */
  /*                          CHANGE MAIN SCREEN                              */
  /* ------------------------------------------------------------------------ */

  const changeScreen = (
    nextScreen:
      ScreenState
  ) => {
    setChatRoomOpen(
      false
    );

    setOpenConversationId(
      undefined
    );

    setNotificationOpen(
      false
    );

    setProfileOpen(
      false
    );

    setScreen(
      nextScreen
    );
  };

  /* ------------------------------------------------------------------------ */
  /*                          OPEN ALERT CHAT                                 */
  /* ------------------------------------------------------------------------ */

  const handleAlertPress =
    async (
      alert:
        StressAlert
    ) => {
      const uid =
        getAuth()
          .currentUser
          ?.uid;

      if (!uid) {
        return;
      }

      try {
        const conversationId =
          await findConversationByStudent(
            uid,
            alert.studentId
          );

        if (
          conversationId
        ) {
          setOpenConversationId(
            conversationId
          );

          setScreen(
            "chats"
          );
        } else {
          Alert.alert(
            "Conversation unavailable",
            "No active conversation was found for this student."
          );
        }
      } catch (error) {
        console.error(
          "Could not open conversation:",
          error
        );

        Alert.alert(
          "Unable to open chat",
          "Please try again."
        );
      }
    };

  /* ------------------------------------------------------------------------ */
  /*                               LOGOUT                                     */
  /* ------------------------------------------------------------------------ */

  const handleLogout =
    () => {
      setProfileOpen(
        false
      );

      Alert.alert(
        "Log out",
        "Are you sure you want to log out of your counselor account?",
        [
          {
            text:
              "Cancel",

            style:
              "cancel",
          },

          {
            text:
              "Log out",

            style:
              "destructive",

            onPress:
              async () => {
                if (
                  loggingOut
                ) {
                  return;
                }

                try {
                  setLoggingOut(
                    true
                  );

                  await signOut(
                    getAuth()
                  );

                  Haptics
                    .notificationAsync(
                      Haptics
                        .NotificationFeedbackType
                        .Success
                    )
                    .catch(
                      () => {}
                    );

                  /*
                    Same auth route
                    used by your
                    login/register
                    screens.
                  */

                  router.replace(
                    "/Route/login"
                  );
                } catch (
                  error
                ) {
                  console.error(
                    "Logout error:",
                    error
                  );

                  Alert.alert(
                    "Logout failed",
                    "Could not log out. Please try again."
                  );
                } finally {
                  setLoggingOut(
                    false
                  );
                }
              },
          },
        ]
      );
    };

  /* ------------------------------------------------------------------------ */
  /*                                UI                                        */
  /* ------------------------------------------------------------------------ */

  return (
    <View
      className="
        flex-1
        bg-[#F5F7F6]
      "
    >
      {/* ================================================================ */}
      {/* SCREENS                                                          */}
      {/* ================================================================ */}

      <View className="flex-1">
        {screen ===
          "board" && (
          <CounselorBoard
            onViewAppointments={() =>
              changeScreen(
                "appointments"
              )
            }

            onAlertPress={
              handleAlertPress
            }

            onCounselorLoaded={
              setCounselorName
            }

            onAlertCountChange={
              setNotificationCount
            }
          />
        )}

        {screen ===
          "chats" && (
          <ChatScreen
            openConversationId={
              openConversationId
            }

            onBackToBoard={() =>
              changeScreen(
                "board"
              )
            }

            onConversationStateChange={
              setChatRoomOpen
            }
          />
        )}

        {screen ===
          "appointments" && (
          <AppointmentsScreen
            onBack={() =>
              changeScreen(
                "board"
              )
            }
          />
        )}
      </View>

      {/* ================================================================ */}
      {/* SHARED FOOTER                                                    */}
      {/* ================================================================ */}

      {!(
        screen ===
          "chats" &&
        chatRoomOpen
      ) && (
        <BottomNav
          active={
            screen
          }
          onChange={
            changeScreen
          }
        />
      )}

      {/* ================================================================ */}
      {/* PROFILE POPUP                                                    */}
      {/* ================================================================ */}

      <ProfilePopup
        visible={
          profileOpen
        }

        onClose={() =>
          setProfileOpen(
            false
          )
        }

        counselorName={
          counselorName
        }

        email={
          counselorEmail
        }

        onLogout={
          handleLogout
        }
      />

      {/* ================================================================ */}
      {/* NOTIFICATION POPUP                                               */}
      {/* ================================================================ */}

      <NotificationPopup
        visible={
          notificationOpen
        }

        count={
          notificationCount
        }

        onClose={() =>
          setNotificationOpen(
            false
          )
        }

        onViewAlerts={() => {
          setNotificationOpen(
            false
          );

          changeScreen(
            "board"
          );
        }}
      />
    </View>
  );
}