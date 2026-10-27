import { artwork, radius, useTheme } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleProp, ViewStyle } from "react-native";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

/**
 * 40pt round icon button. `overlay` puts a dark translucent disc behind it so it
 * stays legible on top of artwork.
 */
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  overlay,
  color,
  style,
}: {
  icon: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  overlay?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        {
          width: 40,
          height: 40,
          borderRadius: radius.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: overlay ? artwork.button : "transparent",
          opacity: pressed ? 0.6 : 1,
        },
        style,
      ]}
    >
      <MaterialIcons name={icon} size={24} color={color ?? (overlay ? artwork.text : theme.text)} />
    </Pressable>
  );
}
