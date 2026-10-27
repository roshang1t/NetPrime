import { ThemedText } from "@/components/ThemedText";
import { spacing } from "@/constants/theme";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { IconButton } from "./IconButton";

/** Row height of a tab header, so tabs with and without a trailing control line up */
const TAB_ROW_HEIGHT = 32;

/**
 * Screen title with optional back button, subtitle and trailing element.
 * `tab` is the smaller header shared by the Home, Search and More tabs.
 */
export function ScreenHeader({
  title,
  subtitle,
  back,
  trailing,
  tab,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  trailing?: React.ReactNode;
  tab?: boolean;
}) {
  const router = useRouter();
  return (
    <View
      style={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: tab ? spacing.md : spacing.lg,
      }}
    >
      {back && (
        <IconButton
          icon="arrow-back"
          onPress={() => router.back()}
          accessibilityLabel="Back"
          style={{ marginLeft: -spacing.sm, marginBottom: spacing.sm }}
        />
      )}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          minHeight: tab ? TAB_ROW_HEIGHT : undefined,
        }}
      >
        <ThemedText
          variant={tab ? "title" : "display"}
          accessibilityRole="header"
          style={{ flex: 1 }}
          numberOfLines={1}
        >
          {title}
        </ThemedText>
        {trailing}
      </View>
      {subtitle ? (
        <ThemedText variant="body" tone="secondary" style={{ marginTop: spacing.xs }}>
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}
