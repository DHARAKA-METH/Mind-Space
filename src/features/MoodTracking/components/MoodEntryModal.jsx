import React, { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { MOOD_CONFIG, MOOD_ORDER } from "../../../shared/constants/mood.config";

export const MoodEntryModal = ({ visible, dateKey, existingEntry, onClose, onSave, onDelete }) => {
  // Local state for the form
  const [mood, setMood] = useState(null);
  const [note, setNote] = useState("");

  // Sync state when modal opens or existingEntry changes
  useEffect(() => {
    if (visible) {
      setMood(existingEntry?.mood || null);
      setNote(existingEntry?.note || "");
    }
  }, [visible, existingEntry]);

  const handleSave = () => {
    if (!mood) return; 
    onSave(dateKey, {
      mood,
      note: note.trim(),
      stressLevel: MOOD_CONFIG[mood].stress,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-[40px] p-6 pb-10 shadow-2xl">
          
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-[#1A1A2E]">{dateKey}</Text>
            {existingEntry && (
              <TouchableOpacity onPress={() => { onDelete(dateKey); onClose(); }}>
                <Text className="text-red-500 font-bold text-xs bg-red-50 px-3 py-1 rounded-full">Delete</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Mood Selection */}
          <Text className="text-gray-400 font-bold text-[10px] mb-4 uppercase tracking-widest">How were you feeling?</Text>
          <View className="flex-row mb-6">
            {MOOD_ORDER.map((m) => {
              const isSelected = mood === m;
              const cfg = MOOD_CONFIG[m];
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMood(m)}
                  style={{
                    borderColor: isSelected ? cfg.color : "#F3F4F6",
                    backgroundColor: isSelected ? `${cfg.color}15` : "#FAFAFA",
                    borderWidth: isSelected ? 2 : 1,
                  }}
                  className="flex-1 py-3 mx-1 rounded-2xl items-center justify-center"
                >
                  <Image source={cfg.icon} className="w-7 h-7 mb-1" resizeMode="contain" />
                  <Text style={{ color: isSelected ? cfg.color : "#4B5563" }} className="text-[9px] font-bold">{cfg.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Note Input */}
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="What happened today? (Optional)"
            className="bg-gray-50 p-4 rounded-3xl border border-gray-100 mb-8 min-h-[100px]"
            multiline
            textAlignVertical="top"
          />

          {/* Action Buttons */}
          <View className="flex-row gap-4">
            <TouchableOpacity onPress={onClose} className="flex-1 p-4 rounded-2xl bg-gray-100 items-center">
              <Text className="font-bold text-gray-500">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleSave} 
              disabled={!mood}
              className={`flex-[2] p-4 rounded-2xl items-center shadow-md ${mood ? "bg-[#5B9CF6]" : "bg-gray-300"}`}
            >
              <Text className="text-white font-bold">Save Changes</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};