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
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  addMessage,
  getMessages,
} from "../services/firebaseChatService";
import {getAiResponseMessage} from "../services/aiCall"

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
};

const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

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
        backgroundColor: bg || `${ceylon.sage}22`,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#fff",
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
          borderColor: "#fff",
          backgroundColor: online ? ceylon.teaGreen : ceylon.mutedLight,
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
        <Animated.View key={i} style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: ceylon.sage }, s]} />
      ))}
    </View>
  );
};

const TypingIndicator = () => (
  <Animated.View entering={FadeIn.duration(200)} className="flex-row items-end px-4 pb-3" style={{ gap: 8 }}>
    <Avatar emoji="🌿" size={28} />
    <View style={{ backgroundColor: "#fff", borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 12 }}>
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
            backgroundColor: isUser ? ceylon.teaGreen : "#fff",
            borderBottomRightRadius: isUser ? 4 : 18,
            borderBottomLeftRadius: isUser ? 18 : 4,
            shadowColor: "#000",
            shadowOpacity: 0.04,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <Text style={{ fontSize: 13.5, color: isUser ? "#fff" : ceylon.ink, lineHeight: 19 }}>{msg.text}</Text>
        </View>
        <Text style={{ fontSize: 10, color: ceylon.mutedLight, marginTop: 4 }}>{msg.time}</Text>
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
      style={{ backgroundColor: "#fff", padding: SPACE.md, paddingBottom: Platform.OS === "ios" ? SPACE.xl : SPACE.md }}
    >
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={ceylon.mutedLight}
        multiline
        style={{
          flex: 1,
          paddingHorizontal: SPACE.lg,
          paddingVertical: 10,
          borderRadius: 24,
          backgroundColor: ceylon.background,
          fontSize: 13.5,
          color: ceylon.ink,
          maxHeight: 100,
        }}
      />
      <Animated.View style={[sendStyle, { marginLeft: SPACE.sm }]}>
        <TouchableOpacity
          onPress={handle}
          disabled={!text.trim()}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: text.trim() ? ceylon.teaGreen : ceylon.mutedLight,
          }}
        >
          <Ionicons name="arrow-up" size={18} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const QuickPrompts = ({ onSelect }: any) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ paddingHorizontal: SPACE.lg, paddingVertical: SPACE.sm, gap: SPACE.sm }}
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
          backgroundColor: `${ceylon.sage}15`,
          borderWidth: 1,
          borderColor: `${ceylon.sage}40`,
        }}
      >
        <Text style={{ color: ceylon.teaGreen, fontSize: 12, fontWeight: "600" }}>{p}</Text>
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
        style={{ flex: 1, backgroundColor: "rgba(61,46,31,0.35)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Animated.View entering={FadeInDown.duration(220)} onStartShouldSetResponder={() => true}>
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: SPACE.lg,
              paddingTop: SPACE.md,
              paddingBottom: Platform.OS === "ios" ? SPACE.xxl : SPACE.lg,
            }}
          >
            {/* Grabber */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: ceylon.sand,
                alignSelf: "center",
                marginBottom: SPACE.lg,
              }}
            />
            <Text
              numberOfLines={1}
              style={{ fontSize: 12, color: ceylon.mutedLight, marginBottom: SPACE.md, textAlign: "center" }}
            >
              {room.title}
            </Text>

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onRename(room);
              }}
              className="flex-row items-center"
              style={{ paddingVertical: SPACE.md, gap: SPACE.md }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: `${ceylon.sage}18`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="pencil-outline" size={17} color={ceylon.sage} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: "600", color: ceylon.ink }}>Rename chat</Text>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: ceylon.background }} />

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onDelete(room);
              }}
              className="flex-row items-center"
              style={{ paddingVertical: SPACE.md, gap: SPACE.md }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#F7DDD6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="trash-outline" size={17} color={ceylon.danger} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: "600", color: ceylon.danger }}>Delete chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={{
                marginTop: SPACE.sm,
                paddingVertical: SPACE.md,
                alignItems: "center",
                backgroundColor: ceylon.background,
                borderRadius: 14,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: ceylon.muted }}>Cancel</Text>
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
      <View style={{ flex: 1, backgroundColor: "rgba(61,46,31,0.35)", alignItems: "center", justifyContent: "center", padding: SPACE.xl }}>
        <Animated.View
          entering={ZoomIn.duration(180)}
          style={{ width: "100%", backgroundColor: "#fff", borderRadius: 22, padding: SPACE.lg }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: ceylon.ink, marginBottom: 4 }}>Rename chat</Text>
          <Text style={{ fontSize: 12, color: ceylon.muted, marginBottom: SPACE.lg }}>
            Give this conversation a name that&aposs easy to find later
          </Text>

          <TextInput
            value={value}
            onChangeText={setValue}
            autoFocus
            placeholder="Conversation name"
            placeholderTextColor={ceylon.mutedLight}
            style={{
              borderWidth: 1.5,
              borderColor: ceylon.sand,
              borderRadius: 14,
              paddingHorizontal: SPACE.md,
              paddingVertical: 12,
              fontSize: 14,
              color: ceylon.ink,
              marginBottom: SPACE.lg,
            }}
            onSubmitEditing={handleConfirm}
            returnKeyType="done"
          />

          <View className="flex-row" style={{ gap: SPACE.sm }}>
            <TouchableOpacity
              onPress={onClose}
              style={{ flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: ceylon.background, alignItems: "center" }}
            >
              <Text style={{ fontWeight: "600", color: ceylon.muted, fontSize: 13 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!value.trim()}
              style={{
                flex: 1,
                paddingVertical: 13,
                borderRadius: 14,
                backgroundColor: value.trim() ? ceylon.teaGreen : ceylon.mutedLight,
                alignItems: "center",
              }}
            >
              <Text style={{ fontWeight: "700", color: "#fff", fontSize: 13 }}>Save</Text>
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
      <View style={{ flex: 1, backgroundColor: "rgba(61,46,31,0.35)", alignItems: "center", justifyContent: "center", padding: SPACE.xl }}>
        <Animated.View
          entering={ZoomIn.duration(180)}
          style={{ width: "100%", backgroundColor: "#fff", borderRadius: 22, padding: SPACE.lg, alignItems: "center" }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: "#F7DDD6",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: SPACE.md,
            }}
          >
            <Ionicons name="trash-outline" size={22} color={ceylon.danger} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: "700", color: ceylon.ink, marginBottom: 4, textAlign: "center" }}>
            Delete this conversation?
          </Text>
          <Text style={{ fontSize: 12, color: ceylon.muted, textAlign: "center", marginBottom: SPACE.lg }}>
            &apos{room.title}&apos will be permanently removed. This can&apos t be undone.
          </Text>

          <View className="flex-row w-full" style={{ gap: SPACE.sm }}>
            <TouchableOpacity
              onPress={onClose}
              style={{ flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: ceylon.background, alignItems: "center" }}
            >
              <Text style={{ fontWeight: "600", color: ceylon.muted, fontSize: 13 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
                onConfirm(room.id);
              }}
              style={{ flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: ceylon.danger, alignItems: "center" }}
            >
              <Text style={{ fontWeight: "700", color: "#fff", fontSize: 13 }}>Delete</Text>
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
        style={{ backgroundColor: "#fff", borderRadius: 18, padding: SPACE.md, marginBottom: SPACE.sm }}
      >
        <Avatar emoji="🌿" size={46} online />

        <View className="flex-1" style={{ marginLeft: SPACE.md }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1" style={{ gap: 5, marginRight: 8 }}>
              {room.pinned && <Ionicons name="bookmark" size={11} color={ceylon.terracotta} />}
              <Text numberOfLines={1} style={{ fontWeight: "700", fontSize: 14, color: ceylon.ink, flexShrink: 1 }}>
                {room.title}
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: ceylon.mutedLight }}>{room.time}</Text>
          </View>
          <View className="flex-row items-center justify-between" style={{ marginTop: 3 }}>
            <Text numberOfLines={1} style={{ fontSize: 12, color: ceylon.muted, flex: 1, marginRight: 8 }}>
              {room.preview}
            </Text>
            {room.unread > 0 && (
              <View
                style={{
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: ceylon.terracotta,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 5,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{room.unread}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Explicit "⋯" affordance — long-press works, but this makes the option discoverable */}
        <TouchableOpacity
          onPress={() => onOpenActions(room)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ paddingLeft: SPACE.sm }}
        >
          <Ionicons name="ellipsis-vertical" size={16} color={ceylon.mutedLight} />
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
    <View className="flex-1" style={{ backgroundColor: ceylon.background }}>
      <View
        style={{
          backgroundColor: ceylon.cream,
          paddingHorizontal: SPACE.lg,
          paddingTop: SPACE.xl,
          paddingBottom: SPACE.lg,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        <View className="flex-row items-center justify-between" style={{ marginBottom: SPACE.lg }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "700", color: ceylon.ink }}>Support Chat</Text>
            <Text style={{ fontSize: 12, color: ceylon.muted, marginTop: 2 }}>A calm space, whenever you need it</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onNewChat();
            }}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: ceylon.teaGreen, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View
          className="flex-row items-center"
          style={{ backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: SPACE.md, height: 42 }}
        >
          <Ionicons name="search" size={16} color={ceylon.mutedLight} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search conversations"
            placeholderTextColor={ceylon.mutedLight}
            style={{ flex: 1, marginLeft: SPACE.sm, fontSize: 13, color: ceylon.ink }}
          />
        </View>
      </View>

      {filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center" style={{ paddingHorizontal: SPACE.xl }}>
          <View
            style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginBottom: SPACE.md }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={26} color={ceylon.sage} />
          </View>
          <Text style={{ fontWeight: "700", color: ceylon.ink, marginBottom: 4 }}>
            {search ? "No matches found" : "No conversations yet"}
          </Text>
          <Text style={{ fontSize: 12, color: ceylon.muted, textAlign: "center" }}>
            {search ? "Try a different search term" : "Start a new chat whenever you're ready to talk"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => <RoomListItem room={item} onPress={onOpenRoom} onOpenActions={onOpenActions} />}
          contentContainerStyle={{ padding: SPACE.lg, paddingBottom: SPACE.xxl }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        onPress={onNewChat}
        activeOpacity={0.85}
        style={{
          position: "absolute",
          bottom: SPACE.xl,
          right: SPACE.xl,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: ceylon.terracotta,
          paddingHorizontal: 18,
          paddingVertical: 13,
          borderRadius: 26,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        <Ionicons name="add-circle" size={18} color="#fff" />
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>New chat</Text>
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
      style={{ flex: 1, backgroundColor: ceylon.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        className="flex-row items-center"
        style={{ backgroundColor: "#fff", padding: SPACE.md, paddingTop: Platform.OS === "ios" ? SPACE.xl : SPACE.md, gap: SPACE.md }}
      >
        <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={22} color={ceylon.ink} />
        </TouchableOpacity>
        <Avatar emoji="🌿" size={38} online />
        <View className="flex-1">
          <Text numberOfLines={1} style={{ fontWeight: "700", fontSize: 14, color: ceylon.ink }}>
            {room.title}
          </Text>
          <View className="flex-row items-center" style={{ gap: 5, marginTop: 1 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ceylon.teaGreen }} />
            <Text style={{ fontSize: 11, color: ceylon.teaGreen, fontWeight: "600" }}>Online & ready to help</Text>
          </View>
        </View>
        {/* Tapping this opens the same Rename/Delete sheet as the list */}
        <TouchableOpacity onPress={() => onOpenActions(room)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="ellipsis-horizontal" size={20} color={ceylon.mutedLight} />
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
        contentContainerStyle={{ paddingVertical: SPACE.md }}
        ListFooterComponent={typing ? <TypingIndicator /> : null}
        showsVerticalScrollIndicator={false}
      />

      <View style={{ backgroundColor: "#fff" }}>
        <QuickPrompts onSelect={handleSend} />
        <MessageInput onSend={handleSend} />
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── ROOT FEATURE (list ↔ chat) ────────────────────────────────────────────
const AIChatFeature = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getRooms(userId).then(setRooms).catch(console.error).finally(() => setLoading(false));
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