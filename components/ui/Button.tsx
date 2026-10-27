import { ThemedText } from "@/components/ThemedText";
import { radius, spacing, useTheme } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, StyleProp, ViewStyle } from "react-native";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

const sizes = {
  sm: { height: 36, paddingHorizontal: spacing.md, icon: 18 },
  md: { height: 48, paddingHorizontal: spacing.lg, icon: 22 },
} as const;

/**
 * primary: filled accent (the one main action on a screen)
 * secondary: filled surface
 * ghost: no background
 */
export function Button({
  title,
  icon,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  onPress,
  style,
  accessibilityLabel,
}: {
  title?: string;
  icon?: IconName;
  variant?: "primary" | "secondary" | "ghost";
  size?: keyof typeof sizes;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  const background =
    variant === "primary" ? theme.accent : variant === "secondary" ? theme.surfaceRaised : "transparent";
  const foreground = variant === "primary" ? theme.onAccent : theme.text;
  const s = sizes[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          height: s.height,
          paddingHorizontal: title ? s.paddingHorizontal : 0,
          width: title ? undefined : s.height,
          borderRadius: radius.lg,
          borderCurve: "continuous",
          backgroundColor: background,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon && <MaterialIcons name={icon} size={s.icon} color={foreground} />}
          {title ? (
            <ThemedText variant="headline" style={{ color: foreground }}>
              {title}
            </ThemedText>
          ) : null}
        </>
      )}
    </Pressable>
  );
}
