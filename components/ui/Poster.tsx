import { ThemedText } from "@/components/ThemedText";
import { poster, radius, spacing, useTheme } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { posterUrl } from "@/utils/images";
import { Skeleton } from "./Skeleton";
import React from "react";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

/**
 * 2:3 poster used by every row and grid. Optional title/subtitle sit below the
 * artwork; `badge` renders over the bottom-right corner, `overlay` covers the
 * whole artwork (e.g. a Remove action after a long press).
 */
export function Poster({
  path,
  width = poster.row.width,
  title,
  subtitle,
  badge,
  overlay,
  onPress,
  onLongPress,
  accessibilityHint,
  style,
}: {
  path?: string | null;
  width?: number;
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  overlay?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const height = width * poster.aspect;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [{ width, opacity: pressed ? 0.75 : 1 }, style]}
    >
      <View
        style={{
          width,
          height,
          borderRadius: radius.md,
          borderCurve: "continuous",
          overflow: "hidden",
          backgroundColor: theme.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {path ? (
          <Image
            source={{ uri: posterUrl(path) }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={300}
          />
        ) : (
          <MaterialIcons name="movie" size={28} color={theme.textTertiary} />
        )}
        {badge ? (
          <View style={{ position: "absolute", right: spacing.sm, bottom: spacing.sm }}>{badge}</View>
        ) : null}
        {overlay ? <View style={StyleSheet.absoluteFill}>{overlay}</View> : null}
      </View>
      {title ? (
        <ThemedText variant="callout" numberOfLines={1} style={{ marginTop: spacing.sm }}>
          {title}
        </ThemedText>
      ) : null}
      {subtitle ? (
        <ThemedText variant="caption" tone="secondary" numberOfLines={1} style={{ marginTop: 2 }}>
          {subtitle}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

/** Pulsing 2:3 block shown while a row or grid is loading. */
export function PosterPlaceholder({ width = poster.row.width }: { width?: number }) {
  return <Skeleton width={width} height={width * poster.aspect} radius={radius.md} />;
}

/** Four pulsing posters for a loading horizontal row. */
export function PosterRowPlaceholder() {
  return (
    <View
      accessibilityLabel="Loading"
      style={{ flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.lg, overflow: "hidden" }}
    >
      {[1, 2, 3, 4].map((i) => (
        <PosterPlaceholder key={i} />
      ))}
    </View>
  );
}

/** Rows of pulsing posters for a loading grid. */
export function PosterGridPlaceholder({
  width,
  columns,
  rows = 2,
}: {
  width: number;
  columns: number;
  rows?: number;
}) {
  return (
    <View accessibilityLabel="Loading" style={{ gap: spacing.md }}>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={{ flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.lg }}>
          {Array.from({ length: columns }, (_, col) => (
            <PosterPlaceholder key={col} width={width} />
          ))}
        </View>
      ))}
    </View>
  );
}
