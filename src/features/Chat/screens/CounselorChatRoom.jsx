import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, Platform, TextInput } from 'react-native';

// ─── DUMMY DATA ───────────────────────────────────────────────────────────────
const COUNSELOR_CHAT = [
  { id: 'm1', sender: 'counselor', text: 'Hello! I\'m here to listen. This is a completely safe, anonymous space. How can I support you today?', time: '10:02 AM' },
  { id: 'm2', sender: 'user', text: "I've been feeling overwhelmed with everything lately...", time: '10:03 AM' },
  { id: 'm3', sender: 'counselor', text: "I hear you. Feeling overwhelmed is very real. Can you tell me a little more about what's been weighing on you the most?", time: '10:04 AM' },
];

// ─── AVATAR ───────────────────────────────────────────────────────────────────
const Avatar = React.memo(({ emoji, color, size = 36, online }) => (
  <View className="relative">
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={`items-center justify-center border-2 border-white ${color || 'bg-indigo-100'}`}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
    {online !== undefined && (
      <View className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${online ? 'bg-emerald-500' : 'bg-slate-400'}`} />
    )}
  </View>
));
Avatar.displayName = 'Avatar';

const PrivacyBanner = () => (
  <View className="flex-row items-center p-3 bg-purple-50 rounded-2xl border border-purple-300 mb-3">
    <Text className="text-lg mr-2">🔒</Text>
    <View className="flex-1">
      <Text className="text-[11px] font-bold text-purple-800">END-TO-END ENCRYPTED</Text>
      <Text className="text-[11px] text-purple-700 mt-0.5">Your identity is fully hidden as <Text className="font-bold">Anonymous Student</Text></Text>
    </View>
  </View>
);

const MessageBubble = React.memo(({ msg, systemEmoji, bubbleColor = 'bg-purple-600' }) => {
  const isUser = msg.sender === 'user';
  return (
    <View className={`px-4 mb-3 items-end flex-row ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && <Avatar emoji={systemEmoji} color="bg-indigo-100" size={32} />}
      <View className={`max-w-[72%] mx-2 ${isUser ? 'items-end' : 'items-start'}`}>
        <View className={`rounded-2xl p-3 shadow-sm ${isUser ? `${bubbleColor} rounded-br-sm` : 'bg-white rounded-bl-sm'}`}>
          <Text className={`text-sm ${isUser ? 'text-white' : 'text-slate-900'}`}>{msg.text}</Text>
        </View>
        <Text className="text-[10px] text-slate-400 mt-1">{msg.time}</Text>
      </View>
    </View>
  );
});
MessageBubble.displayName = 'MessageBubble';

const MessageInput = ({ onSend, placeholder = 'Type a message...', showAttach = false }) => {
  const [text, setText] = useState('');
  const handle = () => { if (text.trim()) { onSend(text.trim()); setText(''); } };
  return (
    <View className={`p-3 flex-row items-center bg-white ${Platform.OS === 'ios' ? 'pb-6' : 'pb-3'}`}>
      {showAttach && (
        <TouchableOpacity className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 items-center justify-center mr-2.5">
          <Text className="text-base">📎</Text>
        </TouchableOpacity>
      )}
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        className="flex-1 px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-900"
      />
      <TouchableOpacity onPress={handle} className="w-10 h-10 rounded-full bg-indigo-500 items-center justify-center ml-2.5">
        <Text className="text-white text-base">▶</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── SCREEN ───────────────────────────────────────────────────────────────────
const CounselorChatRoom = ({ counselor, onBack }) => {
  const [messages, setMessages] = useState(COUNSELOR_CHAT);
  const [typing, setTyping] = useState(false);
  const flatListRef = useRef();

  const handleSend = (text) => {
    setMessages((m) => [...m, {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, {
        id: Date.now().toString() + 'c',
        sender: 'counselor',
        text: 'Thank you for sharing that with me. It takes real courage. I\'m here with you.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }, 2500);
  };

  return (
    <View className="flex-1">
      {/* Chat Header */}
      <View className="p-3 bg-white border-b border-slate-200 flex-row items-center">
        <TouchableOpacity
          onPress={onBack}
          className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 items-center justify-center mr-3"
        >
          <Text className="text-sm">←</Text>
        </TouchableOpacity>
        <Avatar emoji={counselor.emoji} color={counselor.color} size={38} online={counselor.online} />
        <View className="flex-1 ml-3">
          <Text className="font-bold text-xs text-slate-900">{counselor.name}</Text>
          <Text className="text-[11px] text-slate-500">{counselor.specialty}</Text>
        </View>
        <View className="px-2.5 py-1 rounded-xl bg-purple-100">
          <Text className="text-[10px] text-purple-700 font-bold">🔒 Anon</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        className="flex-1"
        ListHeaderComponent={() => (
          <>
            <View className="px-4 pt-2">
              <PrivacyBanner />
            </View>
            <View className="flex-row px-4 pb-3">
              <View className="flex-1 p-2.5 rounded-xl bg-white border border-slate-200 items-center">
                <Text className="text-[10px] text-slate-400 font-semibold">COUNSELOR</Text>
                <Text className="text-xs font-bold text-slate-900 my-0.5">{counselor.name}</Text>
                <Text className="text-[10px] text-emerald-500">✓ Visible to you</Text>
              </View>
              <View className="flex-1 p-2.5 rounded-xl bg-purple-50 border border-purple-200 items-center ml-2">
                <Text className="text-[10px] text-slate-400 font-semibold">YOU</Text>
                <Text className="text-xs font-bold text-purple-700 my-0.5">Anonymous Student</Text>
                <Text className="text-[10px] text-purple-700">🔒 Hidden from counselor</Text>
              </View>
            </View>
          </>
        )}
        renderItem={({ item }) => (
          <MessageBubble msg={item} systemEmoji={counselor.emoji} bubbleColor="bg-purple-600" />
        )}
        ListFooterComponent={
          typing ? (
            <View className="flex-row items-center px-4 pb-2.5">
              <Avatar emoji={counselor.emoji} color={counselor.color} size={28} />
              <Text className="text-[11px] text-slate-400 italic ml-2">
                {counselor.name.split(' ')[1] || counselor.name} is typing...
              </Text>
            </View>
          ) : null
        }
      />

      <MessageInput onSend={handleSend} placeholder="Message anonymously..." showAttach />
    </View>
  );
};

export default CounselorChatRoom;
