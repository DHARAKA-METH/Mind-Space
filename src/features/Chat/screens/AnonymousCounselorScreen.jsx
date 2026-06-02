import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';

// ─── DATA ─────────────────────────────────────────────────────────────────────
const COUNSELORS = [
  {
    id: 'c1', name: 'Dr. Sarah Chen', specialty: 'Anxiety & Burnout Specialist',
    bio: 'Helping students navigate academic pressure with evidence-based CBT techniques.',
    lang: 'English, Mandarin', exp: 8, avgReply: '< 5 min', online: true,
    emoji: '👩‍⚕️', color: 'bg-indigo-100',
  },
  {
    id: 'c2', name: 'Mr. James Okafor', specialty: 'Depression & Grief Counselor',
    bio: "Compassionate listening and practical coping strategies for life's hardest moments.",
    lang: 'English, French', exp: 5, avgReply: '< 10 min', online: true,
    emoji: '👨‍💼', color: 'bg-pink-100',
  },
  {
    id: 'c3', name: 'Ms. Priya Nair', specialty: 'Stress & Mindfulness Coach',
    bio: 'Integrating mindfulness, yoga therapy and somatic techniques for holistic wellness.',
    lang: 'English, Tamil', exp: 6, avgReply: '< 8 min', online: false,
    emoji: '🧘‍♀️', color: 'bg-emerald-100',
  },
  {
    id: 'c4', name: 'Dr. Leo Park', specialty: 'Academic & Career Counselor',
    bio: 'Specialized in helping students overcome imposter syndrome and exam anxiety.',
    lang: 'English, Korean', exp: 10, avgReply: '< 12 min', online: true,
    emoji: '👨‍🏫', color: 'bg-amber-100',
  },
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

// ─── COUNSELOR CARD ───────────────────────────────────────────────────────────
const CounselorCard = React.memo(({ c, onStart }) => (
  <TouchableOpacity
    onPress={() => c.online && onStart(c)}
    className="bg-white rounded-2xl p-4 mx-4 my-2 border border-slate-200"
  >
    <View className="flex-row items-start">
      <Avatar emoji={c.emoji} color={c.color} size={52} online={c.online} />
      <View className="flex-1 ml-3">
        <View className="flex-row justify-between">
          <View className="flex-1 pr-1">
            <Text className="font-bold text-sm text-slate-900">{c.name}</Text>
            <Text className="text-xs text-indigo-500 font-semibold mt-0.5">{c.specialty}</Text>
          </View>
          <View className={`px-2 py-0.5 rounded-lg h-5 ${c.online ? 'bg-emerald-50' : 'bg-slate-100'}`}>
            <Text className={`text-[10px] font-bold ${c.online ? 'text-emerald-500' : 'text-slate-400'}`}>
              {c.online ? '● Online' : '○ Away'}
            </Text>
          </View>
        </View>
        <Text className="text-xs text-slate-500 mt-1.5 leading-5">{c.bio}</Text>
        <View className="flex-row flex-wrap mt-2">
          {[`🌐 ${c.lang}`, `⏱ ${c.avgReply}`, `${c.exp}y exp`].map((tag) => (
            <View key={tag} className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 mr-1.5 mb-1.5">
              <Text className="text-[10px] text-slate-500 font-medium">{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
    <View className={`w-full mt-3 py-2.5 rounded-xl items-center ${c.online ? 'bg-indigo-500' : 'bg-slate-50'}`}>
      <Text className={`font-bold text-xs ${c.online ? 'text-white' : 'text-slate-400'}`}>
        {c.online ? '🔒 Start Anonymous Chat' : 'Currently Unavailable'}
      </Text>
    </View>
  </TouchableOpacity>
));
CounselorCard.displayName = 'CounselorCard';

// ─── SCREEN ───────────────────────────────────────────────────────────────────
const AnonymousCounselorScreen = ({ setActiveCounselor }) => {
  const onlineCount = COUNSELORS.filter((c) => c.online).length;

  const renderCounselor = useCallback(
    ({ item }) => <CounselorCard c={item} onStart={setActiveCounselor} />,
    [setActiveCounselor],
  );

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="p-4 bg-white border-b border-slate-200">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-xl bg-purple-50 items-center justify-center border border-purple-200">
            <Text className="text-xl">🛡️</Text>
          </View>
          <View className="ml-2.5">
            <Text className="font-bold text-sm text-slate-900">Anonymous Support</Text>
            <Text className="text-[11px] text-purple-600 font-semibold">🔒 Your identity is fully protected</Text>
          </View>
        </View>
        <View className="mt-3 p-3 rounded-2xl bg-purple-50 border border-purple-100">
          <Text className="text-xs text-purple-800 leading-5">
            Connect with real professional counselors anonymously. They will never know who you are.
          </Text>
        </View>
      </View>

      <FlatList
        data={COUNSELORS}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <Text className="p-4 pb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            {onlineCount} Counselors Online Now
          </Text>
        )}
        renderItem={renderCounselor}
        className="flex-1"
      />
    </View>
  );
};

export default AnonymousCounselorScreen;
