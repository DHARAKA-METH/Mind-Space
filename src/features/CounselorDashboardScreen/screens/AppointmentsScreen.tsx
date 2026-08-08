import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
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
  onAuthStateChanged,
} from "firebase/auth";

import {
  fetchAppointments,
  updateAppointmentStatus,
  CounselorAppointment,
} from "../services/appointmentService";

/* -------------------------------------------------------------------------- */
/*                             COUNSELOR COLORS                               */
/* -------------------------------------------------------------------------- */

const COLORS = {
  background: "#F5F7F6",

  teal: "#4F7C78",
  tealDark: "#3F6864",
  tealSoft: "#E7F0EE",

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
/*                            FORMAT DATE/TIME                                */
/* -------------------------------------------------------------------------- */

const formatDateTime = (
  iso: string
) => {
  const date =
    new Date(iso);

  return {
    date:
      date.toLocaleDateString(
        [],
        {
          month: "short",
          day: "numeric",
        }
      ),

    time:
      date.toLocaleTimeString(
        [],
        {
          hour:
            "2-digit",

          minute:
            "2-digit",
        }
      ),
  };
};

/* -------------------------------------------------------------------------- */
/*                               STATUS STYLES                                */
/* -------------------------------------------------------------------------- */

const STATUS_STYLES: Record<
  string,
  {
    bg: string;
    color: string;
  }
> = {
  pending: {
    bg: COLORS.amberSoft,
    color: COLORS.amber,
  },

  confirmed: {
    bg: COLORS.successSoft,
    color: COLORS.success,
  },

  cancelled: {
    bg: COLORS.dangerSoft,
    color: COLORS.danger,
  },

  completed: {
    bg: COLORS.blueSoft,
    color: COLORS.blue,
  },

  missed: {
    bg: "#EEF1F0",
    color:
      COLORS.secondaryText,
  },
};

/* -------------------------------------------------------------------------- */
/*                          APPOINTMENT CARD                                  */
/* -------------------------------------------------------------------------- */

const AppointmentRow = ({
  appt,
  delay,
  updating,
  onAccept,
  onReject,
  onComplete,
  onMissed,
}: any) => {
  const {
    date,
    time,
  } = formatDateTime(
    appt.appointmentDateTime
  );

  const isPending =
    appt.status ===
    "pending";

  const isConfirmed =
    appt.status ===
    "confirmed";

  const status =
    STATUS_STYLES[
      appt.status
    ] ||
    STATUS_STYLES.pending;

  return (
    <Animated.View
      entering={FadeInDown
        .delay(delay)
        .duration(260)}
    >
      <View
        className={`
          bg-white
          rounded-[22px]
          p-4
          mb-3
          border

          ${
            isPending
              ? "border-[#E8C99F]"
              : "border-[#E2E9E6]"
          }
        `}
      >
        {/* ---------------------------------------------------------- */}
        {/* STUDENT                                                   */}
        {/* ---------------------------------------------------------- */}

        <View className="flex-row items-start">
          <View
            className="
              w-12
              h-12
              rounded-[16px]
              bg-[#FAEEE2]
              items-center
              justify-center
            "
          >
            <Text className="text-[22px]">
              {
                appt.studentEmoji
              }
            </Text>
          </View>

          <View className="flex-1 ml-3">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-2">
                <Text
                  numberOfLines={
                    1
                  }
                  className="
                    text-[14px]
                    font-extrabold
                    text-[#25312F]
                  "
                >
                  {
                    appt.studentName
                  }
                </Text>

                <View className="flex-row items-center mt-1.5">
                  <Ionicons
                    name="calendar-outline"
                    size={12}
                    color={
                      COLORS.secondaryText
                    }
                  />

                  <Text
                    className="
                      ml-1
                      text-[10.5px]
                      text-[#71807C]
                    "
                  >
                    {date} at{" "}
                    {time}
                  </Text>
                </View>

                <View className="flex-row items-center mt-1">
                  <Ionicons
                    name={
                      appt.type ===
                      "online"
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
                      text-[10.5px]
                      text-[#71807C]
                      capitalize
                    "
                  >
                    {
                      appt.type
                    }{" "}
                    ·{" "}
                    {
                      appt.durationMinutes
                    }{" "}
                    min
                  </Text>
                </View>
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
                    text-[9px]
                    font-extrabold
                    capitalize
                  "
                  style={{
                    color:
                      status.color,
                  }}
                >
                  {
                    appt.status
                  }
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ---------------------------------------------------------- */}
        {/* ACTIONS                                                    */}
        {/* ---------------------------------------------------------- */}

        {updating ? (
          <View
            className="
              mt-4
              h-11
              rounded-[15px]
              bg-[#F1F6F5]
              items-center
              justify-center
            "
          >
            <ActivityIndicator
              size="small"
              color={
                COLORS.teal
              }
            />
          </View>
        ) : (
          <>
            {isPending && (
              <View className="flex-row gap-2.5 mt-4">
                <TouchableOpacity
                  activeOpacity={
                    0.8
                  }
                  onPress={() =>
                    onAccept(
                      appt
                    )
                  }
                  className="
                    flex-1
                    h-11
                    rounded-[15px]
                    bg-[#4F7C78]
                    flex-row
                    items-center
                    justify-center
                  "
                >
                  <Ionicons
                    name="checkmark"
                    size={15}
                    color="#FFFFFF"
                  />

                  <Text
                    className="
                      ml-1.5
                      text-[11.5px]
                      font-bold
                      text-white
                    "
                  >
                    Accept
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={
                    0.8
                  }
                  onPress={() =>
                    onReject(
                      appt
                    )
                  }
                  className="
                    flex-1
                    h-11
                    rounded-[15px]
                    bg-[#F8E8E9]
                    border
                    border-[#EFCFD2]
                    flex-row
                    items-center
                    justify-center
                  "
                >
                  <Ionicons
                    name="close"
                    size={15}
                    color={
                      COLORS.danger
                    }
                  />

                  <Text
                    className="
                      ml-1.5
                      text-[11.5px]
                      font-bold
                      text-[#B85C62]
                    "
                  >
                    Decline
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {isConfirmed && (
              <View className="flex-row gap-2.5 mt-4">
                <TouchableOpacity
                  activeOpacity={
                    0.8
                  }
                  onPress={() =>
                    onComplete(
                      appt
                    )
                  }
                  className="
                    flex-1
                    h-11
                    rounded-[15px]
                    bg-[#64869B]
                    flex-row
                    items-center
                    justify-center
                  "
                >
                  <Ionicons
                    name="checkmark-done"
                    size={15}
                    color="#FFFFFF"
                  />

                  <Text
                    className="
                      ml-1.5
                      text-[11px]
                      font-bold
                      text-white
                    "
                  >
                    Complete
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={
                    0.8
                  }
                  onPress={() =>
                    onMissed(
                      appt
                    )
                  }
                  className="
                    flex-1
                    h-11
                    rounded-[15px]
                    bg-[#EEF1F0]
                    flex-row
                    items-center
                    justify-center
                  "
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={15}
                    color={
                      COLORS.secondaryText
                    }
                  />

                  <Text
                    className="
                      ml-1.5
                      text-[11px]
                      font-bold
                      text-[#71807C]
                    "
                  >
                    Missed
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </Animated.View>
  );
};

/* -------------------------------------------------------------------------- */
/*                           APPOINTMENTS SCREEN                              */
/* -------------------------------------------------------------------------- */

export default function AppointmentsScreen({
  onBack,
}: any) {
  const [
    appointments,
    setAppointments,
  ] =
    useState<
      CounselorAppointment[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    updatingId,
    setUpdatingId,
  ] =
    useState<
      string | null
    >(null);

  /* ------------------------------------------------------------------------ */
  /*                                LOAD                                     */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        getAuth(),
        (user) => {
          if (!user) {
            setLoading(
              false
            );

            return;
          }

          fetchAppointments(
            user.uid
          )
            .then(
              (data) => {
                setAppointments(
                  data
                );

                setLoading(
                  false
                );
              }
            )
            .catch(
              (error) => {
                console.error(
                  "fetchAppointments error",
                  error
                );

                setLoading(
                  false
                );
              }
            );
        }
      );

    return unsubscribe;
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                             SUMMARY                                     */
  /* ------------------------------------------------------------------------ */

  const summary =
    useMemo(() => {
      return {
        pending:
          appointments.filter(
            (item) =>
              item.status ===
              "pending"
          ).length,

        confirmed:
          appointments.filter(
            (item) =>
              item.status ===
              "confirmed"
          ).length,
      };
    }, [
      appointments,
    ]);

  /* ------------------------------------------------------------------------ */
  /*                         LOCAL UPDATE                                    */
  /* ------------------------------------------------------------------------ */

  const updateLocalStatus =
    (
      appointmentId:
        string,
      status: string
    ) => {
      setAppointments(
        (previous) =>
          previous.map(
            (item) =>
              item.appointmentId ===
              appointmentId
                ? {
                    ...item,
                    status,
                  }
                : item
          )
      );
    };

  /* ------------------------------------------------------------------------ */
  /*                              ACCEPT                                     */
  /* ------------------------------------------------------------------------ */

  const handleAccept =
    async (
      appt:
        CounselorAppointment
    ) => {
      try {
        setUpdatingId(
          appt.appointmentId
        );

        await updateAppointmentStatus(
          appt.appointmentId,
          "confirmed"
        );

        updateLocalStatus(
          appt.appointmentId,
          "confirmed"
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
      } catch {
        Alert.alert(
          "Unable to accept",
          "Could not accept this appointment."
        );
      } finally {
        setUpdatingId(
          null
        );
      }
    };

  /* ------------------------------------------------------------------------ */
  /*                              REJECT                                     */
  /* ------------------------------------------------------------------------ */

  const handleReject = (
    appt:
      CounselorAppointment
  ) => {
    Alert.alert(
      "Decline Appointment",
      `Decline the session with ${appt.studentName}?`,
      [
        {
          text: "Keep",
          style:
            "cancel",
        },

        {
          text: "Decline",
          style:
            "destructive",

          onPress:
            async () => {
              try {
                setUpdatingId(
                  appt.appointmentId
                );

                await updateAppointmentStatus(
                  appt.appointmentId,
                  "cancelled"
                );

                updateLocalStatus(
                  appt.appointmentId,
                  "cancelled"
                );
              } catch {
                Alert.alert(
                  "Error",
                  "Could not decline the appointment."
                );
              } finally {
                setUpdatingId(
                  null
                );
              }
            },
        },
      ]
    );
  };

  /* ------------------------------------------------------------------------ */
  /*                              COMPLETE                                   */
  /* ------------------------------------------------------------------------ */

  const handleComplete =
    async (
      appt:
        CounselorAppointment
    ) => {
      try {
        setUpdatingId(
          appt.appointmentId
        );

        await updateAppointmentStatus(
          appt.appointmentId,
          "completed"
        );

        updateLocalStatus(
          appt.appointmentId,
          "completed"
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
      } catch {
        Alert.alert(
          "Error",
          "Could not mark the appointment as completed."
        );
      } finally {
        setUpdatingId(
          null
        );
      }
    };

  /* ------------------------------------------------------------------------ */
  /*                                MISSED                                   */
  /* ------------------------------------------------------------------------ */

  const handleMissed = (
    appt:
      CounselorAppointment
  ) => {
    Alert.alert(
      "Mark as Missed",
      `Mark the session with ${appt.studentName} as missed?`,
      [
        {
          text: "Cancel",
          style:
            "cancel",
        },

        {
          text:
            "Mark missed",

          style:
            "destructive",

          onPress:
            async () => {
              try {
                setUpdatingId(
                  appt.appointmentId
                );

                await updateAppointmentStatus(
                  appt.appointmentId,
                  "missed"
                );

                updateLocalStatus(
                  appt.appointmentId,
                  "missed"
                );
              } catch {
                Alert.alert(
                  "Error",
                  "Could not mark the appointment."
                );
              } finally {
                setUpdatingId(
                  null
                );
              }
            },
        },
      ]
    );
  };

  /* ------------------------------------------------------------------------ */
  /*                               LOADING                                    */
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
            text-[12px]
            text-[#71807C]
          "
        >
          Loading
          appointments…
        </Text>
      </View>
    );
  }

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

          paddingBottom:
            110,

          paddingTop: 12,
        }}
      >
        {/* ============================================================ */}
        {/* BACK + INTRO                                                 */}
        {/* ============================================================ */}

        <View className="flex-row items-center mb-5">
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={
              0.7
            }
            className="
              w-10
              h-10
              rounded-[14px]
              bg-white
              border
              border-[#E2E9E6]
              items-center
              justify-center
              mr-3
            "
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={
                COLORS.teal
              }
            />
          </TouchableOpacity>

          <View className="flex-1">
            <Text
              className="
                text-[16px]
                font-extrabold
                text-[#25312F]
              "
            >
              Manage sessions
            </Text>

            <Text
              className="
                text-[10.5px]
                text-[#71807C]
                mt-0.5
              "
            >
              Review and update
              appointment status
            </Text>
          </View>
        </View>

        {/* ============================================================ */}
        {/* SUMMARY                                                      */}
        {/* ============================================================ */}

        <View className="flex-row gap-3 mb-6">
          <View
            className="
              flex-1
              p-4
              rounded-[22px]
              bg-[#FAEEE2]
              border
              border-[#F0DDC6]
            "
          >
            <View
              className="
                w-9
                h-9
                rounded-[13px]
                bg-white
                items-center
                justify-center
                mb-3
              "
            >
              <Ionicons
                name="time-outline"
                size={17}
                color={
                  COLORS.amber
                }
              />
            </View>

            <Text
              className="
                text-[25px]
                font-extrabold
                text-[#D79A5B]
              "
            >
              {
                summary.pending
              }
            </Text>

            <Text
              className="
                text-[9.5px]
                font-bold
                uppercase
                text-[#A97846]
                mt-1
              "
            >
              Pending
            </Text>
          </View>

          <View
            className="
              flex-1
              p-4
              rounded-[22px]
              bg-[#E5F0E9]
              border
              border-[#D5E6DC]
            "
          >
            <View
              className="
                w-9
                h-9
                rounded-[13px]
                bg-white
                items-center
                justify-center
                mb-3
              "
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={17}
                color={
                  COLORS.success
                }
              />
            </View>

            <Text
              className="
                text-[25px]
                font-extrabold
                text-[#56836C]
              "
            >
              {
                summary.confirmed
              }
            </Text>

            <Text
              className="
                text-[9.5px]
                font-bold
                uppercase
                text-[#56836C]
                mt-1
              "
            >
              Confirmed
            </Text>
          </View>
        </View>

        {/* ============================================================ */}
        {/* LIST HEADER                                                  */}
        {/* ============================================================ */}

        <Animated.View
          entering={FadeIn.duration(
            250
          )}
          className="
            flex-row
            items-center
            justify-between
            mb-3
          "
        >
          <Text
            className="
              text-[14px]
              font-extrabold
              text-[#25312F]
            "
          >
            All appointments
          </Text>

          <Text
            className="
              text-[10.5px]
              text-[#71807C]
            "
          >
            {
              appointments.length
            }{" "}
            total
          </Text>
        </Animated.View>

        {/* ============================================================ */}
        {/* EMPTY / APPOINTMENTS                                         */}
        {/* ============================================================ */}

        {appointments.length ===
        0 ? (
          <View
            className="
              bg-white
              border
              border-[#E2E9E6]
              rounded-[22px]
              py-10
              items-center
            "
          >
            <View
              className="
                w-14
                h-14
                rounded-[20px]
                bg-[#E7F0EE]
                items-center
                justify-center
                mb-3
              "
            >
              <Ionicons
                name="calendar-outline"
                size={24}
                color={
                  COLORS.teal
                }
              />
            </View>

            <Text
              className="
                text-[13px]
                font-bold
                text-[#25312F]
              "
            >
              No appointments yet
            </Text>

            <Text
              className="
                mt-1
                text-[10.5px]
                text-[#71807C]
              "
            >
              New session
              requests will
              appear here.
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
                  appointment.appointmentId
                }
                appt={
                  appointment
                }
                delay={
                  80 +
                  index *
                    45
                }
                updating={
                  updatingId ===
                  appointment.appointmentId
                }
                onAccept={
                  handleAccept
                }
                onReject={
                  handleReject
                }
                onComplete={
                  handleComplete
                }
                onMissed={
                  handleMissed
                }
              />
            )
          )
        )}
      </ScrollView>
    </View>
  );
}