import { radius as radii, useTheme } from "@/constants/theme";
import React, { useEffect } from "react";
import { AccessibilityInfo, Animated, DimensionValue, StyleProp, ViewStyle } from "react-native";

// One pulse shared by every skeleton on screen, so they breathe in sync and
// only a single native animation runs no matter how many blocks are mounted.
const pulse = new Animated.Value(1);
let loop: Animated.CompositeAnimation | null = null;
let mounted = 0;

function start() {
  mounted++;
  if (loop) return;
  AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
    if (reduce || loop || mounted === 0) return;
    loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
  });
}

function stop() {
  mounted--;
  if (mounted === 0 && loop) {
    loop.stop();
    loop = null;
    pulse.setValue(1);
  }
}

/** Pulsing placeholder block. Size it like the content it stands in for. */
export function Skeleton({
  width = "100%",
  height,
  radius = radii.sm,
  style,
}: {
  width?: DimensionValue;
  height: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  useEffect(() => {
    start();
    return stop;
  }, []);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: radius,
          borderCurve: "continuous",
          backgroundColor: theme.surfaceRaised,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}
