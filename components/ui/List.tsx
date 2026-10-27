import { ThemedText } from "@/components/ThemedText";
import { radius, spacing, useTheme } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

/** Grouped settings section: optional caption title over a rounded surface. */
export function ListGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  const theme = useTheme();
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={{ marginBottom: spacing.xl }}>
      {title ? (
        <ThemedText
          variant="overline"
          tone="tertiary"
          style={{ marginBottom: spacing.sm, marginLeft: spacing.xs }}
        >
          {title}
        </ThemedText>
      ) : null}
      <View
        style={{
          backgroundColor: theme.surface,
          borderRadius: radius.lg,
          borderCurve: "continuous",
          overflow: "hidden",
        }}
      >
        {rows.map((row, i) => (
          <View key={i}>
            {i > 0 && (
              <View style={{ height: 1, backgroundColor: theme.separator, marginLeft: 52 }} />
            )}
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}

export function ListRow({
  icon,
  label,
  value,
  onPress,
  destructive,
  disabled,
  accessory = "chevron",
}: {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  accessory?: "chevron" | "external" | "none";
}) {
  const theme = useTheme();
  const tint = destructive ? theme.danger : theme.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        minHeight: 52,
        paddingHorizontal: spacing.lg,
        backgroundColor: pressed ? theme.surfaceRaised : "transparent",
        opacity: disabled ? 0.5 : 1,
      })}
    >
      <MaterialIcons name={icon} size={22} color={destructive ? theme.danger : theme.textSecondary} />
      <ThemedText variant="body" numberOfLines={1} style={{ flex: 1, color: tint }}>
        {label}
      </ThemedText>
      {value ? (
        <ThemedText variant="callout" tone="secondary" numberOfLines={1} style={{ maxWidth: "45%" }}>
          {value}
        </ThemedText>
      ) : null}
      {accessory !== "none" && (
        <MaterialIcons
          name={accessory === "external" ? "open-in-new" : "chevron-right"}
          size={accessory === "external" ? 18 : 22}
          color={theme.textTertiary}
        />
      )}
    </Pressable>
  );
}
