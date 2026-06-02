import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView, Platform, TextInput } from 'react-native';

// ─── DUMMY DATA ───────────────────────────────────────────────────────────────
const AI_MESSAGES = [
  { id: '1', sender: 'ai', text: "Hi! I'm here to support you 💚\nHow are you feeling today?", time: '9:41 AM' },
  { id: '2', sender: 'user', text: 'Anxious about my exams 😰', time: '9:42 AM' },
  { id: '3', sender: 'ai', text: "That's completely normal 🤗\nLet's try a breathing exercise together?", time: '9:42 AM' },
  { id: '4', sender: 'user', text: 'Yes please! 🙏', time: '9:43 AM' },
];

const QUICK_PROMPTS = ['I feel stressed', 'Exam anxiety', 'Need motivation', "Can't sleep", 'Feeling lonely'];

// ─── SHARED SUB-COMPONENTS ────────────────────────────────────────────────────
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

const TypingIndicator = () => (
  <View className="flex-row items-center px-4 pb-2.5">
    <Avatar emoji="🤖" color="bg-indigo-100" size={28} />
    <View className="bg-white rounded-2xl rounded-bl-sm p-2.5 ml-2">
      <Text className="text-slate-400">...</Text>
    </View>
  </View>
);

const MessageBubble = React.memo(({ msg, systemEmoji = '🤖', bubbleColor = 'bg-indigo-500' }) => {
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

const QuickPrompts = ({ onSelect }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}>
    {QUICK_PROMPTS.map((p) => (
      <TouchableOpacity key={p} onPress={() => onSelect(p)} className="px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 mr-2">
        <Text className="text-indigo-500 text-xs font-semibold">{p}</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

// ─── SCREEN ───────────────────────────────────────────────────────────────────
const AIChatScreen = () => {
  const [messages, setMessages] = useState(AI_MESSAGES);
  const [typing, setTyping] = useState(false);
  const flatListRef = useRef();

  const handleSend = useCallback((text) => {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((m) => [...m, { id: Date.now().toString(), sender: 'user', text, time: timeString }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, {
        id: Date.now().toString() + 'a',
        sender: 'ai',
        text: "I understand how you feel. You're not alone 💙\nWould you like to explore some coping strategies together?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }, 2000);
  }, []);

  return (
    <View className="flex-1">
      {/* AI Header */}
      <View className="p-4 bg-white border-b border-slate-200 flex-row items-center">
        <Avatar emoji="🤖" color="bg-indigo-100" size={40} />
        <View className="flex-1 ml-3">
          <Text className="font-bold text-sm text-slate-900">MindSpace AI</Text>
          <View className="flex-row items-center mt-0.5">
            <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
            <Text className="text-[11px] text-emerald-500 font-semibold">Online & Ready to Help</Text>
          </View>
        </View>
        <TouchableOpacity><Text className="text-xl text-slate-500">⋯</Text></TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble msg={item} systemEmoji="🤖" bubbleColor="bg-indigo-500" />}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        className="flex-1 py-3"
        ListFooterComponent={typing ? <TypingIndicator /> : null}
      />

      <View className="bg-white border-t border-slate-200">
        <QuickPrompts onSelect={handleSend} />
        <MessageInput onSend={handleSend} />
      </View>
    </View>
  );
};

export default AIChatScreen;
