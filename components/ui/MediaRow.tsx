import { ThemedText } from "@/components/ThemedText";
import { radius, spacing, useTheme } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Pressable, View } from "react-native";

/** List row with a small poster, title, subtitle and an optional trailing control. */
export function MediaRow({
  posterPath,
  title,
  subtitle,
  onPress,
  trailing,
}: {
  posterPath?: string | null;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 52,
          height: 78,
          borderRadius: radius.sm,
          borderCurve: "continuous",
          overflow: "hidden",
          backgroundColor: theme.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {posterPath ? (
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w185${posterPath}` }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
        ) : (
          <MaterialIcons name="movie" size={22} color={theme.textTertiary} />
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText variant="headline" numberOfLines={2}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText variant="callout" tone="secondary" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {trailing}
    </Pressable>
  );
}
