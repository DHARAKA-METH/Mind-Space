// Appointments/components/CounselorCard.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
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
        borderColor: isChosen ? counselor.color : "#E5E7EB",
        borderWidth: isChosen ? 2 : 1.5,
        backgroundColor: isChosen ? counselor.bgColor : "#FFFFFF",
        marginBottom: 8,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
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
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 24 }}>{counselor.avatar}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: isChosen ? counselor.color : "#111827",
            fontSize: 14,
            fontWeight: "700",
          }}
        >
          {counselor.name}
        </Text>
        <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
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
                fontSize: 10,
                fontWeight: "700",
              }}
            >
              {myCount} session{myCount > 1 ? "s" : ""} booked
            </Text>
          </View>
        )}
      </View>
      <View
        style={{
          backgroundColor: isChosen ? counselor.color : "#F3F4F6",
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 10,
        }}
      >
        <Text
          style={{
            color: isChosen ? "#fff" : "#374151",
            fontSize: 12,
            fontWeight: "700",
          }}
        >
          {isChosen ? "✓ Chosen" : "Select"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
