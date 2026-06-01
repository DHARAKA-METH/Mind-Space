import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const colors = {
  primary: "#6366f1",
  primaryLight: "#818cf8",
  primaryXLight: "#e0e7ff",
  secondary: "#a855f7",
  secondaryLight: "#d8b4fe",
  success: "#10b981",
  successLight: "#d1fae5",
  bg: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",
  textPrimary: "#0f172a",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",
  userBubble: "#6366f1",
  aiBubble: "#ffffff",
  danger: "#ef4444",
  amber: "#f59e0b",
};

// ─── DUMMY DATA ──────────────────────────────────────────────────────────────
const AI_MESSAGES = [
  { id: "1", sender: "ai", text: "Hi! I'm here to support you 💚\nHow are you feeling today?", time: "9:41 AM" },
  { id: "2", sender: "user", text: "Anxious about my exams 😰", time: "9:42 AM" },
  { id: "3", sender: "ai", text: "That's completely normal 🤗\nLet's try a breathing exercise together?", time: "9:42 AM" },
  { id: "4", sender: "user", text: "Yes please! 🙏", time: "9:43 AM" },
];

const QUICK_PROMPTS = ["I feel stressed", "Exam anxiety", "Need motivation", "Can't sleep", "Feeling lonely"];

const COUNSELORS = [
  {
    id: "c1", name: "Dr. Sarah Chen", specialty: "Anxiety & Burnout Specialist",
    bio: "Helping students navigate academic pressure with evidence-based CBT techniques.",
    lang: "English, Mandarin", exp: 8, avgReply: "< 5 min", online: true,
    emoji: "👩‍⚕️", color: "#e0e7ff",
  },
  {
    id: "c2", name: "Mr. James Okafor", specialty: "Depression & Grief Counselor",
    bio: "Compassionate listening and practical coping strategies for life's hardest moments.",
    lang: "English, French", exp: 5, avgReply: "< 10 min", online: true,
    emoji: "👨‍💼", color: "#fce7f3",
  },
  {
    id: "c3", name: "Ms. Priya Nair", specialty: "Stress & Mindfulness Coach",
    bio: "Integrating mindfulness, yoga therapy and somatic techniques for holistic wellness.",
    lang: "English, Tamil", exp: 6, avgReply: "< 8 min", online: false,
    emoji: "🧘‍♀️", color: "#d1fae5",
  },
  {
    id: "c4", name: "Dr. Leo Park", specialty: "Academic & Career Counselor",
    bio: "Specialized in helping students overcome imposter syndrome and exam anxiety.",
    lang: "English, Korean", exp: 10, avgReply: "< 12 min", online: true,
    emoji: "👨‍🏫", color: "#fef3c7",
  },
];

const COUNSELOR_CHAT = [
  { id: "m1", sender: "counselor", text: "Hello! I'm here to listen. This is a completely safe, anonymous space. How can I support you today?", time: "10:02 AM" },
  { id: "m2", sender: "user", text: "I've been feeling overwhelmed with everything lately...", time: "10:03 AM" },
  { id: "m3", sender: "counselor", text: "I hear you. Feeling overwhelmed is very real. Can you tell me a little more about what's been weighing on you the most?", time: "10:04 AM" },
];

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────

const Avatar = ({ emoji, color, size = 36, online }) => (
  <View style={{ position: "relative" }}>
    <View style={[styles.avatarContainer, { width: size, height: size, borderRadius: size / 2, backgroundColor: color || "#e0e7ff" }]}>
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
    {online !== undefined && (
      <View style={[styles.onlineBadge, { backgroundColor: online ? colors.success : colors.textMuted }]} />
    )}
  </View>
);

const TypingIndicator = () => (
  <View style={styles.typingIndicatorContainer}>
    <Avatar emoji="🤖" color="#e0e7ff" size={28} />
    <View style={styles.typingBubble}>
      <Text style={{ color: colors.textMuted }}>...</Text>
    </View>
  </View>
);

const PrivacyBanner = () => (
  <View style={styles.privacyBanner}>
    <Text style={{ fontSize: 18 }}>🔒</Text>
    <View style={{ flex: 1 }}>
      <Text style={styles.privacyTitle}>END-TO-END ENCRYPTED</Text>
      <Text style={styles.privacyText}>Your identity is fully hidden as <Text style={{ fontWeight: 'bold' }}>Anonymous Student</Text></Text>
    </View>
  </View>
);

const MessageInput = ({ onSend, placeholder = "Type a message...", showAttach = false }) => {
  const [text, setText] = useState("");
  const handle = () => { if (text.trim()) { onSend(text.trim()); setText(""); } };
  return (
    <View style={styles.inputContainer}>
      {showAttach && (
        <TouchableOpacity style={styles.attachButton}>
          <Text style={{ fontSize: 16 }}>📎</Text>
        </TouchableOpacity>
      )}
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.textInput}
      />
      <TouchableOpacity onPress={handle} style={styles.sendButton}>
        <Text style={{ color: 'white', fontSize: 16 }}>▶</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── AI CHAT SCREEN ──────────────────────────────────────────────────────────

const MessageBubble = ({ msg }) => {
  const isUser = msg.sender === "user";
  return (
    <View style={[styles.messageRow, { flexDirection: isUser ? "row-reverse" : "row" }]}>
      {!isUser && <Avatar emoji="🤖" color="#e0e7ff" size={32} />}
      <View style={[styles.bubbleWrapper, { alignItems: isUser ? "flex-end" : "flex-start" }]}>
        <View style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.primary : "white",
            borderBottomRightRadius: isUser ? 4 : 18,
            borderBottomLeftRadius: isUser ? 18 : 4,
          }
        ]}>
          <Text style={{ color: isUser ? "white" : colors.textPrimary, fontSize: 14 }}>{msg.text}</Text>
        </View>
        <Text style={styles.timeText}>{msg.time}</Text>
      </View>
    </View>
  );
};

const QuickPrompts = ({ onSelect }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPromptsScroll}>
    {QUICK_PROMPTS.map(p => (
      <TouchableOpacity key={p} onPress={() => onSelect(p)} style={styles.quickPromptBtn}>
        <Text style={styles.quickPromptText}>{p}</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

const AIChatScreen = () => {
  const [messages, setMessages] = useState(AI_MESSAGES);
  const [typing, setTyping] = useState(false);
  const scrollViewRef = useRef();

  const handleSend = useCallback((text) => {
    const newMsg = { id: Date.now().toString(), sender: "user", text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages(m => [...m, newMsg]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, { id: Date.now().toString() + "a", sender: "ai", text: "I understand how you feel. You're not alone 💙\nWould you like to explore some coping strategies together?", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    }, 2000);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.chatHeader}>
        <Avatar emoji="🤖" color="#e0e7ff" size={40} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>MindSpace AI</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online & Ready to Help</Text>
          </View>
        </View>
        <TouchableOpacity><Text style={{ fontSize: 20, color: colors.textSecondary }}>⋯</Text></TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
        style={{ flex: 1, paddingVertical: 12 }}
      >
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {typing && <TypingIndicator />}
      </ScrollView>

      <View style={styles.bottomSection}>
        <QuickPrompts onSelect={handleSend} />
        <MessageInput onSend={handleSend} />
      </View>
    </View>
  );
};

// ─── ANONYMOUS COUNSELOR CHAT ─────────────────────────────────────────────────

const CounselorCard = ({ c, onStart }) => (
  <TouchableOpacity onPress={() => c.online && onStart(c)} style={styles.counselorCard}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      <Avatar emoji={c.emoji} color={c.color} size={52} online={c.online} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={styles.counselorName}>{c.name}</Text>
            <Text style={styles.counselorSpecialty}>{c.specialty}</Text>
          </View>
          <View style={[styles.statusTag, { backgroundColor: c.online ? colors.successLight : "#f1f5f9" }]}>
            <Text style={{ fontSize: 10, color: c.online ? colors.success : colors.textMuted, fontWeight: '700' }}>
              {c.online ? "● Online" : "○ Away"}
            </Text>
          </View>
        </View>
        <Text style={styles.counselorBio}>{c.bio}</Text>
        <View style={styles.tagContainer}>
          {[`🌐 ${c.lang}`, `⏱ ${c.avgReply}`, `${c.exp}y exp`].map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
    <View style={[styles.startChatBtn, { backgroundColor: c.online ? colors.primary : colors.bg }]}>
      <Text style={{ color: c.online ? 'white' : colors.textMuted, fontWeight: '700', fontSize: 13 }}>
        {c.online ? "🔒 Start Anonymous Chat" : "Currently Unavailable"}
      </Text>
    </View>
  </TouchableOpacity>
);

const CounselorChatRoom = ({ counselor, onBack }) => {
  const [messages, setMessages] = useState(COUNSELOR_CHAT);
  const [typing, setTyping] = useState(false);
  const scrollViewRef = useRef();

  const handleSend = (text) => {
    setMessages(m => [...m, { id: Date.now().toString(), sender: "user", text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, { id: Date.now().toString() + "c", sender: "counselor", text: "Thank you for sharing that with me. It takes real courage. I'm here with you.", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    }, 2500);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.roomHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={{ fontSize: 16 }}>←</Text>
        </TouchableOpacity>
        <Avatar emoji={counselor.emoji} color={counselor.color} size={38} online={counselor.online} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitleSmall}>{counselor.name}</Text>
          <Text style={styles.headerSubtitle}>{counselor.specialty}</Text>
        </View>
        <View style={styles.anonBadge}>
          <Text style={styles.anonBadgeText}>🔒 Anon</Text>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
        style={{ flex: 1 }}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <PrivacyBanner />
        </View>
        
        <View style={styles.identityRow}>
          <View style={styles.identityCard}>
            <Text style={styles.identityLabel}>COUNSELOR</Text>
            <Text style={styles.identityName}>{counselor.name}</Text>
            <Text style={{ fontSize: 10, color: colors.success }}>✓ Visible to you</Text>
          </View>
          <View style={[styles.identityCard, { backgroundColor: "#faf5ff", borderColor: "#e9d5ff" }]}>
            <Text style={styles.identityLabel}>YOU</Text>
            <Text style={[styles.identityName, { color: "#7c3aed" }]}>Anonymous Student</Text>
            <Text style={{ fontSize: 10, color: "#7c3aed" }}>🔒 Hidden from counselor</Text>
          </View>
        </View>

        {messages.map(msg => {
          const isUser = msg.sender === "user";
          return (
            <View key={msg.id} style={[styles.messageRow, { flexDirection: isUser ? "row-reverse" : "row" }]}>
              {!isUser && <Avatar emoji={counselor.emoji} color={counselor.color} size={30} />}
              <View style={[styles.bubbleWrapper, { alignItems: isUser ? "flex-end" : "flex-start" }]}>
                <View style={[
                  styles.bubble,
                  {
                    backgroundColor: isUser ? "#7c3aed" : "white",
                    borderBottomRightRadius: isUser ? 4 : 18,
                    borderBottomLeftRadius: isUser ? 18 : 4,
                  }
                ]}>
                  <Text style={{ color: isUser ? "white" : colors.textPrimary, fontSize: 13 }}>{msg.text}</Text>
                </View>
                <Text style={styles.timeText}>{msg.time}</Text>
              </View>
            </View>
          );
        })}
        {typing && (
          <View style={styles.typingRow}>
            <Avatar emoji={counselor.emoji} color={counselor.color} size={28} />
            <Text style={styles.typingText}>{counselor.name.split(" ")[1] || counselor.name} is typing...</Text>
          </View>
        )}
      </ScrollView>

      <MessageInput onSend={handleSend} placeholder="Message anonymously..." showAttach />
    </View>
  );
};

const AnonymousCounselorScreen = () => {
  const [activeCounselor, setActiveCounselor] = useState(null);

  if (activeCounselor) return <CounselorChatRoom counselor={activeCounselor} onBack={() => setActiveCounselor(null)} />;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.anonHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.shieldIcon}><Text style={{ fontSize: 20 }}>🛡️</Text></View>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.headerTitle}>Anonymous Support</Text>
            <Text style={styles.identityProtected}>🔒 Your identity is fully protected</Text>
          </View>
        </View>
        <View style={styles.anonInfoBox}>
          <Text style={styles.anonInfoText}>
            Connect with real professional counselors anonymously. They will never know who you are.
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <Text style={styles.listSectionTitle}>
          {COUNSELORS.filter(c => c.online).length} Counselors Online Now
        </Text>
        {COUNSELORS.map(c => <CounselorCard key={c.id} c={c} onStart={setActiveCounselor} />)}
      </ScrollView>
    </View>
  );
};

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

const Screen = () => {
  const [tab, setTab] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity><Text style={styles.headerIcon}>←</Text></TouchableOpacity>
          <Text style={styles.headerMainTitle}>Support Chat</Text>
          <TouchableOpacity><Text style={styles.headerIcon}>⋯</Text></TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabSwitcherContainer}>
          <View style={styles.tabSwitcherBg}>
            <TouchableOpacity 
              onPress={() => setTab(0)} 
              style={[styles.tabBtn, tab === 0 && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, tab === 0 && styles.tabBtnTextActive]}>🤖 AI Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setTab(1)} 
              style={[styles.tabBtn, tab === 1 && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, tab === 1 && styles.tabBtnTextActive]}>🔒 Anon Mentor</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.privateBadge}>
            <Text style={styles.privateBadgeText}>🔒 Private & anonymous session</Text>
          </View>
        </View>

        {/* Active Content */}
        <View style={{ flex: 1 }}>
          {tab === 0 ? <AIChatScreen /> : <AnonymousCounselorScreen />}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerIcon: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  headerMainTitle: {
    fontWeight: '800',
    fontSize: 17,
    color: colors.textPrimary,
  },
  tabSwitcherContainer: {
    padding: 16,
    paddingBottom: 0,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabSwitcherBg: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: 'white',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  privateBadge: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: colors.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 8,
  },
  privateBadgeText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  onlineBadge: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "white",
  },
  chatHeader: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 15,
    color: colors.textPrimary,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 5,
  },
  onlineText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
  },
  messageRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  bubbleWrapper: {
    maxWidth: '72%',
    marginHorizontal: 8,
  },
  bubble: {
    borderRadius: 18,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  timeText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  typingBubble: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 10,
    marginLeft: 8,
    borderBottomLeftRadius: 4,
  },
  bottomSection: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickPromptsScroll: {
    padding: 8,
    paddingHorizontal: 16,
  },
  quickPromptBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.primaryXLight,
    borderWidth: 1.5,
    borderColor: '#c7d2fe',
    marginRight: 8,
  },
  quickPromptText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  anonHeader: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  shieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#faf5ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e9d5ff',
  },
  identityProtected: {
    fontSize: 11,
    color: '#7c3aed',
    fontWeight: '600',
  },
  anonInfoBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  anonInfoText: {
    fontSize: 12,
    color: '#6d28d9',
    lineHeight: 18,
  },
  listSectionTitle: {
    padding: 16,
    paddingBottom: 8,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  counselorCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  counselorName: {
    fontWeight: '700',
    fontSize: 15,
    color: colors.textPrimary,
  },
  counselorSpecialty: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  counselorBio: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  startChatBtn: {
    width: '100%',
    marginTop: 12,
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
  },
  roomHeader: {
    padding: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleSmall: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  anonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "#ede9fe",
  },
  anonBadgeText: {
    fontSize: 10,
    color: "#6d28d9",
    fontWeight: '700',
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f3ff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#c4b5fd',
    marginBottom: 12,
  },
  privacyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: "#5b21b6",
  },
  privacyText: {
    fontSize: 11,
    color: "#6d28d9",
    marginTop: 1,
  },
  identityRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  identityCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  identityLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  identityName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginVertical: 2,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  typingText: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginLeft: 8,
  },
});

export default Screen;
