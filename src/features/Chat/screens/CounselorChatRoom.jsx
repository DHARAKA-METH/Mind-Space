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
  calmColors,
  commonColors,
  spacing,
  typography,
} from "@/src/theme";
import {
  subscribeMessages,
  sendMessage,
  markConversationRead,
} from "../services/anonymousChatService";

const Avatar = React.memo(({ emoji, color, size = 36, online }) => (
  <View className="relative">
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color || calmColors.primarySoft,
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
          backgroundColor: online ? calmColors.primaryDark : calmColors.textMuted,
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
    {!isUser && <Avatar emoji={systemEmoji} color={calmColors.primarySoft} size={30} />}
    <View className={`max-w-[75%] mx-2 ${isUser ? "items-end" : "items-start"}`}>
      <View
        style={{
          borderRadius: 18,
          padding: 12,
          backgroundColor: isUser ? calmColors.primaryDark : calmColors.surface,
          borderBottomRightRadius: isUser ? 4 : 18,
          borderBottomLeftRadius: isUser ? 18 : 4,
          shadowColor: commonColors.black,
          shadowOpacity: 0.04,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <Text style={{ fontSize: typography.fontSize.body, color: isUser ? commonColors.white : calmColors.textPrimary, lineHeight: typography.lineHeight.body }}>
          {msg.text}
        </Text>
      </View>
      <Text className="mt-1 text-caption text-calm-textMuted">
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
        backgroundColor: calmColors.surface,
        padding: spacing.sm,
        paddingBottom: Platform.OS === "ios" ? spacing.lg : spacing.sm,
        borderTopWidth: 1,
        borderTopColor: calmColors.border,
      }}
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
          backgroundColor: calmColors.surface,
          fontSize: typography.fontSize.body,
          color: calmColors.textPrimary,
          maxHeight: 100,
          borderWidth: 1,
          borderColor: calmColors.border,
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
          backgroundColor: text.trim() ? calmColors.primaryDark : calmColors.textMuted,
          marginLeft: spacing.xs,
        }}
        accessibilityLabel="Send anonymous message"
      >
        <Ionicons name="arrow-up" size={18} color={commonColors.white} />
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
          backgroundColor: calmColors.surface,
          padding: spacing.sm,
          paddingTop: Platform.OS === "ios" ? spacing.lg : spacing.sm,
          gap: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: calmColors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onBack();
          }}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: calmColors.surface }}
          accessibilityLabel="Back to counselors"
        >
          <Ionicons name="chevron-back" size={20} color={calmColors.textPrimary} />
        </TouchableOpacity>
        <Avatar emoji={counselor.emoji} color={counselor.color} size={38} online={counselor.online} />
        <View className="flex-1">
          <Text numberOfLines={1} className="text-body font-bold text-calm-textPrimary">
            {counselor.name}
          </Text>
          <View className="flex-row items-center" style={{ marginTop: 2 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: calmColors.primaryDark }} />
            <Text className="ml-[5px] text-caption font-semibold text-calm-primaryDark">
              {counselor.specialty}
            </Text>
          </View>
        </View>
        <View className="rounded-xl bg-calm-primarySoft px-2.5 py-1">
          <View className="flex-row items-center" style={{ gap: 4 }}>
            <Ionicons name="lock-closed" size={11} color={calmColors.primary} />
            <Text className="text-caption font-bold text-calm-primary">
              Anon
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        style={{ backgroundColor: calmColors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id || Math.random().toString()}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          className="flex-1"
          contentContainerStyle={{ paddingVertical: spacing.sm }}
          ListHeaderComponent={() => (
            <View className="px-4 pt-3 pb-3">
              <View className="flex-row items-center justify-center gap-2 mb-3">
                <Ionicons name="lock-closed" size={12} color={calmColors.primary} />
                <Text className="text-caption text-calm-textSecondary">
                  End-to-end encrypted. Your identity is hidden.
                </Text>
              </View>
              <View className="flex-row px-4 pb-1">
                <View className="flex-1 items-center rounded-xl border border-calm-border bg-calm-surface p-2.5">
                  <Text className="text-caption font-semibold text-calm-textMuted">COUNSELOR</Text>
                  <Text className="my-0.5 text-caption font-bold text-calm-textPrimary">{counselor.name}</Text>
                  <Text className="text-caption text-calm-primaryDark">Visible to you</Text>
                </View>
                <View className="ml-2 flex-1 items-center rounded-xl bg-calm-primarySoft p-2.5">
                  <Text className="text-caption font-semibold text-calm-textMuted">YOU</Text>
                  <Text className="my-0.5 text-caption font-bold text-calm-primary">Anonymous</Text>
                  <Text className="text-caption text-calm-textSecondary">Hidden identity</Text>
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
