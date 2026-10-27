import { ThemedText } from "@/components/ThemedText";
import { radius, spacing, useTheme } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: IconName;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: "center", paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.full,
          backgroundColor: theme.surface,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.lg,
        }}
      >
        <MaterialIcons name={icon} size={28} color={theme.textSecondary} />
      </View>
      <ThemedText variant="headline" style={{ textAlign: "center" }}>
        {title}
      </ThemedText>
      {message ? (
        <ThemedText
          variant="body"
          tone="secondary"
          style={{ textAlign: "center", marginTop: spacing.xs, maxWidth: 300 }}
        >
          {message}
        </ThemedText>
      ) : null}
      {action ? <View style={{ marginTop: spacing.lg }}>{action}</View> : null}
    </View>
  );
}
