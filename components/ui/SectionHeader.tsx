import { ThemedText } from "@/components/ThemedText";
import { spacing, useTheme } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleProp, View, ViewStyle } from "react-native";

/** Row title with an optional "See all" link. Horizontal padding = screen gutter. */
export function SectionHeader({
  title,
  onSeeAll,
  style,
}: {
  title: string;
  onSeeAll?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          marginTop: spacing.xl,
          marginBottom: spacing.md,
        },
        style,
      ]}
    >
      <ThemedText variant="section" numberOfLines={1} style={{ flexShrink: 1 }}>
        {title}
      </ThemedText>
      {onSeeAll && (
        <Pressable
          onPress={onSeeAll}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`See all ${title}`}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <ThemedText variant="callout" tone="secondary">
            See all
          </ThemedText>
          <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}
