import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, FlatList, TextInput, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
  dangerBg: "#F7DDD6",
};

const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

const STUDENTS = [
  {
    id: "s1", anonymousId: "anon_evvi9i", stressLevel: 8, lastActive: "2 min ago",
    concern: "Exam anxiety — trembling before tests", emoji: "😰", online: true,
  },
  {
    id: "s2", anonymousId: "anon_ck3f7p", stressLevel: 6, lastActive: "15 min ago",
    concern: "Sleep deprivation, can't fall asleep before 3 AM", emoji: "😔", online: true,
  },
  {
    id: "s3", anonymousId: "anon_mh2b8q", stressLevel: 9, lastActive: "1 hour ago",
    concern: "Panic attacks during lectures", emoji: "😨", online: false,
  },
  {
    id: "s4", anonymousId: "anon_9w5d1x", stressLevel: 4, lastActive: "Yesterday",
    concern: "Feeling lonely since moving to campus", emoji: "🥺", online: true,
  },
  {
    id: "s5", anonymousId: "anon_tn6r3k", stressLevel: 7, lastActive: "3 hours ago",
    concern: "Family pressure about grades", emoji: "😮‍💨", online: false,
  },
];

const INITIAL_CHAT = [
  { id: "m1", sender: "student", text: "Hi, I've been feeling really anxious about my upcoming exams. I can't sleep properly.", time: "10:02 AM" },
  { id: "m2", sender: "counselor", text: "I'm sorry to hear that. Exam anxiety is very common and there are strategies we can try. Can you tell me more about what's keeping you up at night?", time: "10:04 AM" },
  { id: "m3", sender: "student", text: "I keep thinking I'm going to fail even though I've been studying. My heart races every time I think about the test.", time: "10:06 AM" },
];

const StudentCard = React.memo(({ student, onChat }: any) => (
  <TouchableOpacity
    onPress={() => student.online && onChat(student)}
    className="bg-white rounded-2xl p-4 mx-4 my-1.5"
    style={{ borderWidth: 1, borderColor: ceylon.sand }}
  >
    <View className="flex-row items-start">
      <View className="relative">
        <View
          style={{
            width: 52, height: 52, borderRadius: 26,
            backgroundColor: student.online ? `${ceylon.sage}22` : ceylon.sand,
            alignItems: "center", justifyContent: "center",
            borderWidth: 2, borderColor: "#fff",
          }}
        >
          <Text style={{ fontSize: 26 }}>{student.emoji}</Text>
        </View>
        {student.online !== undefined && (
          <View
            style={{
              position: "absolute", bottom: 2, right: 2,
              width: 12, height: 12, borderRadius: 6,
              borderWidth: 2, borderColor: "#fff",
              backgroundColor: student.online ? ceylon.teaGreen : ceylon.mutedLight,
            }}
          />
        )}
      </View>
      <View className="flex-1 ml-3">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-1">
            <Text className="font-bold text-sm" style={{ color: ceylon.ink }}>{student.anonymousId}</Text>
            <Text className="text-xs font-semibold mt-0.5" style={{ color: ceylon.teaGreen }}>
              {student.concern}
            </Text>
          </View>
          <View className="px-2 py-0.5 rounded-lg" style={{ backgroundColor: student.online ? `${ceylon.teaGreen}15` : ceylon.background }}>
            <Text className="text-[10px] font-bold" style={{ color: student.online ? ceylon.teaGreen : ceylon.mutedLight }}>
              {student.online ? "● Online" : "○ Away"}
            </Text>
          </View>
        </View>
        <Text className="text-xs mt-1.5 leading-5" style={{ color: ceylon.muted }}>{student.concern}</Text>
        <View className="flex-row flex-wrap mt-2" style={{ gap: 6 }}>
          <View className="px-2 py-0.5 rounded-lg" style={{ backgroundColor: ceylon.background, borderWidth: 1, borderColor: ceylon.sand }}>
            <Text className="text-[10px] font-medium" style={{ color: ceylon.muted }}>🔥 Stress {student.stressLevel}/10</Text>
          </View>
          <View className="px-2 py-0.5 rounded-lg" style={{ backgroundColor: ceylon.background, borderWidth: 1, borderColor: ceylon.sand }}>
            <Text className="text-[10px] font-medium" style={{ color: ceylon.muted }}>⏱ {student.lastActive}</Text>
          </View>
        </View>
      </View>
    </View>
    <View className="w-full mt-3 py-2.5 rounded-xl items-center" style={{ backgroundColor: student.online ? ceylon.teaGreen : ceylon.background }}>
      <Text className="font-bold text-xs" style={{ color: student.online ? "#fff" : ceylon.mutedLight }}>
        {student.online ? "💬 Open Chat" : "Currently Unavailable"}
      </Text>
    </View>
  </TouchableOpacity>
));
StudentCard.displayName = "StudentCard";

const CounselorStudentChatRoom = ({ student, onBack }: any) => {
  const [messages, setMessages] = useState(INITIAL_CHAT);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const flatListRef = useRef<any>(null);

  const handleSend = () => {
    if (!text.trim()) return;
    const msg = {
      id: Date.now().toString(),
      sender: "counselor",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, msg]);
    setText("");

    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "s",
          sender: "student",
          text: "Thank you, that helps. I'll try that tonight.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 2500);
  };

  const isCounselor = (sender: string) => sender === "counselor";

  return (
    <View className="flex-1" style={{ backgroundColor: ceylon.background }}>
      <View className="flex-row items-center p-3" style={{ backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: ceylon.sand }}>
        <TouchableOpacity
          onPress={onBack}
          className="w-9 h-9 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: ceylon.background }}
        >
          <Ionicons name="chevron-back" size={18} color={ceylon.ink} />
        </TouchableOpacity>
        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: `${ceylon.sage}22`, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" }}>
          <Text style={{ fontSize: 19 }}>{student.emoji}</Text>
        </View>
        <View className="flex-1 ml-3">
          <Text className="font-bold text-sm" style={{ color: ceylon.ink }}>{student.anonymousId}</Text>
          <Text className="text-[11px]" style={{ color: ceylon.teaGreen }}>Stress {student.stressLevel}/10 · {student.lastActive}</Text>
        </View>
        <View className="px-2.5 py-1 rounded-xl" style={{ backgroundColor: `${ceylon.sage}18` }}>
          <Text className="text-[10px] font-bold" style={{ color: ceylon.sage }}>Student</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item: any) => item.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        className="flex-1"
        ListHeaderComponent={() => (
          <>
            <View className="px-4 pt-2">
              <View className="flex-row items-center p-3 rounded-2xl" style={{ backgroundColor: `${ceylon.sage}12`, borderWidth: 1, borderColor: `${ceylon.sage}25`, marginBottom: SPACE.sm }}>
                <Text className="text-lg mr-2">🔒</Text>
                <View className="flex-1">
                  <Text className="text-[11px] font-bold" style={{ color: ceylon.ink }}>IDENTITY PROTECTED</Text>
                  <Text className="text-[11px] mt-0.5" style={{ color: ceylon.muted }}>Conversation is confidential. {student.anonymousId}&aposs identity is protected.</Text>
                </View>
              </View>
            </View>
            <View className="flex-row px-4 pb-3" style={{ gap: SPACE.sm }}>
              <View className="flex-1 p-2.5 rounded-xl items-center" style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: ceylon.sand }}>
                <Text className="text-[10px] font-semibold" style={{ color: ceylon.mutedLight }}>YOU</Text>
                <Text className="text-xs font-bold my-0.5" style={{ color: ceylon.teaGreen }}>Counselor</Text>
                <Text className="text-[10px]" style={{ color: ceylon.teaGreen }}>✓ Visible to student</Text>
              </View>
              <View className="flex-1 p-2.5 rounded-xl items-center" style={{ backgroundColor: `${ceylon.terracotta}12`, borderWidth: 1, borderColor: `${ceylon.terracotta}30` }}>
                <Text className="text-[10px] font-semibold" style={{ color: ceylon.mutedLight }}>STUDENT</Text>
                <Text className="text-xs font-bold my-0.5" style={{ color: ceylon.terracotta }}>{student.anonymousId}</Text>
                <Text className="text-[10px]" style={{ color: ceylon.terracotta }}>🔒 Anonymous to you</Text>
              </View>
            </View>
          </>
        )}
        renderItem={({ item }: any) => {
          const fromCounselor = isCounselor(item.sender);
          return (
            <View className={`px-4 mb-3 items-end flex-row ${fromCounselor ? "flex-row-reverse" : "flex-row"}`}>
              {!fromCounselor && (
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: `${ceylon.terracotta}22`, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" }}>
                  <Text style={{ fontSize: 16 }}>{student.emoji}</Text>
                </View>
              )}
              <View className={`max-w-[72%] mx-2 ${fromCounselor ? "items-end" : "items-start"}`}>
                <View
                  style={{
                    borderRadius: 18, padding: 12,
                    backgroundColor: fromCounselor ? ceylon.teaGreen : "#fff",
                    borderBottomRightRadius: fromCounselor ? 4 : 18,
                    borderBottomLeftRadius: fromCounselor ? 18 : 4,
                    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                  }}
                >
                  <Text style={{ fontSize: 13.5, color: fromCounselor ? "#fff" : ceylon.ink, lineHeight: 19 }}>{item.text}</Text>
                </View>
                <Text style={{ fontSize: 10, color: ceylon.mutedLight, marginTop: 4 }}>{item.time}</Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          typing ? (
            <View className="flex-row items-center px-4 pb-2.5" style={{ gap: 8 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${ceylon.terracotta}22`, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" }}>
                <Text style={{ fontSize: 14 }}>{student.emoji}</Text>
              </View>
              <Text className="text-[11px] italic" style={{ color: ceylon.muted }}>{student.anonymousId} is typing...</Text>
            </View>
          ) : null
        }
      />

      <View className="flex-row items-center p-3" style={{ backgroundColor: "#fff", paddingBottom: Platform.OS === "ios" ? 24 : 12 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={`Message ${student.anonymousId}...`}
          placeholderTextColor={ceylon.mutedLight}
          className="flex-1 px-4 py-2.5 rounded-full"
          style={{ backgroundColor: ceylon.background, fontSize: 13, color: ceylon.ink }}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim()}
          className="w-10 h-10 rounded-full items-center justify-center ml-2.5"
          style={{ backgroundColor: text.trim() ? ceylon.teaGreen : ceylon.mutedLight }}
        >
          <Ionicons name="arrow-up" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function ChatScreen() {
  const [activeStudent, setActiveStudent] = useState<any>(null);

  if (activeStudent) {
    return (
      <CounselorStudentChatRoom
        student={activeStudent}
        onBack={() => setActiveStudent(null)}
      />
    );
  }

  const onlineCount = STUDENTS.filter((s) => s.online).length;
  return (
    <View className="flex-1" style={{ backgroundColor: ceylon.background }}>
      <View className="p-4" style={{ backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: ceylon.sand }}>
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${ceylon.sage}22`, borderWidth: 1, borderColor: `${ceylon.sage}40` }}>
            <Text className="text-xl">💬</Text>
          </View>
          <View className="ml-2.5">
            <Text className="font-bold text-sm" style={{ color: ceylon.ink }}>Student Chats</Text>
            <Text className="text-[11px] font-semibold" style={{ color: ceylon.teaGreen }}>
              {onlineCount} students online now
            </Text>
          </View>
        </View>
        <View className="mt-3 p-3 rounded-2xl" style={{ backgroundColor: `${ceylon.sage}12`, borderWidth: 1, borderColor: `${ceylon.sage}25` }}>
          <Text className="text-xs leading-5" style={{ color: ceylon.ink }}>
            Reach out to students who may need support. High-stress students are sorted to the top.
          </Text>
        </View>
      </View>

      <FlatList
        data={[...STUDENTS].sort((a, b) => b.stressLevel - a.stressLevel)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: SPACE.sm }}
        renderItem={({ item }) => <StudentCard student={item} onChat={setActiveStudent} />}
      />
    </View>
  );
}
