import React, { useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withRepeat,
  withTiming,
  cancelAnimation,
  interpolate,
  Easing,
} from "react-native-reanimated";

const BUTTON_SIZE = 92;
const BUTTON_RADIUS = 46;

// Fallback palette if a mood doesn't carry its own `color` field.
// Swap these for your actual mood.config colors if they differ.
const MOOD_COLORS: Record<string, string> = {
  Awful: "#B5555C",
  Bad: "#C97B4A",
  Meh: "#B8A78C",
  Good: "#7C9885",
  Great: "#4A7856",
};

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const bigint = parseInt(
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

interface PulsingMoodButtonProps {
  children: React.ReactNode;
  /** Pass the current mood id, e.g. selectedMood */
  moodId: string | null;
  /** Optional: pass mood.color directly if your moods array has one */
  colorOverride?: string;
  active?: boolean;
}

export const PulsingMoodButton: React.FC<PulsingMoodButtonProps> = ({
  children,
  moodId,
  colorOverride,
  active = true,
}) => {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = active && !reduceMotion;

  const color = colorOverride ?? (moodId ? MOOD_COLORS[moodId] : undefined) ?? "#7C9885";

  const glowColor = useMemo(() => hexToRgba(color, 0.35), [color]);
  const outerGlow = useMemo(() => hexToRgba(color, 0.18), [color]);

  const pulse = useSharedValue(0);   // drives inner border 0→1→0
  const outerPulse = useSharedValue(0); // drives outer ring, offset timing

  useEffect(() => {
    if (shouldAnimate) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true // yoyo, full cycle ≈ 2400ms
      );
      outerPulse.value = withRepeat(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true // slightly slower, gives layered/organic feel
      );
    } else {
      cancelAnimation(pulse);
      cancelAnimation(outerPulse);
      pulse.value = 0;
      outerPulse.value = 0;
    }

    return () => {
      cancelAnimation(pulse);
      cancelAnimation(outerPulse);
    };
  }, [shouldAnimate]);

  // Inner border: tight to the button, crisp, more opaque
  const innerBorderStyle = useAnimatedStyle(() => ({
    borderColor: color,
    opacity: interpolate(pulse.value, [0, 1], [0.35, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.03]) }],
  }));

  // Outer ring: sits further out, softer, acts as the "glow"
  const outerRingStyle = useAnimatedStyle(() => ({
    borderColor: glowColor,
    opacity: interpolate(outerPulse.value, [0, 1], [0.2, 0.55]),
    transform: [{ scale: interpolate(outerPulse.value, [0, 1], [1.08, 1.18]) }],
  }));

  // Extra soft glow wash sitting between the two, using shadow for blur-like effect
  const glowWashStyle = useAnimatedStyle(() => ({
    shadowColor: color,
    opacity: interpolate(pulse.value, [0, 1], [0.3, 0.8]),
    shadowOpacity: interpolate(pulse.value, [0, 1], [0.25, 0.5]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1.02, 1.08]) }],
  }));

  return (
    <View style={styles.wrapper}>
      {shouldAnimate && (
        <>
          <Animated.View
            pointerEvents="none"
            style={[styles.outerRing, { backgroundColor: outerGlow }, outerRingStyle]}
          />
          <Animated.View pointerEvents="none" style={[styles.glowWash, glowWashStyle]} />
        </>
      )}

      {/* Original TouchableOpacity — untouched */}
      {children}

      {shouldAnimate && (
        <Animated.View pointerEvents="none" style={[styles.innerBorder, innerBorderStyle]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  innerBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_RADIUS,
    borderWidth: 2,
  },
  outerRing: {
    position: "absolute",
    top: -10,
    left: -10,
    width: BUTTON_SIZE + 20,
    height: BUTTON_SIZE + 20,
    borderRadius: BUTTON_RADIUS + 10,
    borderWidth: 2,
  },
  glowWash: {
    position: "absolute",
    top: 0,
    left: 0,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_RADIUS,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 18,
    elevation: 8, // Android: shadow needs elevation to render at all
  },
});