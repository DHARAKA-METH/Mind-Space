import React, { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { MOOD_CONFIG, MOOD_ORDER } from "../../../shared/constants/mood.config";
import { commonColors, studentColors } from "@/src/theme";

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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: commonColors.scrim }}>
        <View className="bg-app-surface rounded-t-[40px] p-6 pb-10 shadow-2xl">
          
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-title font-bold text-app-textPrimary">{dateKey}</Text>
            {existingEntry && (
              <TouchableOpacity onPress={() => { onDelete(dateKey); onClose(); }} accessibilityRole="button">
                <Text className="text-app-error font-bold text-caption bg-app-errorSoft px-3 py-2 rounded-full">Delete</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Mood Selection */}
          <Text className="text-app-textMuted font-bold text-caption mb-4 uppercase tracking-widest">How were you feeling?</Text>
          <View className="flex-row mb-6">
            {MOOD_ORDER.map((m) => {
              const isSelected = mood === m;
              const cfg = MOOD_CONFIG[m];
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMood(m)}
                  style={{
                    borderColor: isSelected ? cfg.color : studentColors.borderSoft,
                    backgroundColor: isSelected ? `${cfg.color}15` : studentColors.background,
                    borderWidth: isSelected ? 2 : 1,
                  }}
                  className="flex-1 py-3 mx-1 rounded-2xl items-center justify-center"
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Image source={cfg.icon} className="w-7 h-7 mb-1" resizeMode="contain" />
                  <Text style={{ color: isSelected ? cfg.color : studentColors.textSecondary }} className="text-caption font-bold">{cfg.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Note Input */}
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="What happened today? (Optional)"
            className="bg-app-background text-app-textPrimary p-4 rounded-3xl border border-app-borderSoft mb-8 min-h-[100px]"
            placeholderTextColor={studentColors.textMuted}
            multiline
            textAlignVertical="top"
          />

          {/* Action Buttons */}
          <View className="flex-row gap-4">
            <TouchableOpacity onPress={onClose} className="flex-1 p-4 rounded-2xl bg-app-surfaceMuted items-center" accessibilityRole="button">
              <Text className="font-bold text-app-textSecondary">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleSave} 
              disabled={!mood}
              className={`flex-[2] p-4 rounded-2xl items-center shadow-md ${mood ? "bg-app-primary" : "bg-app-textMuted"}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: !mood }}
            >
              <Text className="text-app-surface font-bold">Save Changes</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};
