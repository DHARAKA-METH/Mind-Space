// Appointments/components/CounselorCard.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

import {
  commonColors,
  spacing,
  studentColors,
  typography,
} from "@/src/theme";

import { Counselor } from "../types";

interface CounselorCardProps {
  counselor: Counselor;
  isChosen: boolean;
  myCount: number;
  onSelect: () => void;
}

export const CounselorCard: React.FC<CounselorCardProps> = ({
  counselor,
  isChosen,
  myCount,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      onPress={onSelect}
      style={{
        borderColor: isChosen ? counselor.color : studentColors.border,
        borderWidth: isChosen ? 2 : 1.5,
        backgroundColor: isChosen ? counselor.bgColor : studentColors.surface,
        marginBottom: spacing.xs,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.sm,
      }}
    >
      <View
        style={{
          backgroundColor: counselor.bgColor,
          width: 48,
          height: 48,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          marginRight: spacing.sm,
        }}
      >
        <Text style={{ fontSize: 24 }}>{counselor.avatar}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: isChosen ? counselor.color : studentColors.textPrimary,
            fontSize: typography.fontSize.body,
            fontWeight: typography.fontWeight.bold,
          }}
        >
          {counselor.name}
        </Text>
        <Text
          style={{
            fontSize: typography.fontSize.caption,
            color: studentColors.textSecondary,
            marginTop: 2,
          }}
        >
          {counselor.specialties.join(" · ")}
        </Text>
        {myCount > 0 && (
          <View
            style={{
              backgroundColor: counselor.bgColor,
              alignSelf: "flex-start",
              marginTop: 4,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                color: counselor.color,
                fontSize: typography.fontSize.caption,
                fontWeight: typography.fontWeight.bold,
              }}
            >
              {myCount} session{myCount > 1 ? "s" : ""} booked
            </Text>
          </View>
        )}
      </View>
      <View
        style={{
          backgroundColor: isChosen ? counselor.color : studentColors.surfaceMuted,
          paddingHorizontal: spacing.sm,
          paddingVertical: 6,
          borderRadius: 10,
        }}
      >
        <Text
          style={{
            color: isChosen ? commonColors.white : studentColors.textPrimary,
            fontSize: typography.fontSize.caption,
            fontWeight: typography.fontWeight.bold,
          }}
        >
          {isChosen ? "✓ Chosen" : "Select"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
