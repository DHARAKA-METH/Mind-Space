import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getAuth } from "firebase/auth";
import {
  subscribeMessages,
  sendMessage,
  markConversationRead,
} from "../services/anonymousChatService";

const ceylon = {
  ink: "#3D2E1F",
  muted: "#8A7A63",
  mutedLight: "#B8A78C",
  charcoal: "#2C2C2C",
  accent: "#7C5CBF",
  accentLight: "#EDE7F6",
  terracotta: "#C97B4A",
  sand: "#F0E4D3",
  cream: "#FBF3EA",
  background: "#ECE6E3",
};

const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 };

const Avatar = React.memo(({ emoji, color, size = 36, online }) => (
  <View className="relative">
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color || ceylon.accentLight,
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
          backgroundColor: online ? ceylon.charcoal : ceylon.mutedLight,
        }}
      />
    )}
  </View>
));
Avatar.displayName = "Avatar";

const formatMsgTime = (ts) => {
  if (!ts) return "";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const MessageBubble = React.memo(({ msg, systemEmoji, isUser }) => (
  <View className={`px-4 mb-3 items-end flex-row ${isUser ? "flex-row-reverse" : "flex-row"}`}>
    {!isUser && <Avatar emoji={systemEmoji} color={ceylon.accentLight} size={30} />}
    <View className={`max-w-[75%] mx-2 ${isUser ? "items-end" : "items-start"}`}>
      <View
        style={{
          borderRadius: 18,
          padding: 12,
          backgroundColor: isUser ? ceylon.charcoal : "#fff",
          borderBottomRightRadius: isUser ? 4 : 18,
          borderBottomLeftRadius: isUser ? 18 : 4,
          shadowColor: "#000",
          shadowOpacity: 0.04,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <Text style={{ fontSize: 13.5, color: isUser ? "#fff" : ceylon.ink, lineHeight: 19 }}>
          {msg.text}
        </Text>
      </View>
      <Text style={{ fontSize: 10, color: ceylon.mutedLight, marginTop: 4 }}>
        {formatMsgTime(msg.createdAt)}
      </Text>
    </View>
  </View>
));
MessageBubble.displayName = "MessageBubble";

const MessageInput = ({ onSend, placeholder = "Type a message..." }) => {
  const [text, setText] = useState("");

  const handle = () => {
    if (!text.trim()) return;
    Haptics.selectionAsync().catch(() => {});
    onSend(text.trim());
    setText("");
  };

  return (
    <View
      className="flex-row items-center"
      style={{
        backgroundColor: ceylon.cream,
        padding: SPACE.md,
        paddingBottom: Platform.OS === "ios" ? SPACE.xl : SPACE.md,
        borderTopWidth: 1,
        borderTopColor: ceylon.sand,
      }}
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
          backgroundColor: "#fff",
          fontSize: 13.5,
          color: ceylon.ink,
          maxHeight: 100,
          borderWidth: 1,
          borderColor: ceylon.sand,
        }}
      />
      <TouchableOpacity
        onPress={handle}
        disabled={!text.trim()}
        activeOpacity={0.7}
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: text.trim() ? ceylon.charcoal : ceylon.mutedLight,
          marginLeft: SPACE.sm,
        }}
      >
        <Ionicons name="arrow-up" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const CounselorChatRoom = ({ counselor, onBack }) => {
  const [messages, setMessages] = useState([]);
  const flatListRef = useRef();
  const uid = getAuth().currentUser?.uid;

  useEffect(() => {
    if (!counselor.conversationId) return;
    const unsub = subscribeMessages(counselor.conversationId, setMessages);
    markConversationRead(counselor.conversationId, "student");
    return unsub;
  }, [counselor.conversationId]);

  const handleSend = (text) => {
    if (!uid || !counselor.conversationId) return;
    sendMessage(counselor.conversationId, uid, "student", text);
  };

  return (
    <View className="flex-1">
      <View
        className="flex-row items-center"
        style={{
          backgroundColor: ceylon.cream,
          padding: SPACE.md,
          paddingTop: Platform.OS === "ios" ? SPACE.xl : SPACE.md,
          gap: SPACE.md,
          borderBottomWidth: 1,
          borderBottomColor: ceylon.sand,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onBack();
          }}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: "#fff" }}
        >
          <Ionicons name="chevron-back" size={20} color={ceylon.ink} />
        </TouchableOpacity>
        <Avatar emoji={counselor.emoji} color={counselor.color} size={38} online={counselor.online} />
        <View className="flex-1">
          <Text numberOfLines={1} style={{ fontWeight: "700", fontSize: 14, color: ceylon.ink }}>
            {counselor.name}
          </Text>
          <View className="flex-row items-center" style={{ marginTop: 2 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ceylon.charcoal }} />
            <Text style={{ fontSize: 11, color: ceylon.charcoal, fontWeight: "600", marginLeft: 5 }}>
              {counselor.specialty}
            </Text>
          </View>
        </View>
        <View className="px-2.5 py-1 rounded-xl" style={{ backgroundColor: ceylon.accentLight }}>
          <View className="flex-row items-center" style={{ gap: 4 }}>
            <Ionicons name="lock-closed" size={11} color={ceylon.accent} />
            <Text style={{ fontSize: 10, fontWeight: "700", color: ceylon.accent }}>
              Anon
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        style={{ backgroundColor: ceylon.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id || Math.random().toString()}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          className="flex-1"
          contentContainerStyle={{ paddingVertical: SPACE.md }}
          ListHeaderComponent={() => (
            <View className="px-4 pt-3 pb-3">
              <View className="flex-row items-center justify-center gap-2 mb-3">
                <Ionicons name="lock-closed" size={12} color={ceylon.accent} />
                <Text className="text-[11px]" style={{ color: ceylon.muted }}>
                  End-to-end encrypted. Your identity is hidden.
                </Text>
              </View>
              <View className="flex-row px-4 pb-1">
                <View className="flex-1 p-2.5 rounded-xl bg-white items-center" style={{ borderWidth: 1, borderColor: ceylon.sand }}>
                  <Text className="text-[10px] font-semibold" style={{ color: ceylon.mutedLight }}>COUNSELOR</Text>
                  <Text className="text-xs font-bold my-0.5" style={{ color: ceylon.ink }}>{counselor.name}</Text>
                  <Text className="text-[10px]" style={{ color: ceylon.charcoal }}>Visible to you</Text>
                </View>
                <View className="flex-1 p-2.5 rounded-xl items-center ml-2" style={{ backgroundColor: ceylon.accentLight }}>
                  <Text className="text-[10px] font-semibold" style={{ color: ceylon.mutedLight }}>YOU</Text>
                  <Text className="text-xs font-bold my-0.5" style={{ color: ceylon.accent }}>Anonymous</Text>
                  <Text className="text-[10px]" style={{ color: ceylon.muted }}>Hidden identity</Text>
                </View>
              </View>
            </View>
          )}
          renderItem={({ item }) => (
            <MessageBubble msg={item} systemEmoji={counselor.emoji} isUser={item.senderRole === "student"} />
          )}
          showsVerticalScrollIndicator={false}
        />

        <MessageInput onSend={handleSend} placeholder="Message anonymously..." />
      </KeyboardAvoidingView>
    </View>
  );
};

export default CounselorChatRoom;
