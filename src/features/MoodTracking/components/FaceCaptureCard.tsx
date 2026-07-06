import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";

const ceylon = {
  ink: "#3D2E1F",
  muted: "#8A7A63",
  mutedLight: "#B8A78C",
  teaGreen: "#4A7856",
  sage: "#7C9885",
  terracotta: "#C97B4A",
  sand: "#F0E4D3",
};

export interface CapturedFace {
  uri: string;
  timestamp: string;
}

interface FaceCaptureCardProps {
  onCapture?: (photo: CapturedFace) => void;
  onRemove?: () => void;
}

export const FaceCaptureCard: React.FC<FaceCaptureCardProps> = ({ onCapture, onRemove }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [expanded, setExpanded] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photo, setPhoto] = useState<CapturedFace | null>(null);
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const flashOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const shutterScale = useSharedValue(1);

  const flashStyle = useAnimatedStyle(() => ({ opacity: flashOpacity.value }));
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));
  const shutterStyle = useAnimatedStyle(() => ({ transform: [{ scale: shutterScale.value }] }));

  const handleToggleExpand = async () => {
    Haptics.selectionAsync().catch(() => {});
    if (!expanded && !permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setExpanded(true); // still expand to show the "permission needed" state
        return;
      }
    }
    setExpanded((prev) => !prev);
    if (expanded) setCameraOpen(false);
  };

  const handleOpenCamera = () => {
    Haptics.selectionAsync().catch(() => {});
    setCameraOpen(true);
  };

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    try {
      setCapturing(true);
      shutterScale.value = withSequence(withTiming(0.85, { duration: 90 }), withTiming(1, { duration: 140 }));

      const result = await cameraRef.current.takePictureAsync({ quality: 0.6 });

      // Brief flash + checkmark feedback so the capture feels confirmed
      flashOpacity.value = withSequence(withTiming(0.8, { duration: 60 }), withTiming(0, { duration: 220 }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      const captured: CapturedFace = {
        uri: result.uri,
        timestamp: new Date().toISOString(),
      };

      // eslint-disable-next-line no-console
      console.log("Face captured:", captured);

      setPhoto(captured);
      setCameraOpen(false);
      onCapture?.(captured);

      checkScale.value = withSequence(
        withTiming(1.2, { duration: 180, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 140 })
      );
    } catch (error) {
      console.log("Capture failed:", error);
    } finally {
      setCapturing(false);
    }
  };

  const handleRetake = () => {
    Haptics.selectionAsync().catch(() => {});
    setPhoto(null);
    setCameraOpen(true);
  };

  const handleRemove = () => {
    Haptics.selectionAsync().catch(() => {});
    setPhoto(null);
    setCameraOpen(false);
    onRemove?.();
  };

  return (
    <View className="rounded-3xl bg-white p-4 mb-4">
      {/* Header row — always visible, toggles the card */}
      <TouchableOpacity
        onPress={handleToggleExpand}
        activeOpacity={0.7}
        className="flex-row items-center justify-between"
      >
        <View className="flex-row items-center" style={{ gap: 10 }}>
          <View
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: `${ceylon.sage}18` }}
          >
            <Ionicons name="camera-outline" size={18} color={ceylon.sage} />
          </View>
          <View>
            <Text className="text-sm font-bold" style={{ color: ceylon.ink }}>
              Capture a moment
            </Text>
            <Text className="text-xs" style={{ color: ceylon.muted }}>
              Optional — pairs your expression with today&apos s check-in
            </Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={ceylon.mutedLight}
        />
      </TouchableOpacity>

      {expanded && (
        <View className="mt-4">
          {/* Permission denied state */}
          {permission && !permission.granted && !permission.canAskAgain && (
            <View className="items-center py-6 rounded-2xl" style={{ backgroundColor: ceylon.sand }}>
              <Ionicons name="lock-closed-outline" size={22} color={ceylon.muted} />
              <Text className="text-xs text-center mt-2 px-6" style={{ color: ceylon.muted }}>
                Camera access is off. Enable it in your device settings to use this feature.
              </Text>
            </View>
          )}

          {/* Live camera view */}
          {cameraOpen && permission?.granted && (
            <View className="rounded-2xl overflow-hidden" style={{ height: 340 }}>
              <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" />

              {/* Flash overlay */}
              <Animated.View
                pointerEvents="none"
                style={[
                  { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#fff" },
                  flashStyle,
                ]}
              />

              {/* Soft framing guide so the user knows where to position their face */}
              <View
                pointerEvents="none"
                className="absolute self-center rounded-full"
                style={{
                  top: 40,
                  width: 200,
                  height: 240,
                  borderWidth: 2,
                  borderColor: "rgba(255,255,255,0.6)",
                  borderStyle: "dashed",
                  borderRadius: 120,
                }}
              />

              <View className="absolute bottom-0 left-0 right-0 items-center pb-5">
                <View className="flex-row items-center" style={{ gap: 24 }}>
                  <TouchableOpacity
                    onPress={() => setCameraOpen(false)}
                    className="w-11 h-11 rounded-full items-center justify-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
                  >
                    <Ionicons name="close" size={20} color="#fff" />
                  </TouchableOpacity>

                  <Animated.View style={shutterStyle}>
                    <TouchableOpacity
                      onPress={handleCapture}
                      disabled={capturing}
                      className="w-16 h-16 rounded-full items-center justify-center"
                      style={{ backgroundColor: "#fff", borderWidth: 3, borderColor: ceylon.sage }}
                    >
                      {capturing ? (
                        <Ionicons name="hourglass-outline" size={22} color={ceylon.sage} />
                      ) : (
                        <View
                          className="rounded-full"
                          style={{ width: 48, height: 48, backgroundColor: ceylon.sage }}
                        />
                      )}
                    </TouchableOpacity>
                  </Animated.View>

                  <View style={{ width: 44 }} />
                </View>
              </View>
            </View>
          )}

          {/* Prompt to open camera (not yet opened, no photo yet) */}
          {!cameraOpen && !photo && permission?.granted && (
            <TouchableOpacity
              onPress={handleOpenCamera}
              activeOpacity={0.8}
              className="items-center justify-center rounded-2xl py-8"
              style={{ backgroundColor: ceylon.sand, borderWidth: 1.5, borderColor: ceylon.sage, borderStyle: "dashed" }}
            >
              <Ionicons name="camera" size={26} color={ceylon.sage} />
              <Text className="text-xs font-semibold mt-2" style={{ color: ceylon.ink }}>
                Tap to open camera
              </Text>
            </TouchableOpacity>
          )}

          {/* Captured preview */}
          {photo && (
            <View className="items-center">
              <View className="relative">
                <Image
                  source={{ uri: photo.uri }}
                  style={{ width: 160, height: 200, borderRadius: 20 }}
                  resizeMode="cover"
                />
                <Animated.View
                  style={[
                    { position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: ceylon.teaGreen, alignItems: "center", justifyContent: "center" },
                    checkStyle,
                  ]}
                >
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </Animated.View>
              </View>

              <View className="flex-row mt-4" style={{ gap: 12 }}>
                <TouchableOpacity
                  onPress={handleRetake}
                  className="flex-row items-center rounded-xl px-4 py-2"
                  style={{ backgroundColor: ceylon.sand, gap: 6 }}
                >
                  <Ionicons name="refresh" size={14} color={ceylon.ink} />
                  <Text className="text-xs font-semibold" style={{ color: ceylon.ink }}>
                    Retake
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRemove}
                  className="flex-row items-center rounded-xl px-4 py-2"
                  style={{ backgroundColor: "#F7DDD6", gap: 6 }}
                >
                  <Ionicons name="trash-outline" size={14} color="#B5555C" />
                  <Text className="text-xs font-semibold" style={{ color: "#B5555C" }}>
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>

              <Text className="text-[10px] mt-3 text-center px-4" style={{ color: ceylon.mutedLight }}>
                Only used to enrich your own check-in — never shared publicly.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};