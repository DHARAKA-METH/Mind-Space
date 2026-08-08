import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";

import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  getAuth,
} from "firebase/auth";

import * as Haptics from "expo-haptics";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  FadeInDown,
  FadeIn,
  Layout,
} from "react-native-reanimated";

import {
  subscribeConversations,
  subscribeMessages,
  sendMessage,
  markConversationRead,
  ConversationStudent,
  MessageData,
} from "../services/counselorService";

import {
  commonColors,
  counselorColors,
  spacing,
  typography,
} from "@/src/theme";

/* -------------------------------------------------------------------------- */
/*                            MESSAGE TIME                                    */
/* -------------------------------------------------------------------------- */

const formatMsgTime = (
  timestamp: any
) => {
  if (!timestamp) {
    return "";
  }

  const date =
    timestamp?.toDate
      ? timestamp.toDate()
      : new Date(
          timestamp
        );

  return date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute:
        "2-digit",
    }
  );
};

/* -------------------------------------------------------------------------- */
/*                           STRESS COLORS                                    */
/* -------------------------------------------------------------------------- */

const getStressStyle = (
  stress: number
) => {
  if (stress >= 8) {
    return {
      color:
        counselorColors.error,

      bg:
        counselorColors.errorSoft,
    };
  }

  if (stress >= 5) {
    return {
      color:
        counselorColors.warning,

      bg:
        counselorColors.warningSoft,
    };
  }

  return {
    color:
      counselorColors.primary,

    bg:
      counselorColors.primarySoft,
  };
};

/* -------------------------------------------------------------------------- */
/*                               STUDENT CARD                                 */
/* -------------------------------------------------------------------------- */

const StudentCard =
  React.memo(
    ({
      student,
      onChat,
      index,
    }: {
      student:
        ConversationStudent;

      onChat: (
        student:
          ConversationStudent
      ) => void;

      index:
        number;
    }) => {
      const stressStyle =
        getStressStyle(
          student.stressLevel
        );

      return (
        <Animated.View
          entering={FadeInDown
            .delay(
              index * 40
            )
            .duration(
              240
            )}
        >
          <TouchableOpacity
            activeOpacity={
              0.84
            }
            onPress={() => {
              Haptics
                .selectionAsync()
                .catch(
                  () => {}
                );

              onChat(
                student
              );
            }}
            className="
              bg-counselor-surface
              rounded-[22px]
              p-4
              mx-screen
              my-1.5
              border
              border-counselor-border
            "
          >
            <View className="flex-row items-start">
              {/* ---------------------------------------------------- */}
              {/* AVATAR                                               */}
              {/* ---------------------------------------------------- */}

              <View className="relative">
                <View
                  className="
                    w-[52px]
                    h-[52px]
                    rounded-[18px]
                    bg-counselor-accentSoft
                    items-center
                    justify-center
                    border-2
                    border-white
                  "
                >
                  <Text className="text-[25px]">
                    {
                      student.emoji
                    }
                  </Text>
                </View>

                {student.online !==
                  undefined && (
                  <View
                    className="
                      absolute
                      bottom-0
                      right-0
                      w-3.5
                      h-3.5
                      rounded-full
                      border-2
                      border-white
                    "
                    style={{
                      backgroundColor:
                        student.online
                          ? counselorColors.success
                          : counselorColors.textMuted,
                    }}
                  />
                )}
              </View>

              {/* ---------------------------------------------------- */}
              {/* INFORMATION                                          */}
              {/* ---------------------------------------------------- */}

              <View className="flex-1 ml-3">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <Text
                      numberOfLines={
                        1
                      }
                      className="
                        text-body-sm
                        font-extrabold
                        text-counselor-textPrimary
                      "
                    >
                      {
                        student.anonymousId
                      }
                    </Text>

                    <Text
                      numberOfLines={
                        1
                      }
                      className="
                        mt-0.5
                        text-caption
                        font-semibold
                        text-counselor-primary
                      "
                    >
                      {
                        student.concern
                      }
                    </Text>
                  </View>

                  <View
                    className={`
                      px-2
                      py-1
                      rounded-full

                      ${
                        student.online
                          ? "bg-counselor-successSoft"
                          : "bg-counselor-surfaceMuted"
                      }
                    `}
                  >
                    <Text
                      className={`
                        text-caption
                        font-bold

                        ${
                          student.online
                            ? "text-counselor-success"
                            : "text-counselor-textMuted"
                        }
                      `}
                    >
                      {student.online
                        ? "● Online"
                        : "Away"}
                    </Text>
                  </View>
                </View>

                <Text
                  numberOfLines={
                    2
                  }
                  className="
                    text-caption
                    
                    mt-2
                    text-counselor-textSecondary
                  "
                >
                  {student.lastMessage ||
                    student.concern}
                </Text>

                {/* ------------------------------------------------ */}
                {/* META                                             */}
                {/* ------------------------------------------------ */}

                <View className="flex-row flex-wrap gap-1.5 mt-2.5">
                  <View
                    className="
                      px-2.5
                      py-1
                      rounded-full
                    "
                    style={{
                      backgroundColor:
                        stressStyle.bg,
                    }}
                  >
                    <Text
                      className="
                        text-caption
                        font-bold
                      "
                      style={{
                        color:
                          stressStyle.color,
                      }}
                    >
                      Stress{" "}
                      {
                        student.stressLevel
                      }
                      /10
                    </Text>
                  </View>

                  <View
                    className="
                      px-2.5
                      py-1
                      rounded-full
                      bg-counselor-surfaceMuted
                    "
                  >
                    <Text
                      className="
                        text-caption
                        text-counselor-textSecondary
                      "
                    >
                      {
                        student.lastActive
                      }
                    </Text>
                  </View>

                  {student.unread >
                    0 && (
                    <View
                      className="
                        px-2.5
                        py-1
                        rounded-full
                        bg-counselor-errorSoft
                      "
                    >
                      <Text
                        className="
                          text-caption
                          font-extrabold
                          text-counselor-error
                        "
                      >
                        {
                          student.unread
                        }{" "}
                        new
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* ------------------------------------------------------ */}
            {/* OPEN CHAT                                              */}
            {/* ------------------------------------------------------ */}

            <View
              className="
                mt-3
                h-10
                rounded-[14px]
                bg-counselor-primarySoft
                flex-row
                items-center
                justify-center
              "
            >
              <Ionicons
                name="chatbubble-outline"
                size={14}
                color={
                  counselorColors.primary
                }
              />

              <Text
                className="
                  ml-1.5
                  text-caption
                  font-bold
                  text-counselor-primary
                "
              >
                Open conversation
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    }
  );

StudentCard.displayName =
  "StudentCard";

/* -------------------------------------------------------------------------- */
/*                             CHAT WALLPAPER                                 */
/* -------------------------------------------------------------------------- */

const ChatWallpaper = () => {
  const rows = 7;
  const columns = 5;

  return (
    <View
      pointerEvents="none"
      className="
        absolute
        top-0
        bottom-0
        left-0
        right-0
      "
    >
      {Array.from({
        length: rows,
      }).map(
        (_, row) => (
          <View
            key={`wall-row-${row}`}
            className="
              flex-row
              justify-around
            "
            style={{
              marginTop:
                row === 0
                  ? 24
                  : 36,
            }}
          >
            {Array.from({
              length:
                columns,
            }).map(
              (
                _,
                column
              ) => (
                <Ionicons
                  key={`wall-${row}-${column}`}
                  name="chatbubble-ellipses-outline"
                  size={14}
                  color={
                    counselorColors.primary
                  }
                  style={{
                    opacity:
                      (row +
                        column) %
                        3 ===
                      0
                        ? 0.055
                        : 0.025,

                    transform: [
                      {
                        rotate: `${
                          (row +
                            column) *
                          14
                        }deg`,
                      },
                    ],
                  }}
                />
              )
            )}
          </View>
        )
      )}
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                             MESSAGE BUBBLE                                 */
/* -------------------------------------------------------------------------- */

const MessageBubble =
  React.memo(
    ({
      item,
      student,
      index,
    }: {
      item:
        MessageData;

      student:
        ConversationStudent;

      index:
        number;
    }) => {
      const fromCounselor =
        item.senderRole ===
        "counselor";

      return (
        <Animated.View
          entering={FadeInDown
            .delay(
              Math.min(
                index,
                8
              ) * 20
            )
            .duration(
              220
            )}
          layout={Layout}
          className={`
            px-4
            mb-3
            items-end
            flex-row

            ${
              fromCounselor
                ? "flex-row-reverse"
                : "flex-row"
            }
          `}
        >
          {!fromCounselor && (
            <View
              className="
                w-8
                h-8
                rounded-[12px]
                bg-counselor-accentSoft
                items-center
                justify-center
              "
            >
              <Text className="text-[15px]">
                {
                  student.emoji
                }
              </Text>
            </View>
          )}

          <View
            className={`
              max-w-[76%]
              mx-2

              ${
                fromCounselor
                  ? "items-end"
                  : "items-start"
              }
            `}
          >
            <View
              className={`
                px-3.5
                py-3
                border

                ${
                  fromCounselor
                    ? "bg-counselor-primary border-counselor-primary rounded-[19px] rounded-br-[6px]"
                    : "bg-counselor-surface border-counselor-border rounded-[19px] rounded-bl-[6px]"
                }
              `}
            >
              <Text
                className={`
                  text-body-sm
                  

                  ${
                    fromCounselor
                      ? "text-white"
                      : "text-counselor-textPrimary"
                  }
                `}
              >
                {
                  item.text
                }
              </Text>
            </View>

            <Text
              className="
                text-caption
                text-counselor-textMuted
                mt-1
              "
            >
              {formatMsgTime(
                item.createdAt
              )}
            </Text>
          </View>
        </Animated.View>
      );
    }
  );

MessageBubble.displayName =
  "MessageBubble";

/* -------------------------------------------------------------------------- */
/*                         COUNSELOR CHAT ROOM                                */
/* -------------------------------------------------------------------------- */

const CounselorStudentChatRoom =
  ({
    student,
    onBack,
  }: {
    student:
      ConversationStudent;

    onBack:
      () => void;
  }) => {
    const [
      messages,
      setMessages,
    ] =
      useState<
        MessageData[]
      >([]);

    const [
      text,
      setText,
    ] = useState("");

    const flatListRef =
      useRef<any>(
        null
      );

    const uid =
      getAuth()
        .currentUser
        ?.uid || "";

    const insets =
      useSafeAreaInsets();

    const sendScale =
      useSharedValue(
        1
      );

    const sendStyle =
      useAnimatedStyle(
        () => ({
          transform: [
            {
              scale:
                sendScale.value,
            },
          ],
        })
      );

    const stressStyle =
      getStressStyle(
        student.stressLevel
      );

    /* ---------------------------------------------------------------------- */
    /* SUBSCRIBE                                                              */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
      const unsubscribe =
        subscribeMessages(
          student.conversationId,
          setMessages
        );

      markConversationRead(
        student.conversationId
      );

      return unsubscribe;
    }, [
      student.conversationId,
    ]);

    /* ---------------------------------------------------------------------- */
    /* SEND                                                                   */
    /* ---------------------------------------------------------------------- */

    const handleSend =
      () => {
        const cleanText =
          text.trim();

        if (
          !cleanText ||
          !uid
        ) {
          return;
        }

        Haptics
          .selectionAsync()
          .catch(
            () => {}
          );

        sendScale.value =
          withSequence(
            withTiming(
              0.85,
              {
                duration:
                  90,
              }
            ),

            withTiming(
              1,
              {
                duration:
                  140,
              }
            )
          );

        sendMessage(
          student.conversationId,
          uid,
          cleanText
        );

        setText("");
      };

    return (
      <View
        className="
          flex-1
          bg-counselor-background
        "
      >
        {/* ============================================================ */}
        {/* CHAT HEADER                                                  */}
        {/* ============================================================ */}

        <View
          className="
            bg-counselor-surface
            border-b
            border-counselor-border
            px-4
            pb-3
          "
          style={{
            paddingTop:
              insets.top +
              8,
          }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              activeOpacity={
                0.7
              }
              accessibilityRole="button"
              accessibilityLabel="Back to conversations"
              onPress={
                onBack
              }
              className="
                w-10
                h-10
                rounded-[14px]
                bg-counselor-surfaceMuted
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

            <View
              className="
                w-10
                h-10
                rounded-[14px]
                bg-counselor-accentSoft
                items-center
                justify-center
              "
            >
              <Text className="text-[19px]">
                {
                  student.emoji
                }
              </Text>
            </View>

            <View className="flex-1 ml-3">
              <Text
                className="
                  text-body-sm
                  font-extrabold
                  text-counselor-textPrimary
                "
              >
                {
                  student.anonymousId
                }
              </Text>

              <Text
                className="
                  text-caption
                  font-semibold
                  mt-0.5
                "
                style={{
                  color:
                    stressStyle.color,
                }}
              >
                Stress{" "}
                {
                  student.stressLevel
                }
                /10 ·{" "}
                {
                  student.lastActive
                }
              </Text>
            </View>

            <View
              className="
                px-2.5
                py-1.5
                rounded-full
                bg-counselor-primarySoft
              "
            >
              <Text
                className="
                  text-caption
                  font-bold
                  text-counselor-primary
                "
              >
                Anonymous
              </Text>
            </View>
          </View>
        </View>

        {/* ============================================================ */}
        {/* CHAT BODY                                                    */}
        {/* ============================================================ */}

        <KeyboardAvoidingView
          className="flex-1"
          behavior={
            Platform.OS ===
            "ios"
              ? "padding"
              : "height"
          }
        >
          <View className="flex-1">
            <ChatWallpaper />

            <FlatList
              ref={
                flatListRef
              }
              data={
                messages
              }
              keyExtractor={(
                item
              ) => item.id}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd(
                  {
                    animated:
                      true,
                  }
                )
              }
              onLayout={() =>
                flatListRef.current?.scrollToEnd(
                  {
                    animated:
                      true,
                  }
                )
              }
              showsVerticalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingBottom:
                  spacing.md,
              }}
              ListHeaderComponent={() => (
                <>
                  {/* ------------------------------------------------ */}
                  {/* PRIVACY                                        */}
                  {/* ------------------------------------------------ */}

                  <View className="px-4 pt-4">
                    <Animated.View
                      entering={FadeIn.duration(
                        230
                      )}
                      className="
                        flex-row
                        items-center
                        p-3.5
                        rounded-[18px]
                        bg-counselor-primarySoft
                        border
                        border-counselor-primarySoft
                        mb-3
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
                          mr-3
                        "
                      >
                        <Ionicons
                          name="lock-closed-outline"
                          size={
                            16
                          }
                          color={
                            counselorColors.primary
                          }
                        />
                      </View>

                      <View className="flex-1">
                        <Text
                          className="
                            text-caption
                            font-extrabold
                            text-counselor-primaryDark
                          "
                        >
                          IDENTITY
                          PROTECTED
                        </Text>

                        <Text
                          className="
                            text-caption
                            
                            mt-0.5
                            text-counselor-textSecondary
                          "
                        >
                          This
                          conversation
                          is
                          confidential.
                          The
                          student&apos;s
                          identity
                          remains
                          anonymous.
                        </Text>
                      </View>
                    </Animated.View>
                  </View>

                  {/* ------------------------------------------------ */}
                  {/* ROLE INFORMATION                                 */}
                  {/* ------------------------------------------------ */}

                  <View className="flex-row px-4 gap-2.5 pb-4">
                    <View
                      className="
                        flex-1
                        rounded-[16px]
                        bg-counselor-primarySoft
                        p-3
                      "
                    >
                      <Text
                        className="
                          text-caption
                          font-bold
                          text-counselor-textSecondary
                          uppercase
                        "
                      >
                        You
                      </Text>

                      <Text
                        className="
                          text-caption
                          font-extrabold
                          text-counselor-primary
                          mt-0.5
                        "
                      >
                        Counselor
                      </Text>

                      <Text
                        className="
                          text-caption
                          text-counselor-success
                          mt-0.5
                        "
                      >
                        Visible to
                        student
                      </Text>
                    </View>

                    <View
                      className="
                        flex-1
                        rounded-[16px]
                        bg-counselor-accentSoft
                        p-3
                      "
                    >
                      <Text
                        className="
                          text-caption
                          font-bold
                          text-counselor-textSecondary
                          uppercase
                        "
                      >
                        Student
                      </Text>

                      <Text
                        numberOfLines={
                          1
                        }
                        className="
                          text-caption
                          font-extrabold
                          text-counselor-accent
                          mt-0.5
                        "
                      >
                        {
                          student.anonymousId
                        }
                      </Text>

                      <Text
                        className="
                          text-caption
                          text-counselor-accent
                          mt-0.5
                        "
                      >
                        Identity
                        protected
                      </Text>
                    </View>
                  </View>
                </>
              )}
              ListEmptyComponent={() => (
                <View
                  className="
                    items-center
                    justify-center
                    py-16
                    px-8
                  "
                >
                  <View
                    className="
                      w-14
                      h-14
                      rounded-[20px]
                      bg-counselor-primarySoft
                      items-center
                      justify-center
                    "
                  >
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={
                        24
                      }
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
                      text-center
                      mt-3
                    "
                  >
                    No messages
                    yet. Start the
                    conversation
                    below.
                  </Text>
                </View>
              )}
              renderItem={({
                item,
                index,
              }: {
                item:
                  MessageData;

                index:
                  number;
              }) => (
                <MessageBubble
                  item={
                    item
                  }
                  student={
                    student
                  }
                  index={
                    index
                  }
                />
              )}
            />
          </View>

          {/* ========================================================== */}
          {/* INPUT                                                      */}
          {/* ========================================================== */}

          <View
            className="
              bg-counselor-background
              px-3
              pt-2
            "
            style={{
              paddingBottom:
                Math.max(
                  insets.bottom,
                  10
                ),
            }}
          >
            <View
              className="
                flex-row
                items-end
                bg-counselor-surface
                border
                border-counselor-border
                rounded-[24px]
                p-1.5
              "
              style={{
                shadowColor:
                  counselorColors.textPrimary,

                shadowOpacity:
                  0.05,

                shadowRadius:
                  10,

                shadowOffset: {
                  width:
                    0,

                  height:
                    3,
                },

                elevation:
                  2,
              }}
            >
              <TextInput
                value={
                  text
                }
                onChangeText={
                  setText
                }
                placeholder={`Message ${student.anonymousId}...`}
                placeholderTextColor={
                  counselorColors.textMuted
                }
                multiline
                className="
                  flex-1
                  px-3
                  py-2.5
                  rounded-[18px]
                  bg-counselor-surfaceMuted
                  text-body-sm
                  text-counselor-textPrimary
                "
                style={{
                  maxHeight:
                    100,
                  lineHeight:
                    typography.lineHeight.bodySmall,
                }}
              />

              <Animated.View
                style={[
                  sendStyle,
                  {
                    marginLeft:
                      6,
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={
                    0.8
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Send message"
                  onPress={
                    handleSend
                  }
                  disabled={
                    !text.trim()
                  }
                  className={`
                    w-11
                    h-11
                    rounded-[17px]
                    items-center
                    justify-center

                    ${
                      text.trim()
                        ? "bg-counselor-primary"
                        : "bg-counselor-border"
                    }
                  `}
                >
                  <Ionicons
                    name="arrow-up"
                    size={17}
                    color={commonColors.white}
                  />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  };

/* -------------------------------------------------------------------------- */
/*                            CHAT LIST SCREEN                                */
/* -------------------------------------------------------------------------- */

export default function ChatScreen({
  openConversationId,
  onBackToBoard,
  onConversationStateChange,
}: {
  openConversationId?:
    string;

  onBackToBoard?:
    () => void;

  onConversationStateChange?:
    (
      open:
        boolean
    ) => void;
}) {
  const [
    students,
    setStudents,
  ] =
    useState<
      ConversationStudent[]
    >([]);

  const [
    activeStudent,
    setActiveStudent,
  ] =
    useState<
      ConversationStudent | null
    >(null);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const uid =
    getAuth()
      .currentUser?.uid;

  /* ------------------------------------------------------------------------ */
  /*                            CONVERSATIONS                                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!uid) {
      return;
    }

    const unsubscribe =
      subscribeConversations(
        uid,
        setStudents
      );

    return unsubscribe;
  }, [uid]);

  /* ------------------------------------------------------------------------ */
  /*                          OPEN FROM ALERT                                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (
      openConversationId &&
      !activeStudent
    ) {
      const found =
        students.find(
          (student) =>
            student.conversationId ===
            openConversationId
        );

      if (found) {
        setActiveStudent(
          found
        );
      }
    }
  }, [
    openConversationId,
    students,
    activeStudent,
  ]);

  /* ------------------------------------------------------------------------ */
  /*                    INFORM DASHBOARD CHAT OPEN                            */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    onConversationStateChange?.(
      !!activeStudent
    );
  }, [
    activeStudent,
    onConversationStateChange,
  ]);

  /* ------------------------------------------------------------------------ */
  /*                            FILTER / SORT                                 */
  /* ------------------------------------------------------------------------ */

  const visibleStudents =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      return [
        ...students,
      ]
        .filter(
          (student) => {
            if (
              !query
            ) {
              return true;
            }

            return (
              student.anonymousId
                ?.toLowerCase()
                .includes(
                  query
                ) ||
              student.concern
                ?.toLowerCase()
                .includes(
                  query
                ) ||
              student.lastMessage
                ?.toLowerCase()
                .includes(
                  query
                )
            );
          }
        )
        .sort(
          (a, b) =>
            b.stressLevel -
            a.stressLevel
        );
    }, [
      students,
      searchQuery,
    ]);

  const onlineCount =
    students.filter(
      (student) =>
        student.online
    ).length;

  const unreadCount =
    students.reduce(
      (
        total,
        student
      ) =>
        total +
        (student.unread ||
          0),
      0
    );

  /* ------------------------------------------------------------------------ */
  /*                            ACTIVE ROOM                                   */
  /* ------------------------------------------------------------------------ */

  if (activeStudent) {
    return (
      <CounselorStudentChatRoom
        student={
          activeStudent
        }
        onBack={() =>
          setActiveStudent(
            null
          )
        }
      />
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                                LIST                                      */
  /* ------------------------------------------------------------------------ */

  return (
    <View
      className="
        flex-1
        bg-counselor-background
      "
    >
      {/* ================================================================ */}
      {/* INTRO                                                            */}
      {/* ================================================================ */}

      <View
        className="
          px-screen
          pt-3
          pb-4
        "
      >
        <View className="flex-row items-center">
          {onBackToBoard && (
            <TouchableOpacity
              activeOpacity={
                0.7
              }
              accessibilityRole="button"
              accessibilityLabel="Back to dashboard"
              onPress={
                onBackToBoard
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

          <View
            className="
              w-11
              h-11
              rounded-[16px]
              bg-counselor-primarySoft
              items-center
              justify-center
            "
          >
            <Ionicons
              name="chatbubbles-outline"
              size={20}
              color={
                counselorColors.primary
              }
            />
          </View>

          <View className="ml-3 flex-1">
            <Text
              className="
                text-body
                font-extrabold
                text-counselor-textPrimary
              "
            >
              Student
              conversations
            </Text>

            <Text
              className="
                text-caption
                text-counselor-textSecondary
                mt-0.5
              "
            >
              High-stress
              conversations are
              shown first
            </Text>
          </View>
        </View>

        {/* ------------------------------------------------------------ */}
        {/* STATS                                                        */}
        {/* ------------------------------------------------------------ */}

        <View className="flex-row gap-2.5 mt-4">
          <View
            className="
              flex-1
              flex-row
              items-center
              bg-counselor-successSoft
              rounded-[15px]
              px-3
              py-2.5
            "
          >
            <View
              className="
                w-2
                h-2
                rounded-full
                bg-counselor-success
                mr-2
              "
            />

            <Text
              className="
                text-caption
                font-semibold
                text-counselor-success
              "
            >
              {
                onlineCount
              }{" "}
              online
            </Text>
          </View>

          <View
            className="
              flex-1
              flex-row
              items-center
              bg-counselor-accentSoft
              rounded-[15px]
              px-3
              py-2.5
            "
          >
            <Ionicons
              name="mail-unread-outline"
              size={13}
              color={
                counselorColors.accent
              }
            />

            <Text
              className="
                ml-1.5
                text-caption
                font-semibold
                text-counselor-accent
              "
            >
              {
                unreadCount
              }{" "}
              unread
            </Text>
          </View>
        </View>

        {/* ------------------------------------------------------------ */}
        {/* SEARCH                                                       */}
        {/* ------------------------------------------------------------ */}

        <View
          className="
            h-12
            flex-row
            items-center
            bg-counselor-surface
            border
            border-counselor-border
            rounded-[17px]
            px-4
            mt-3
          "
        >
          <Ionicons
            name="search-outline"
            size={16}
            color={
              counselorColors.textMuted
            }
          />

          <TextInput
            value={
              searchQuery
            }
            onChangeText={
              setSearchQuery
            }
            placeholder="Search student or concern"
            placeholderTextColor={
              counselorColors.textMuted
            }
            className="
              flex-1
              ml-2
              p-0
              text-caption
              text-counselor-textPrimary
            "
          />

          {searchQuery !==
            "" && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() =>
                setSearchQuery(
                  ""
                )
              }
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={
                  counselorColors.textMuted
                }
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ================================================================ */}
      {/* LIST                                                             */}
      {/* ================================================================ */}

      {visibleStudents.length ===
      0 ? (
        <View
          className="
            flex-1
            items-center
            justify-center
            px-8
            pb-20
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
            "
          >
            <Ionicons
              name="chatbubbles-outline"
              size={27}
              color={
                counselorColors.primary
              }
            />
          </View>

          <Text
            className="
              text-body-sm
              font-bold
              text-counselor-textPrimary
              mt-3
            "
          >
            {searchQuery
              ? "No matching conversations"
              : "No conversations yet"}
          </Text>

          <Text
            className="
              text-caption
              
              text-counselor-textSecondary
              text-center
              mt-1
              max-w-[260px]
            "
          >
            {searchQuery
              ? "Try a different search term."
              : "When a student starts an anonymous chat, it will appear here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={
            visibleStudents
          }
          keyExtractor={(
            item
          ) =>
            item.conversationId
          }
          contentContainerStyle={{
            paddingTop:
              4,

            paddingBottom:
              110,
          }}
          showsVerticalScrollIndicator={
            false
          }
          renderItem={({
            item,
            index,
          }) => (
            <StudentCard
              student={
                item
              }
              onChat={
                setActiveStudent
              }
              index={
                index
              }
            />
          )}
        />
      )}
    </View>
  );
}
