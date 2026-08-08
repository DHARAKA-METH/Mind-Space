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
  Layout,
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

import {
  commonColors,
  counselorColors,
  spacing,
  typography,
} from "@/src/theme";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type AppointmentFilter =
  | "approval"
  | "outcome"
  | "upcoming"
  | "history"
  | "all";

/* -------------------------------------------------------------------------- */
/*                             DATE HELPERS                                   */
/* -------------------------------------------------------------------------- */

const getAppointmentDate = (
  appointment: CounselorAppointment
) => {
  return new Date(
    appointment.appointmentDateTime
  );
};

const formatDateTime = (
  iso: string
) => {
  const date =
    new Date(iso);

  const today =
    new Date();

  const tomorrow =
    new Date();

  tomorrow.setDate(
    today.getDate() + 1
  );

  const isSameDay = (
    first: Date,
    second: Date
  ) =>
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate();

  let friendlyDate =
    date.toLocaleDateString(
      [],
      {
        month: "short",
        day: "numeric",
      }
    );

  if (
    isSameDay(
      date,
      today
    )
  ) {
    friendlyDate =
      "Today";
  } else if (
    isSameDay(
      date,
      tomorrow
    )
  ) {
    friendlyDate =
      "Tomorrow";
  }

  return {
    date:
      friendlyDate,

    fullDate:
      date.toLocaleDateString(
        [],
        {
          weekday:
            "short",
          month:
            "short",
          day:
            "numeric",
          year:
            "numeric",
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

const isAppointmentPast = (
  appointment:
    CounselorAppointment
) => {
  return (
    getAppointmentDate(
      appointment
    ).getTime() <
    Date.now()
  );
};

const isAppointmentToday = (
  appointment:
    CounselorAppointment
) => {
  const appointmentDate =
    getAppointmentDate(
      appointment
    );

  const today =
    new Date();

  return (
    appointmentDate.getFullYear() ===
      today.getFullYear() &&
    appointmentDate.getMonth() ===
      today.getMonth() &&
    appointmentDate.getDate() ===
      today.getDate()
  );
};

/* -------------------------------------------------------------------------- */
/*                               STATUS STYLE                                 */
/* -------------------------------------------------------------------------- */

const STATUS_STYLES: Record<
  string,
  {
    bg: string;
    color: string;
    label: string;
    icon: any;
  }
> = {
  pending: {
    bg: counselorColors.warningSoft,
    color: counselorColors.warning,
    label: "Needs approval",
    icon: "time-outline",
  },

  confirmed: {
    bg: counselorColors.successSoft,
    color: counselorColors.success,
    label: "Confirmed",
    icon:
      "checkmark-circle-outline",
  },

  cancelled: {
    bg: counselorColors.errorSoft,
    color: counselorColors.error,
    label: "Cancelled",
    icon:
      "close-circle-outline",
  },

  completed: {
    bg: counselorColors.infoSoft,
    color: counselorColors.info,
    label: "Completed",
    icon:
      "checkmark-done-outline",
  },

  missed: {
    bg: counselorColors.surfaceMuted,
    color:
      counselorColors.textSecondary,
    label: "Missed",
    icon:
      "remove-circle-outline",
  },
};

/* -------------------------------------------------------------------------- */
/*                              STATUS BADGE                                  */
/* -------------------------------------------------------------------------- */

const StatusBadge = ({
  status,
}: {
  status: string;
}) => {
  const config =
    STATUS_STYLES[
      status
    ] ||
    STATUS_STYLES.pending;

  return (
    <View
      className="
        flex-row
        items-center
        px-2.5
        py-1.5
        rounded-full
      "
      style={{
        backgroundColor:
          config.bg,
      }}
    >
      <Ionicons
        name={
          config.icon
        }
        size={10}
        color={
          config.color
        }
      />

      <Text
        className="
          ml-1
          text-caption
          font-extrabold
        "
        style={{
          color:
            config.color,
        }}
      >
        {config.label}
      </Text>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                             FILTER BUTTON                                  */
/* -------------------------------------------------------------------------- */

const FilterButton = ({
  label,
  count,
  active,
  onPress,
  urgent = false,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
  urgent?: boolean;
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => {
        Haptics
          .selectionAsync()
          .catch(
            () => {}
          );

        onPress();
      }}
      className={`
        flex-row
        items-center
        h-10
        px-3.5
        rounded-[14px]
        mr-2
        border

        ${
          active
            ? "bg-counselor-primary border-counselor-primary"
            : "bg-counselor-surface border-counselor-border"
        }
      `}
    >
      {urgent &&
        count > 0 && (
          <View
            className={`
              w-2
              h-2
              rounded-full
              mr-1.5

              ${
                active
                  ? "bg-counselor-surface"
                  : "bg-counselor-accent"
              }
            `}
          />
        )}

      <Text
        className={`
          text-caption
          font-bold

          ${
            active
              ? "text-white"
              : "text-counselor-textSecondary"
          }
        `}
      >
        {label}
      </Text>

      <View
        className={`
          ml-2
          min-w-[20px]
          h-5
          px-1.5
          rounded-full
          items-center
          justify-center

          ${
            active
              ? "bg-counselor-surface/20"
              : urgent &&
                count > 0
              ? "bg-counselor-accentSoft"
              : "bg-counselor-surfaceMuted"
          }
        `}
      >
        <Text
          className={`
            text-caption
            font-extrabold

            ${
              active
                ? "text-white"
                : urgent &&
                  count > 0
                ? "text-counselor-accent"
                : "text-counselor-textSecondary"
            }
          `}
        >
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

/* -------------------------------------------------------------------------- */
/*                            SUMMARY CARD                                    */
/* -------------------------------------------------------------------------- */

const SummaryCard = ({
  title,
  value,
  subtitle,
  icon,
  bg,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: any;
  bg: string;
  color: string;
}) => {
  return (
    <View
      className="
        flex-1
        rounded-[22px]
        p-4
        border
        border-counselor-border
      "
      style={{
        backgroundColor:
          bg,
      }}
    >
      <View
        className="
          w-9
          h-9
          rounded-[13px]
          bg-counselor-surface
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

      <Text
        className="
          text-heading
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
          text-caption
          font-extrabold
          mt-0.5
        "
        style={{
          color,
        }}
      >
        {title}
      </Text>

      <Text
        className="
          text-caption
          mt-1
          text-counselor-textSecondary
        "
      >
        {subtitle}
      </Text>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                              NEXT SESSION                                  */
/* -------------------------------------------------------------------------- */

const NextSessionCard = ({
  appointment,
}: {
  appointment:
    CounselorAppointment;
}) => {
  const {
    fullDate,
    time,
  } = formatDateTime(
    appointment.appointmentDateTime
  );

  return (
    <Animated.View
      entering={FadeInDown.duration(
        280
      )}
      className="
        bg-counselor-primarySoft
        border
        border-counselor-primarySoft
        rounded-[24px]
        p-4
        mb-6
        overflow-hidden
      "
    >
      <View
        pointerEvents="none"
        className="
          absolute
          -right-8
          -top-8
          w-24
          h-24
          rounded-full
          bg-counselor-surface/25
        "
      />

      <View className="flex-row items-center justify-between">
        <View
          className="
            flex-row
            items-center
          "
        >
          <View
            className="
              w-9
              h-9
              rounded-[13px]
              bg-counselor-surface
              items-center
              justify-center
              mr-2.5
            "
          >
            <Ionicons
              name="calendar-outline"
              size={17}
              color={
                counselorColors.primary
              }
            />
          </View>

          <View>
            <Text
              style={{
                letterSpacing:
                  typography.letterSpacing.label,
              }}
              className="
                text-caption
                font-extrabold
                text-counselor-primary
              "
            >
              NEXT SESSION
            </Text>

            <Text
              className="
                text-caption
                font-extrabold
                text-counselor-textPrimary
                mt-0.5
              "
            >
              {
                appointment.studentName
              }
            </Text>
          </View>
        </View>

        <StatusBadge
          status={
            appointment.status
          }
        />
      </View>

      <View
        className="
          bg-counselor-surface
          rounded-[17px]
          p-3
          mt-3
        "
      >
        <View className="flex-row items-center">
          <Ionicons
            name="calendar-clear-outline"
            size={14}
            color={
              counselorColors.primary
            }
          />

          <Text
            className="
              ml-2
              text-caption
              font-semibold
              text-counselor-textPrimary
            "
          >
            {fullDate}
          </Text>
        </View>

        <View className="flex-row items-center mt-2">
          <Ionicons
            name="time-outline"
            size={14}
            color={
              counselorColors.primary
            }
          />

          <Text
            className="
              ml-2
              text-caption
              text-counselor-textSecondary
            "
          >
            {time} ·{" "}
            {
              appointment.durationMinutes
            }{" "}
            minutes
          </Text>
        </View>

        <View className="flex-row items-center mt-2">
          <Ionicons
            name={
              appointment.type ===
              "online"
                ? "videocam-outline"
                : "location-outline"
            }
            size={14}
            color={
              counselorColors.primary
            }
          />

          <Text
            className="
              ml-2
              text-caption
              text-counselor-textSecondary
              capitalize
            "
          >
            {
              appointment.type
            }{" "}
            session
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

/* -------------------------------------------------------------------------- */
/*                           APPOINTMENT CARD                                 */
/* -------------------------------------------------------------------------- */

const AppointmentRow = ({
  appt,
  delay,
  updating,
  section,
  onAccept,
  onReject,
  onComplete,
  onMissed,
}: {
  appt:
    CounselorAppointment;

  delay: number;

  updating: boolean;

  section:
    AppointmentFilter;

  onAccept: (
    appointment:
      CounselorAppointment
  ) => void;

  onReject: (
    appointment:
      CounselorAppointment
  ) => void;

  onComplete: (
    appointment:
      CounselorAppointment
  ) => void;

  onMissed: (
    appointment:
      CounselorAppointment
  ) => void;
}) => {
  const {
    date,
    fullDate,
    time,
  } = formatDateTime(
    appt.appointmentDateTime
  );

  const past =
    isAppointmentPast(
      appt
    );

  const pending =
    appt.status ===
    "pending";

  const confirmed =
    appt.status ===
    "confirmed";

  const needsOutcome =
    confirmed &&
    past;

  const canApprove =
    pending &&
    !past;

  const futureConfirmed =
    confirmed &&
    !past;

  return (
    <Animated.View
      entering={FadeInDown
        .delay(delay)
        .duration(240)}
      layout={Layout}
    >
      <View
        className={`
          bg-counselor-surface
          rounded-[22px]
          p-4
          mb-3
          border

          ${
            canApprove
              ? "border-counselor-accent"
              : needsOutcome
              ? "border-counselor-info"
              : "border-counselor-border"
          }
        `}
      >
        {/* ============================================================ */}
        {/* TOP                                                         */}
        {/* ============================================================ */}

        <View className="flex-row items-start">
          <View
            className="
              w-12
              h-12
              rounded-[16px]
              bg-counselor-accentSoft
              items-center
              justify-center
            "
          >
            <Text className="text-[22px]">
              {appt.studentEmoji ||
                "🙂"}
            </Text>
          </View>

          <View className="flex-1 ml-3">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-2">
                <Text
                  numberOfLines={1}
                  className="
                    text-body
                    font-extrabold
                    text-counselor-textPrimary
                  "
                >
                  {
                    appt.studentName
                  }
                </Text>

                <Text
                  className="
                    text-caption
                    font-semibold
                    text-counselor-primary
                    mt-1
                  "
                >
                  {date} ·{" "}
                  {time}
                </Text>
              </View>

              <StatusBadge
                status={
                  appt.status
                }
              />
            </View>

            {/* details */}

            <View className="mt-3">
              <View className="flex-row items-center">
                <Ionicons
                  name="calendar-outline"
                  size={13}
                  color={
                    counselorColors.textSecondary
                  }
                />

                <Text
                  className="
                    ml-1.5
                    text-caption
                    text-counselor-textSecondary
                  "
                >
                  {fullDate}
                </Text>
              </View>

              <View className="flex-row items-center mt-1.5">
                <Ionicons
                  name={
                    appt.type ===
                    "online"
                      ? "videocam-outline"
                      : "location-outline"
                  }
                  size={13}
                  color={
                    counselorColors.textSecondary
                  }
                />

                <Text
                  className="
                    ml-1.5
                    text-caption
                    text-counselor-textSecondary
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
          </View>
        </View>

        {/* ============================================================ */}
        {/* CONTEXT MESSAGE                                             */}
        {/* ============================================================ */}

        {canApprove && (
          <View
            className="
              flex-row
              items-center
              mt-4
              px-3
              py-2.5
              rounded-[14px]
              bg-counselor-accentSoft
            "
          >
            <Ionicons
              name="alert-circle-outline"
              size={14}
              color={
                counselorColors.accent
              }
            />

            <Text
              className="
                ml-2
                flex-1
                text-caption
                
                text-counselor-accent
              "
            >
              Student is waiting
              for your approval.
            </Text>
          </View>
        )}

        {needsOutcome && (
          <View
            className="
              flex-row
              items-center
              mt-4
              px-3
              py-2.5
              rounded-[14px]
              bg-counselor-infoSoft
            "
          >
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={
                counselorColors.info
              }
            />

            <Text
              className="
                ml-2
                flex-1
                text-caption
                
                text-counselor-info
              "
            >
              This session time
              has passed. Record
              the session outcome.
            </Text>
          </View>
        )}

        {futureConfirmed && (
          <View
            className="
              flex-row
              items-center
              mt-4
              px-3
              py-2.5
              rounded-[14px]
              bg-counselor-successSoft
            "
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={14}
              color={
                counselorColors.success
              }
            />

            <Text
              className="
                ml-2
                flex-1
                text-caption
                text-counselor-success
              "
            >
              Confirmed and
              scheduled.
            </Text>
          </View>
        )}

        {/* ============================================================ */}
        {/* ACTIONS                                                     */}
        {/* ============================================================ */}

        {updating ? (
          <View
            className="
              mt-4
              h-11
              rounded-[15px]
              bg-counselor-surfaceMuted
              items-center
              justify-center
            "
          >
            <ActivityIndicator
              size="small"
              color={
                counselorColors.primary
              }
            />
          </View>
        ) : (
          <>
            {/* approval */}

            {canApprove && (
              <View className="flex-row mt-4">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    onAccept(
                      appt
                    )
                  }
                  className="
                    flex-1
                    h-11
                    rounded-[15px]
                    bg-counselor-primary
                    flex-row
                    items-center
                    justify-center
                    mr-1.5
                  "
                >
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={commonColors.white}
                  />

                  <Text
                    className="
                      ml-1.5
                      text-caption
                      font-bold
                      text-white
                    "
                  >
                    Approve
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    onReject(
                      appt
                    )
                  }
                  className="
                    flex-1
                    h-11
                    rounded-[15px]
                    bg-counselor-errorSoft
                    border
                    border-counselor-errorSoft
                    flex-row
                    items-center
                    justify-center
                    ml-1.5
                  "
                >
                  <Ionicons
                    name="close"
                    size={15}
                    color={
                      counselorColors.error
                    }
                  />

                  <Text
                    className="
                      ml-1.5
                      text-caption
                      font-bold
                      text-counselor-error
                    "
                  >
                    Decline
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* completed / missed only after time */}

            {needsOutcome && (
              <View className="flex-row mt-4">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    onComplete(
                      appt
                    )
                  }
                  className="
                    flex-1
                    h-11
                    rounded-[15px]
                    bg-counselor-info
                    flex-row
                    items-center
                    justify-center
                    mr-1.5
                  "
                >
                  <Ionicons
                    name="checkmark-done"
                    size={15}
                    color={commonColors.white}
                  />

                  <Text
                    className="
                      ml-1.5
                      text-caption
                      font-bold
                      text-white
                    "
                  >
                    Completed
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    onMissed(
                      appt
                    )
                  }
                  className="
                    flex-1
                    h-11
                    rounded-[15px]
                    bg-counselor-surfaceMuted
                    flex-row
                    items-center
                    justify-center
                    ml-1.5
                  "
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={15}
                    color={
                      counselorColors.textSecondary
                    }
                  />

                  <Text
                    className="
                      ml-1.5
                      text-caption
                      font-bold
                      text-counselor-textSecondary
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
/*                               SECTION HEADER                               */
/* -------------------------------------------------------------------------- */

const SectionHeader = ({
  title,
  subtitle,
  icon,
  count,
  color,
  bg,
}: {
  title: string;
  subtitle: string;
  icon: any;
  count: number;
  color: string;
  bg: string;
}) => {
  return (
    <View
      className="
        flex-row
        items-center
        justify-between
        mb-3
      "
    >
      <View className="flex-row items-center flex-1">
        <View
          className="
            w-9
            h-9
            rounded-[13px]
            items-center
            justify-center
            mr-2.5
          "
          style={{
            backgroundColor:
              bg,
          }}
        >
          <Ionicons
            name={icon}
            size={16}
            color={color}
          />
        </View>

        <View className="flex-1">
          <Text
            className="
              text-body-sm
              font-extrabold
              text-counselor-textPrimary
            "
          >
            {title}
          </Text>

          <Text
            className="
              text-caption
              text-counselor-textSecondary
              mt-0.5
            "
          >
            {subtitle}
          </Text>
        </View>
      </View>

      <View
        className="
          min-w-7
          h-7
          px-2
          rounded-full
          items-center
          justify-center
        "
        style={{
          backgroundColor:
            bg,
        }}
      >
        <Text
          className="
            text-caption
            font-extrabold
          "
          style={{
            color,
          }}
        >
          {count}
        </Text>
      </View>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                               EMPTY STATE                                  */
/* -------------------------------------------------------------------------- */

const EmptyState = ({
  filter,
}: {
  filter:
    AppointmentFilter;
}) => {
  const config = {
    approval: {
      icon:
        "checkmark-circle-outline",

      title:
        "No requests waiting",

      description:
        "You have reviewed all current appointment requests.",

      bg:
        counselorColors.successSoft,

      color:
        counselorColors.success,
    },

    outcome: {
      icon:
        "clipboard-outline",

      title:
        "No outcomes needed",

      description:
        "There are no completed-time sessions waiting for an outcome.",

      bg:
        counselorColors.infoSoft,

      color:
        counselorColors.info,
    },

    upcoming: {
      icon:
        "calendar-outline",

      title:
        "No upcoming sessions",

      description:
        "Confirmed future appointments will appear here.",

      bg:
        counselorColors.primarySoft,

      color:
        counselorColors.primary,
    },

    history: {
      icon:
        "time-outline",

      title:
        "No session history",

      description:
        "Completed, missed and cancelled sessions will appear here.",

      bg:
        counselorColors.surfaceMuted,

      color:
        counselorColors.textSecondary,
    },

    all: {
      icon:
        "calendar-outline",

      title:
        "No appointments yet",

      description:
        "New student appointment requests will appear here.",

      bg:
        counselorColors.primarySoft,

      color:
        counselorColors.primary,
    },
  }[filter];

  return (
    <Animated.View
      entering={FadeIn.duration(
        220
      )}
      className="
        bg-counselor-surface
        border
        border-counselor-border
        rounded-[22px]
        py-10
        px-6
        items-center
      "
    >
      <View
        className="
          w-14
          h-14
          rounded-[20px]
          items-center
          justify-center
          mb-3
        "
        style={{
          backgroundColor:
            config.bg,
        }}
      >
        <Ionicons
          name={
            config.icon as any
          }
          size={24}
          color={
            config.color
          }
        />
      </View>

      <Text
        className="
          text-body-sm
          font-extrabold
          text-counselor-textPrimary
          text-center
        "
      >
        {config.title}
      </Text>

      <Text
        className="
          text-caption
          
          text-counselor-textSecondary
          text-center
          mt-1.5
          max-w-[260px]
        "
      >
        {
          config.description
        }
      </Text>
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

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<
      AppointmentFilter
    >("approval");

  /* ------------------------------------------------------------------------ */
  /*                              LOAD                                       */
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
  /*                          ORGANIZE APPOINTMENTS                           */
  /* ------------------------------------------------------------------------ */

  const organized =
    useMemo(() => {
      const now =
        Date.now();

      /*
        Waiting for counselor
        approval.
      */

      const approval =
        appointments
          .filter(
            (item) =>
              item.status ===
                "pending" &&
              getAppointmentDate(
                item
              ).getTime() >
                now
          )
          .sort(
            (a, b) =>
              getAppointmentDate(
                a
              ).getTime() -
              getAppointmentDate(
                b
              ).getTime()
          );

      /*
        Confirmed appointment
        whose scheduled time has
        already passed.

        Counselor needs to choose
        Completed or Missed.
      */

      const outcome =
        appointments
          .filter(
            (item) =>
              item.status ===
                "confirmed" &&
              getAppointmentDate(
                item
              ).getTime() <=
                now
          )
          .sort(
            (a, b) =>
              getAppointmentDate(
                b
              ).getTime() -
              getAppointmentDate(
                a
              ).getTime()
          );

      /*
        Confirmed future
        sessions.
      */

      const upcoming =
        appointments
          .filter(
            (item) =>
              item.status ===
                "confirmed" &&
              getAppointmentDate(
                item
              ).getTime() >
                now
          )
          .sort(
            (a, b) =>
              getAppointmentDate(
                a
              ).getTime() -
              getAppointmentDate(
                b
              ).getTime()
          );

      /*
        Finished / closed items.
      */

      const history =
        appointments
          .filter(
            (item) => {
              if (
                [
                  "completed",
                  "missed",
                  "cancelled",
                ].includes(
                  item.status
                )
              ) {
                return true;
              }

              /*
                Old pending request
                that was never handled.
                Keep it out of current
                approval queue because
                the scheduled time
                already passed.
              */

              if (
                item.status ===
                  "pending" &&
                getAppointmentDate(
                  item
                ).getTime() <=
                  now
              ) {
                return true;
              }

              return false;
            }
          )
          .sort(
            (a, b) =>
              getAppointmentDate(
                b
              ).getTime() -
              getAppointmentDate(
                a
              ).getTime()
          );

      return {
        approval,
        outcome,
        upcoming,
        history,
      };
    }, [
      appointments,
    ]);

  /* ------------------------------------------------------------------------ */
  /*                          NEXT SESSION                                    */
  /* ------------------------------------------------------------------------ */

  const nextSession =
    organized
      .upcoming[0] ||
    null;

  /* ------------------------------------------------------------------------ */
  /*                         TODAY COUNT                                      */
  /* ------------------------------------------------------------------------ */

  const todayCount =
    useMemo(
      () =>
        appointments.filter(
          (item) =>
            isAppointmentToday(
              item
            ) &&
            ![
              "cancelled",
              "completed",
              "missed",
            ].includes(
              item.status
            )
        ).length,
      [
        appointments,
      ]
    );

  /* ------------------------------------------------------------------------ */
  /*                              COUNTS                                     */
  /* ------------------------------------------------------------------------ */

  const filterCounts = {
    approval:
      organized.approval
        .length,

    outcome:
      organized.outcome
        .length,

    upcoming:
      organized.upcoming
        .length,

    history:
      organized.history
        .length,

    all:
      appointments.length,
  };

  /* ------------------------------------------------------------------------ */
  /*                       ACTIVE FILTER DATA                                 */
  /* ------------------------------------------------------------------------ */

  const filteredAppointments =
    useMemo(() => {
      if (
        activeFilter ===
        "approval"
      ) {
        return organized.approval;
      }

      if (
        activeFilter ===
        "outcome"
      ) {
        return organized.outcome;
      }

      if (
        activeFilter ===
        "upcoming"
      ) {
        return organized.upcoming;
      }

      if (
        activeFilter ===
        "history"
      ) {
        return organized.history;
      }

      /*
        All:
        action-needed items first,
        then upcoming, then history.
      */

      return [
        ...organized.approval,
        ...organized.outcome,
        ...organized.upcoming,
        ...organized.history,
      ];
    }, [
      activeFilter,
      organized,
    ]);

  /* ------------------------------------------------------------------------ */
  /*                         LOCAL STATUS UPDATE                              */
  /* ------------------------------------------------------------------------ */

  const updateLocalStatus =
    (
      appointmentId:
        string,

      status:
        string
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
  /*                              APPROVE                                    */
  /* ------------------------------------------------------------------------ */

  const handleAccept =
    async (
      appointment:
        CounselorAppointment
    ) => {
      try {
        setUpdatingId(
          appointment.appointmentId
        );

        await updateAppointmentStatus(
          appointment.appointmentId,
          "confirmed"
        );

        updateLocalStatus(
          appointment.appointmentId,
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
      } catch (
        error
      ) {
        console.error(
          error
        );

        Alert.alert(
          "Unable to approve",
          "Could not approve this appointment. Please try again."
        );
      } finally {
        setUpdatingId(
          null
        );
      }
    };

  /* ------------------------------------------------------------------------ */
  /*                              DECLINE                                    */
  /* ------------------------------------------------------------------------ */

  const handleReject = (
    appointment:
      CounselorAppointment
  ) => {
    Alert.alert(
      "Decline appointment?",
      `The appointment request from ${appointment.studentName} will be cancelled.`,
      [
        {
          text:
            "Keep request",
          style:
            "cancel",
        },

        {
          text:
            "Decline",

          style:
            "destructive",

          onPress:
            async () => {
              try {
                setUpdatingId(
                  appointment.appointmentId
                );

                await updateAppointmentStatus(
                  appointment.appointmentId,
                  "cancelled"
                );

                updateLocalStatus(
                  appointment.appointmentId,
                  "cancelled"
                );

                Haptics
                  .notificationAsync(
                    Haptics
                      .NotificationFeedbackType
                      .Warning
                  )
                  .catch(
                    () => {}
                  );
              } catch (
                error
              ) {
                console.error(
                  error
                );

                Alert.alert(
                  "Unable to decline",
                  "Could not decline this appointment."
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
  /*                              COMPLETED                                   */
  /* ------------------------------------------------------------------------ */

  const handleComplete =
    async (
      appointment:
        CounselorAppointment
    ) => {
      try {
        setUpdatingId(
          appointment.appointmentId
        );

        await updateAppointmentStatus(
          appointment.appointmentId,
          "completed"
        );

        updateLocalStatus(
          appointment.appointmentId,
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
      } catch (
        error
      ) {
        console.error(
          error
        );

        Alert.alert(
          "Unable to update",
          "Could not mark this session as completed."
        );
      } finally {
        setUpdatingId(
          null
        );
      }
    };

  /* ------------------------------------------------------------------------ */
  /*                                MISSED                                    */
  /* ------------------------------------------------------------------------ */

  const handleMissed = (
    appointment:
      CounselorAppointment
  ) => {
    Alert.alert(
      "Mark session as missed?",
      `Confirm that ${appointment.studentName} did not attend this session.`,
      [
        {
          text:
            "Cancel",
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
                  appointment.appointmentId
                );

                await updateAppointmentStatus(
                  appointment.appointmentId,
                  "missed"
                );

                updateLocalStatus(
                  appointment.appointmentId,
                  "missed"
                );
              } catch (
                error
              ) {
                console.error(
                  error
                );

                Alert.alert(
                  "Unable to update",
                  "Could not mark this session as missed."
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
          bg-counselor-background
          items-center
          justify-center
        "
      >
        <View
          className="
            w-16
            h-16
            rounded-[22px]
            bg-counselor-primarySoft
            items-center
            justify-center
            mb-4
          "
        >
          <ActivityIndicator
            color={
              counselorColors.primary
            }
          />
        </View>

        <Text
          className="
            text-caption
            font-semibold
            text-counselor-textSecondary
          "
        >
          Loading appointments…
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
        bg-counselor-background
      "
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={{
          paddingHorizontal:
            spacing.screen,

          paddingTop:
            spacing.sm,

          /*
            Keep room for
            counselor footer.
          */

          paddingBottom:
            120,
        }}
      >
        {/* ============================================================ */}
        {/* INTRO                                                       */}
        {/* ============================================================ */}

        <View className="flex-row items-center mb-5">
          {onBack && (
            <TouchableOpacity
              onPress={
                onBack
              }
              accessibilityRole="button"
              accessibilityLabel="Back to dashboard"
              activeOpacity={
                0.7
              }
              className="
                w-10
                h-10
                rounded-[14px]
                bg-counselor-surface
                border
                border-counselor-border
                items-center
                justify-center
                mr-3
              "
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={
                  counselorColors.primary
                }
              />
            </TouchableOpacity>
          )}

          <View className="flex-1">
            <Text
              className="
                text-body-lg
                font-extrabold
                text-counselor-textPrimary
              "
            >
              Manage sessions
            </Text>

            <Text
              className="
                text-caption
                text-counselor-textSecondary
                mt-0.5
              "
            >
              Review requests and
              keep upcoming
              sessions organized.
            </Text>
          </View>

          {todayCount >
            0 && (
            <View
              className="
                bg-counselor-primarySoft
                px-2.5
                py-1.5
                rounded-full
              "
            >
              <Text
                className="
                  text-caption
                  font-bold
                  text-counselor-primary
                "
              >
                {todayCount} today
              </Text>
            </View>
          )}
        </View>

        {/* ============================================================ */}
        {/* ACTION NEEDED BANNER                                        */}
        {/* ============================================================ */}

        {(organized
          .approval.length >
          0 ||
          organized.outcome
            .length >
            0) && (
          <Animated.View
            entering={FadeInDown.duration(
              250
            )}
            className="
              flex-row
              items-center
              bg-counselor-accentSoft
              border
              border-counselor-accentSoft
              rounded-[20px]
              p-3.5
              mb-5
            "
          >
            <View
              className="
                w-10
                h-10
                rounded-[14px]
                bg-counselor-surface
                items-center
                justify-center
              "
            >
              <Ionicons
                name="notifications-outline"
                size={18}
                color={
                  counselorColors.accent
                }
              />
            </View>

            <View className="flex-1 ml-3">
              <Text
                className="
                  text-caption
                  font-extrabold
                  text-counselor-accent
                "
              >
                Action needed
              </Text>

              <Text
                className="
                  text-caption
                  
                  text-counselor-accent
                  mt-0.5
                "
              >
                {organized
                  .approval
                  .length >
                  0
                  ? `${organized.approval.length} request${
                      organized
                        .approval
                        .length ===
                      1
                        ? ""
                        : "s"
                    } awaiting approval`
                  : "No requests awaiting approval"}

                {organized
                  .outcome
                  .length >
                  0
                  ? ` · ${organized.outcome.length} session${
                      organized
                        .outcome
                        .length ===
                      1
                        ? ""
                        : "s"
                    } need an outcome`
                  : ""}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ============================================================ */}
        {/* SUMMARY                                                     */}
        {/* ============================================================ */}

        <View className="flex-row mb-5">
          <View className="flex-1 mr-1.5">
            <SummaryCard
              title="Needs approval"
              value={
                organized
                  .approval
                  .length
              }
              subtitle="Student requests"
              icon="time-outline"
              bg={
                counselorColors.accentSoft
              }
              color={
                counselorColors.accent
              }
            />
          </View>

          <View className="flex-1 ml-1.5">
            <SummaryCard
              title="Upcoming"
              value={
                organized
                  .upcoming
                  .length
              }
              subtitle="Confirmed sessions"
              icon="calendar-outline"
              bg={
                counselorColors.primarySoft
              }
              color={
                counselorColors.primary
              }
            />
          </View>
        </View>

        {/* ============================================================ */}
        {/* NEXT APPOINTMENT                                            */}
        {/* ============================================================ */}

        {nextSession && (
          <>
            <Text
              className="
                text-body-sm
                font-extrabold
                text-counselor-textPrimary
                mb-3
              "
            >
              Next session
            </Text>

            <NextSessionCard
              appointment={
                nextSession
              }
            />
          </>
        )}

        {/* ============================================================ */}
        {/* FILTER TITLE                                                */}
        {/* ============================================================ */}

        <View className="flex-row items-end justify-between mb-3">
          <View>
            <Text
              className="
                text-body
                font-extrabold
                text-counselor-textPrimary
              "
            >
              Appointments
            </Text>

            <Text
              className="
                text-caption
                text-counselor-textSecondary
                mt-0.5
              "
            >
              Focus on what needs
              your attention.
            </Text>
          </View>

          <Text
            className="
              text-caption
              font-semibold
              text-counselor-textSecondary
            "
          >
            {
              appointments.length
            }{" "}
            total
          </Text>
        </View>

        {/* ============================================================ */}
        {/* FILTERS                                                     */}
        {/* ============================================================ */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={{
            paddingRight:
              18,

            paddingBottom:
              4,
          }}
          className="mb-5"
        >
          <FilterButton
            label="Approval"
            count={
              filterCounts.approval
            }
            urgent
            active={
              activeFilter ===
              "approval"
            }
            onPress={() =>
              setActiveFilter(
                "approval"
              )
            }
          />

          <FilterButton
            label="Outcome"
            count={
              filterCounts.outcome
            }
            urgent
            active={
              activeFilter ===
              "outcome"
            }
            onPress={() =>
              setActiveFilter(
                "outcome"
              )
            }
          />

          <FilterButton
            label="Upcoming"
            count={
              filterCounts.upcoming
            }
            active={
              activeFilter ===
              "upcoming"
            }
            onPress={() =>
              setActiveFilter(
                "upcoming"
              )
            }
          />

          <FilterButton
            label="History"
            count={
              filterCounts.history
            }
            active={
              activeFilter ===
              "history"
            }
            onPress={() =>
              setActiveFilter(
                "history"
              )
            }
          />

          <FilterButton
            label="All"
            count={
              filterCounts.all
            }
            active={
              activeFilter ===
              "all"
            }
            onPress={() =>
              setActiveFilter(
                "all"
              )
            }
          />
        </ScrollView>

        {/* ============================================================ */}
        {/* FILTER SECTION HEADER                                       */}
        {/* ============================================================ */}

        {activeFilter ===
          "approval" && (
          <SectionHeader
            title="Needs approval"
            subtitle="Review student appointment requests"
            count={
              organized
                .approval
                .length
            }
            icon="time-outline"
            color={
              counselorColors.accent
            }
            bg={
              counselorColors.accentSoft
            }
          />
        )}

        {activeFilter ===
          "outcome" && (
          <SectionHeader
            title="Needs outcome"
            subtitle="Record completed or missed sessions"
            count={
              organized
                .outcome
                .length
            }
            icon="clipboard-outline"
            color={
              counselorColors.info
            }
            bg={
              counselorColors.infoSoft
            }
          />
        )}

        {activeFilter ===
          "upcoming" && (
          <SectionHeader
            title="Upcoming sessions"
            subtitle="Confirmed appointments ahead"
            count={
              organized
                .upcoming
                .length
            }
            icon="calendar-outline"
            color={
              counselorColors.primary
            }
            bg={
              counselorColors.primarySoft
            }
          />
        )}

        {activeFilter ===
          "history" && (
          <SectionHeader
            title="Session history"
            subtitle="Completed, missed and cancelled appointments"
            count={
              organized
                .history
                .length
            }
            icon="time-outline"
            color={
              counselorColors.textSecondary
            }
            bg={counselorColors.surfaceMuted}
          />
        )}

        {/* ============================================================ */}
        {/* EMPTY                                                       */}
        {/* ============================================================ */}

        {filteredAppointments.length ===
        0 ? (
          <EmptyState
            filter={
              activeFilter
            }
          />
        ) : (
          <>
            {/* ======================================================== */}
            {/* ALL FILTER — GROUPED                                    */}
            {/* ======================================================== */}

            {activeFilter ===
            "all" ? (
              <>
                {organized
                  .approval
                  .length >
                  0 && (
                  <View className="mb-6">
                    <SectionHeader
                      title="Needs approval"
                      subtitle="Waiting for your decision"
                      count={
                        organized
                          .approval
                          .length
                      }
                      icon="time-outline"
                      color={
                        counselorColors.accent
                      }
                      bg={
                        counselorColors.accentSoft
                      }
                    />

                    {organized.approval.map(
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
                          section="approval"
                          delay={
                            index *
                            35
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
                    )}
                  </View>
                )}

                {organized
                  .outcome
                  .length >
                  0 && (
                  <View className="mb-6">
                    <SectionHeader
                      title="Needs outcome"
                      subtitle="Record what happened"
                      count={
                        organized
                          .outcome
                          .length
                      }
                      icon="clipboard-outline"
                      color={
                        counselorColors.info
                      }
                      bg={
                        counselorColors.infoSoft
                      }
                    />

                    {organized.outcome.map(
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
                          section="outcome"
                          delay={
                            index *
                            35
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
                    )}
                  </View>
                )}

                {organized
                  .upcoming
                  .length >
                  0 && (
                  <View className="mb-6">
                    <SectionHeader
                      title="Upcoming"
                      subtitle="Your confirmed future sessions"
                      count={
                        organized
                          .upcoming
                          .length
                      }
                      icon="calendar-outline"
                      color={
                        counselorColors.primary
                      }
                      bg={
                        counselorColors.primarySoft
                      }
                    />

                    {organized.upcoming.map(
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
                          section="upcoming"
                          delay={
                            index *
                            35
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
                    )}
                  </View>
                )}

                {organized
                  .history
                  .length >
                  0 && (
                  <View>
                    <SectionHeader
                      title="History"
                      subtitle="Past and closed appointments"
                      count={
                        organized
                          .history
                          .length
                      }
                      icon="time-outline"
                      color={
                        counselorColors.textSecondary
                      }
                      bg={counselorColors.surfaceMuted}
                    />

                    {organized.history.map(
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
                          section="history"
                          delay={
                            index *
                            35
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
                    )}
                  </View>
                )}
              </>
            ) : (
              /* ====================================================== */
              /* INDIVIDUAL FILTER                                      */
              /* ====================================================== */

              filteredAppointments.map(
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
                    section={
                      activeFilter
                    }
                    delay={
                      40 +
                      index *
                        35
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
          </>
        )}
      </ScrollView>
    </View>
  );
}
