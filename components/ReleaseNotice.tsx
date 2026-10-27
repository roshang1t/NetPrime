import { ThemedText } from "@/components/ThemedText";
import { radius, spacing, useTheme } from "@/constants/theme";
import { formatDate, isReleased } from "@/utils/dates";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

/** Takes the Play button's place for titles that aren't out yet. */
export default function ReleaseNotice({
  date,
  label = "Coming",
}: {
  date?: string | null;
  label?: string;
}) {
  const theme = useTheme();
  // A past date on an unreleased title means it was delayed or cancelled
  const upcoming = date && !isReleased(date) ? date : null;
  return (
    <View
      accessibilityRole="text"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        minHeight: 48,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
        borderCurve: "continuous",
        backgroundColor: theme.surface,
      }}
    >
      <MaterialIcons name="event" size={22} color={theme.textSecondary} />
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText variant="headline">
          {upcoming ? `${label} ${formatDate(upcoming)}` : "Release date not announced"}
        </ThemedText>
        <ThemedText variant="caption" tone="secondary">
          Add it to My List to find it when it&apos;s out.
        </ThemedText>
      </View>
    </View>
  );
}
