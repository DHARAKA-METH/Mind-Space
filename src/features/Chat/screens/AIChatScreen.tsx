import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
  FadeInDown,
  FadeIn,
  FadeOut,
  Layout,
  ZoomIn,
} from "react-native-reanimated";
import { getAuth } from "firebase/auth";
import {
  calmColors,
  commonColors,
  spacing,
  typography,
} from "@/src/theme";
import {
  getRooms,
  createRoom,
  updateRoom,
  addMessage,
  getMessages,
} from "../services/firebaseChatService";
import {getAiResponseMessage} from "../services/aiCall"

const QUICK_PROMPTS = ["I feel stressed", "Exam anxiety", "Need motivation", "Can't sleep", "Feeling lonely"];

// ─── HELPERS ──────────────────────────────────────────────────────────────
const nowTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ─── SHARED SUB-COMPONENTS ────────────────────────────────────────────────
const Avatar = React.memo(({ emoji, size = 36, online, bg }: any) => (
  <View className="relative">
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg || `${calmColors.primarySoft}22`,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: commonColors.white,
      }}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
    {online !== undefined && (
      <View
        style={{
          position: "absolute",
          bottom: 1,
          right: 1,
          width: 10,
          height: 10,
          borderRadius: 5,
          borderWidth: 2,
          borderColor: commonColors.white,
          backgroundColor: online ? calmColors.primary : calmColors.textMuted,
        }}
      />
    )}
  </View>
));
Avatar.displayName = "Avatar";

// Animated three-dot typing indicator
const TypingDots = () => {
  const d1 = useSharedValue(0.3);
  const d2 = useSharedValue(0.3);
  const d3 = useSharedValue(0.3);

  useEffect(() => {
    const pulse = (v: any, delay: number) => {
      v.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 320, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.3, { duration: 320, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        )
      );
    };
    pulse(d1, 0);
    pulse(d2, 140);
    pulse(d3, 280);
  }, []);

  const s1 = useAnimatedStyle(() => ({ opacity: d1.value, transform: [{ scale: 0.7 + d1.value * 0.3 }] }));
  const s2 = useAnimatedStyle(() => ({ opacity: d2.value, transform: [{ scale: 0.7 + d2.value * 0.3 }] }));
  const s3 = useAnimatedStyle(() => ({ opacity: d3.value, transform: [{ scale: 0.7 + d3.value * 0.3 }] }));

  return (
    <View className="flex-row items-center" style={{ gap: 4 }}>
      {[s1, s2, s3].map((s, i) => (
        <Animated.View key={i} style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: calmColors.primarySoft }, s]} />
      ))}
    </View>
  );
};

const TypingIndicator = () => (
  <Animated.View entering={FadeIn.duration(200)} className="flex-row items-end px-4 pb-3" style={{ gap: 8 }}>
    <Avatar emoji="🌿" size={28} />
    <View style={{ backgroundColor: calmColors.surface, borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 12 }}>
      <TypingDots />
    </View>
  </Animated.View>
);

const MessageBubble = React.memo(({ msg, index }: any) => {
  const isUser = msg.sender === "user";
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 30).duration(280).springify().damping(16)}
      layout={Layout}
      className={`px-4 mb-3 items-end flex-row ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && <Avatar emoji="🌿" size={30} />}
      <View className={`max-w-[72%] mx-2 ${isUser ? "items-end" : "items-start"}`}>
        <View
          style={{
            borderRadius: 18,
            padding: 12,
            backgroundColor: isUser ? calmColors.primary : calmColors.surface,
            borderBottomRightRadius: isUser ? 4 : 18,
            borderBottomLeftRadius: isUser ? 18 : 4,
            shadowColor: commonColors.black,
            shadowOpacity: 0.04,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <Text style={{ fontSize: typography.fontSize.body, color: isUser ? commonColors.white : calmColors.textPrimary, lineHeight: typography.lineHeight.body }}>{msg.text}</Text>
        </View>
        <Text className="mt-1 text-caption text-calm-textMuted">{msg.time}</Text>
      </View>
    </Animated.View>
  );
});
MessageBubble.displayName = "MessageBubble";

const MessageInput = ({ onSend, placeholder = "Type a message..." }: any) => {
  const [text, setText] = useState("");
  const sendScale = useSharedValue(1);
  const sendStyle = useAnimatedStyle(() => ({ transform: [{ scale: sendScale.value }] }));

  const handle = () => {
    if (!text.trim()) return;
    Haptics.selectionAsync().catch(() => {});
    sendScale.value = withSequence(withTiming(0.85, { duration: 90 }), withTiming(1, { duration: 140 }));
    onSend(text.trim());
    setText("");
  };

  return (
    <View
      className="flex-row items-center"
      style={{ backgroundColor: calmColors.surface, padding: spacing.sm, paddingBottom: Platform.OS === "ios" ? spacing.lg : spacing.sm }}
    >
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={calmColors.textMuted}
        multiline
        style={{
          flex: 1,
          paddingHorizontal: spacing.md,
          paddingVertical: 10,
          borderRadius: 24,
          backgroundColor: calmColors.background,
          fontSize: typography.fontSize.body,
          color: calmColors.textPrimary,
          maxHeight: 100,
        }}
      />
      <Animated.View style={[sendStyle, { marginLeft: spacing.xs }]}> 
        <TouchableOpacity
          onPress={handle}
          disabled={!text.trim()}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: text.trim() ? calmColors.primary : calmColors.textMuted,
          }}
          accessibilityLabel="Send AI chat message"
        >
          <Ionicons name="arrow-up" size={18} color={commonColors.white} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const QuickPrompts = ({ onSelect }: any) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, gap: spacing.xs }}
  >
    {QUICK_PROMPTS.map((p) => (
      <TouchableOpacity
        key={p}
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onSelect(p);
        }}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 18,
          backgroundColor: `${calmColors.primarySoft}15`,
          borderWidth: 1,
          borderColor: `${calmColors.primarySoft}40`,
        }}
      >
        <Text className="text-caption font-semibold text-calm-primary">{p}</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

// ─── ACTION SHEET (Rename / Delete / Cancel) ───────────────────────────────
const RoomActionSheet = ({ visible, room, onClose, onRename, onDelete }: any) => {
  if (!room) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: commonColors.scrim, justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Animated.View entering={FadeInDown.duration(220)} onStartShouldSetResponder={() => true}>
          <View
            style={{
              backgroundColor: calmColors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: spacing.md,
              paddingTop: spacing.sm,
              paddingBottom: Platform.OS === "ios" ? spacing.xxl : spacing.md,
            }}
          >
            {/* Grabber */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: calmColors.border,
                alignSelf: "center",
                marginBottom: spacing.md,
              }}
            />
            <Text
              numberOfLines={1}
              style={{ fontSize: typography.fontSize.caption, color: calmColors.textMuted, marginBottom: spacing.sm, textAlign: "center" }}
            >
              {room.title}
            </Text>

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onRename(room);
              }}
              className="flex-row items-center"
              style={{ paddingVertical: spacing.sm, gap: spacing.sm }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: `${calmColors.primarySoft}18`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="pencil-outline" size={17} color={calmColors.primarySoft} />
              </View>
              <Text className="text-body font-semibold text-calm-textPrimary">Rename chat</Text>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: calmColors.background }} />

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onDelete(room);
              }}
              className="flex-row items-center"
              style={{ paddingVertical: spacing.sm, gap: spacing.sm }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: calmColors.errorSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="trash-outline" size={17} color={calmColors.error} />
              </View>
              <Text className="text-body font-semibold text-calm-error">Delete chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={{
                marginTop: spacing.xs,
                paddingVertical: spacing.sm,
                alignItems: "center",
                backgroundColor: calmColors.background,
                borderRadius: 14,
              }}
            >
              <Text className="text-body font-semibold text-calm-textSecondary">Cancel</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

// ─── RENAME MODAL ───────────────────────────────────────────────────────────
const RenameModal = ({ visible, room, onClose, onConfirm }: any) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (room) setValue(room.title);
  }, [room]);

  if (!room) return null;

  const handleConfirm = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onConfirm(room.id, trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: commonColors.scrim, alignItems: "center", justifyContent: "center", padding: spacing.lg }}>
        <Animated.View
          entering={ZoomIn.duration(180)}
          style={{ width: "100%", backgroundColor: calmColors.surface, borderRadius: 22, padding: spacing.md }}
        >
          <Text className="mb-1 text-body-lg font-bold text-calm-textPrimary">Rename chat</Text>
          <Text className="mb-4 text-caption text-calm-textSecondary">
            Give this conversation a name that&aposs easy to find later
          </Text>

          <TextInput
            value={value}
            onChangeText={setValue}
            autoFocus
            placeholder="Conversation name"
            placeholderTextColor={calmColors.textMuted}
            style={{
              borderWidth: 1.5,
              borderColor: calmColors.border,
              borderRadius: 14,
              paddingHorizontal: spacing.sm,
              paddingVertical: 12,
              fontSize: typography.fontSize.body,
              color: calmColors.textPrimary,
              marginBottom: spacing.md,
            }}
            onSubmitEditing={handleConfirm}
            returnKeyType="done"
          />

          <View className="flex-row" style={{ gap: spacing.xs }}>
            <TouchableOpacity
              onPress={onClose}
              style={{ flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: calmColors.background, alignItems: "center" }}
            >
              <Text className="text-body-sm font-semibold text-calm-textSecondary">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!value.trim()}
              style={{
                flex: 1,
                paddingVertical: 13,
                borderRadius: 14,
                backgroundColor: value.trim() ? calmColors.primary : calmColors.textMuted,
                alignItems: "center",
              }}
            >
              <Text className="text-body-sm font-bold text-calm-surface">Save</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ─── DELETE CONFIRM MODAL ───────────────────────────────────────────────────
const DeleteConfirmModal = ({ visible, room, onClose, onConfirm }: any) => {
  if (!room) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: commonColors.scrim, alignItems: "center", justifyContent: "center", padding: spacing.lg }}>
        <Animated.View
          entering={ZoomIn.duration(180)}
          style={{ width: "100%", backgroundColor: calmColors.surface, borderRadius: 22, padding: spacing.md, alignItems: "center" }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: calmColors.errorSoft,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: spacing.sm,
            }}
          >
            <Ionicons name="trash-outline" size={22} color={calmColors.error} />
          </View>
          <Text className="mb-1 text-center text-body-lg font-bold text-calm-textPrimary">
            Delete this conversation?
          </Text>
          <Text className="mb-4 text-center text-caption text-calm-textSecondary">
            &apos{room.title}&apos will be permanently removed. This can&apos t be undone.
          </Text>

          <View className="flex-row w-full" style={{ gap: spacing.xs }}>
            <TouchableOpacity
              onPress={onClose}
              style={{ flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: calmColors.background, alignItems: "center" }}
            >
              <Text className="text-body-sm font-semibold text-calm-textSecondary">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
                onConfirm(room.id);
              }}
              style={{ flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: calmColors.error, alignItems: "center" }}
            >
              <Text className="text-body-sm font-bold text-calm-surface">Delete</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ─── CHAT ROOM LIST ITEM ──────────────────────────────────────────────────
const RoomListItem = ({ room, onPress, onOpenActions }: any) => {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.duration(240)} exiting={FadeOut.duration(200)} layout={Layout} style={style}>
      <TouchableOpacity
        onPress={() => onPress(room)}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          onOpenActions(room);
        }}
        onPressIn={() => (scale.value = withTiming(0.98, { duration: 100 }))}
        onPressOut={() => (scale.value = withTiming(1, { duration: 100 }))}
        activeOpacity={0.8}
        delayLongPress={280}
        className="flex-row items-center"
        style={{ backgroundColor: calmColors.surface, borderRadius: 18, padding: spacing.sm, marginBottom: spacing.xs }}
      >
        <Avatar emoji="🌿" size={46} online />

        <View className="flex-1" style={{ marginLeft: spacing.sm }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1" style={{ gap: 5, marginRight: 8 }}>
              {room.pinned && <Ionicons name="bookmark" size={11} color={calmColors.accent} />}
              <Text numberOfLines={1} className="shrink text-body font-bold text-calm-textPrimary">
                {room.title}
              </Text>
            </View>
            <Text className="text-caption text-calm-textMuted">{room.time}</Text>
          </View>
          <View className="flex-row items-center justify-between" style={{ marginTop: 3 }}>
            <Text numberOfLines={1} className="mr-2 flex-1 text-caption text-calm-textSecondary">
              {room.preview}
            </Text>
            {room.unread > 0 && (
              <View
                style={{
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: calmColors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 5,
                }}
              >
                <Text className="text-caption font-bold text-calm-surface">{room.unread}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Explicit "⋯" affordance — long-press works, but this makes the option discoverable */}
        <TouchableOpacity
          onPress={() => onOpenActions(room)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ paddingLeft: spacing.xs }}
          accessibilityLabel={`Chat options for ${room.title}`}
        >
          <Ionicons name="ellipsis-vertical" size={16} color={calmColors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── CHAT ROOMS LIST SCREEN ────────────────────────────────────────────────
const ChatRoomsList = ({ rooms, onOpenRoom, onNewChat, onOpenActions }: any) => {
  const [search, setSearch] = useState("");
  const filtered = rooms.filter((r: any) => r.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <View className="flex-1 bg-calm-background">
      <View
        style={{
          backgroundColor: calmColors.surface,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.lg,
          paddingBottom: spacing.md,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        <View className="ml-3 flex-row items-center justify-between" style={{ marginBottom: spacing.md }}>
          <View>
            <Text className="text-subtitle font-bold text-calm-textPrimary">AI Chat</Text>
            <Text className="mt-0.5 text-caption text-calm-textSecondary">A calm space, whenever you need it</Text>
          </View>
        </View>

        <View
          className="flex-row items-center"
          style={{ backgroundColor: calmColors.surface, borderRadius: 14, paddingHorizontal: spacing.sm, height: 42 }}
        >
          <Ionicons name="search" size={16} color={calmColors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search conversations"
            placeholderTextColor={calmColors.textMuted}
            style={{ flex: 1, marginLeft: spacing.xs, fontSize: typography.fontSize.bodySmall, color: calmColors.textPrimary }}
          />
        </View>
      </View>

      {filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center" style={{ paddingHorizontal: spacing.lg }}>
          <View
            style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: calmColors.surface, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={26} color={calmColors.primarySoft} />
          </View>
          <Text className="mb-1 text-body font-bold text-calm-textPrimary">
            {search ? "No matches found" : "No conversations yet"}
          </Text>
          <Text className="text-center text-caption text-calm-textSecondary">
            {search ? "Try a different search term" : "Start a new chat whenever you're ready to talk"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => <RoomListItem room={item} onPress={onOpenRoom} onOpenActions={onOpenActions} />}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        onPress={onNewChat}
        activeOpacity={0.85}
        style={{
          position: "absolute",
          bottom: spacing.lg,
          right: spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: calmColors.accent,
          paddingHorizontal: 18,
          paddingVertical: 13,
          borderRadius: 26,
          shadowColor: commonColors.black,
          shadowOpacity: 0.15,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        <Ionicons name="add-circle" size={18} color={commonColors.white} />
        <Text className="text-body-sm font-bold text-calm-surface">New chat</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── INDIVIDUAL CHAT SCREEN ────────────────────────────────────────────────
const ChatRoomScreen = ({ room, onBack, onOpenActions, userId }: any) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [typing, setTyping] = useState(false);
  const flatListRef = useRef<any>(null);

  useEffect(() => {
    if (!userId || !room.id) return;
    getMessages(userId, room.id).then(setMessages).catch(console.error);
  }, [room.id, userId]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!userId) return;
      const userMsg = { sender: "user", text, time: nowTime() };
      const saved = await addMessage(userId, room.id, userMsg);
      setMessages((prev) => [...prev, saved]);
      const AiResponseMessage = await getAiResponseMessage(userId, room.id);
      console.log("AI Response Message *********", AiResponseMessage);

    
      

      setTyping(true);
      setTimeout(async () => {
        const aiMsg = {
          sender: "ai",
          text: AiResponseMessage,
          time: nowTime(),
        };
        const savedAi = await addMessage(userId, room.id, aiMsg);
        setTyping(false);
        setMessages((prev) => [...prev, savedAi]);
      }, 1800);
    },
    [userId, room.id]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: calmColors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        className="flex-row items-center"
        style={{ backgroundColor: calmColors.surface, padding: spacing.sm, paddingTop: Platform.OS === "ios" ? spacing.lg : spacing.sm, gap: spacing.sm }}
      >
        <TouchableOpacity onPress={onBack} style={{ padding: 4 }} accessibilityLabel="Back to AI chats">
          <Ionicons name="chevron-back" size={22} color={calmColors.textPrimary} />
        </TouchableOpacity>
        <Avatar emoji="🌿" size={38} online />
        <View className="flex-1">
          <Text numberOfLines={1} className="text-body font-bold text-calm-textPrimary">
            {room.title}
          </Text>
          <View className="flex-row items-center" style={{ gap: 5, marginTop: 1 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: calmColors.primary }} />
            <Text className="text-caption font-semibold text-calm-primary">Online & ready to help</Text>
          </View>
        </View>
        {/* Tapping this opens the same Rename/Delete sheet as the list */}
        <TouchableOpacity onPress={() => onOpenActions(room)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Chat options">
          <Ionicons name="ellipsis-horizontal" size={20} color={calmColors.textMuted} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <MessageBubble msg={item} index={index} />}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: spacing.sm }}
        ListFooterComponent={typing ? <TypingIndicator /> : null}
        showsVerticalScrollIndicator={false}
      />

      <View style={{ backgroundColor: calmColors.surface }}>
        <QuickPrompts onSelect={handleSend} />
        <MessageInput onSend={handleSend} />
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── ROOT FEATURE (list ↔ chat) ────────────────────────────────────────────
const AIChatFeature = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;
    getRooms(userId).then(setRooms).catch(console.error);
  }, [userId]);

  // Action-sheet / modal state
  const [actionsRoom, setActionsRoom] = useState<any>(null);
  const [renameRoom, setRenameRoom] = useState<any>(null);
  const [deleteRoom, setDeleteRoom] = useState<any>(null);

  const activeRoom = rooms.find((r) => r.id === activeRoomId);

  const handleOpenRoom = async (room: any) => {
    Haptics.selectionAsync().catch(() => {});
    if (userId) {
      await updateRoom(userId, room.id, { unread: 0 }).catch(() => {});
    }
    setRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, unread: 0 } : r)));
    setActiveRoomId(room.id);
  };

  const handleNewChat = async () => {
    if (!userId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const roomId = await createRoom(userId).catch(() => null);
    if (!roomId) return;
    const updatedRooms = await getRooms(userId).catch(() => []);
    setRooms(updatedRooms);
    setActiveRoomId(roomId);
  };

  // ── Action sheet flow ──
  const openActions = (room: any) => setActionsRoom(room);
  const closeActions = () => setActionsRoom(null);

  const startRename = (room: any) => {
    setActionsRoom(null);
    setRenameRoom(room);
  };
  const confirmRename = async (roomId: string, newTitle: string) => {
    if (userId) {
      await updateRoom(userId, roomId, { title: newTitle }).catch(() => {});
    }
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, title: newTitle } : r)));
    setRenameRoom(null);
  };

  const startDelete = (room: any) => {
    setActionsRoom(null);
    setDeleteRoom(room);
  };
  const confirmDelete = async (roomId: string) => {
    if (userId) {
      await deleteRoom(userId, roomId).catch(() => {});
    }
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    setDeleteRoom(null);
    if (activeRoomId === roomId) setActiveRoomId(null);
  };

  return (
    <>
      {activeRoom ? (
        <ChatRoomScreen
          room={activeRoom}
          onBack={() => setActiveRoomId(null)}
          onOpenActions={openActions}
          userId={userId}
        />
      ) : (
        <ChatRoomsList rooms={rooms} onOpenRoom={handleOpenRoom} onNewChat={handleNewChat} onOpenActions={openActions} />
      )}

      <RoomActionSheet visible={!!actionsRoom} room={actionsRoom} onClose={closeActions} onRename={startRename} onDelete={startDelete} />

      <RenameModal visible={!!renameRoom} room={renameRoom} onClose={() => setRenameRoom(null)} onConfirm={confirmRename} />

      <DeleteConfirmModal visible={!!deleteRoom} room={deleteRoom} onClose={() => setDeleteRoom(null)} onConfirm={confirmDelete} />
    </>
  );
};

export default AIChatFeature;
