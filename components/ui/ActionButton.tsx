import { ThemedText } from "@/components/ThemedText";
import { spacing, useTheme } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleProp, ViewStyle } from "react-native";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

/** Icon over a short label, for secondary actions under the Play button (My List, Trailer). */
export function ActionButton({
  icon,
  label,
  onPress,
  active,
  style,
  accessibilityLabel,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        { alignItems: "center", gap: spacing.xs, minWidth: 64, opacity: pressed ? 0.6 : 1 },
        style,
      ]}
    >
      <MaterialIcons name={icon} size={26} color={theme.text} />
      <ThemedText variant="caption" tone={active ? "primary" : "secondary"}>
        {label}
      </ThemedText>
    </Pressable>
  );
}
