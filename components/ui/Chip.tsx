import { ThemedText } from "@/components/ThemedText";
import { radius, spacing, useTheme } from "@/constants/theme";
import React from "react";
import { Pressable, StyleProp, ViewStyle } from "react-native";

/** Pill used for filters, seasons and servers. Selected = accent fill. */
export function Chip({
  label,
  selected,
  onPress,
  leading,
  trailing,
  style,
  accessibilityLabel,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          height: 36,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.full,
          backgroundColor: selected ? theme.accent : theme.surface,
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {leading}
      <ThemedText variant="callout" style={{ color: selected ? theme.onAccent : theme.text }}>
        {label}
      </ThemedText>
      {trailing}
    </Pressable>
  );
}
