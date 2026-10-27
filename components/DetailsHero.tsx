import { ThemedText } from "@/components/ThemedText";
import { IconButton } from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { radius, spacing, useTheme } from "@/constants/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");
const HERO_HEIGHT = Math.round(height * 0.55);

/**
 * Full-bleed backdrop that fades into the page, with the title and a meta line
 * ("2024 · 2h 19m · ★ 8.4") on top. Shared by the movie and show pages.
 */
export default function DetailsHero({
  backdropPath,
  posterPath,
  title,
  meta,
  genres,
}: {
  backdropPath?: string | null;
  posterPath?: string | null;
  title: string;
  meta: (string | null | undefined | false)[];
  genres?: string;
}) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Portrait poster fills a tall hero better than a stretched landscape still
  const uri = posterPath
    ? `https://image.tmdb.org/t/p/w780${posterPath}`
    : backdropPath
      ? `https://image.tmdb.org/t/p/w780${backdropPath}`
      : null;

  return (
    <View style={{ height: HERO_HEIGHT, backgroundColor: theme.surface }}>
      {uri && (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={300}
        />
      )}
      <LinearGradient
        colors={[theme.background + "00", theme.background + "99", theme.background]}
        locations={[0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <IconButton
        icon="arrow-back"
        overlay
        onPress={() => router.back()}
        accessibilityLabel="Back"
        style={{ position: "absolute", top: insets.top + spacing.sm, left: spacing.lg }}
      />
      <View
        style={{
          position: "absolute",
          left: spacing.lg,
          right: spacing.lg,
          bottom: spacing.lg,
          gap: spacing.xs,
        }}
      >
        <ThemedText variant="display" numberOfLines={3}>
          {title}
        </ThemedText>
        <ThemedText variant="callout" tone="secondary">
          {meta.filter(Boolean).join("  ·  ")}
        </ThemedText>
        {genres ? (
          <ThemedText variant="caption" tone="tertiary" numberOfLines={1}>
            {genres}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Mirrors the loaded page (hero, title, meta, Play, actions, overview) so
 * nothing jumps when content arrives. Back stays usable while loading.
 */
export function DetailsSkeleton() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View accessibilityLabel="Loading" style={{ flex: 1, backgroundColor: theme.background }}>
      <Skeleton height={HERO_HEIGHT} radius={0} />
      <IconButton
        icon="arrow-back"
        overlay
        onPress={() => router.back()}
        accessibilityLabel="Back"
        style={{ position: "absolute", top: insets.top + spacing.sm, left: spacing.lg }}
      />
      <View style={{ padding: spacing.lg, gap: spacing.lg, marginTop: -spacing.xxxl }}>
        <View style={{ gap: spacing.sm }}>
          <Skeleton width="70%" height={32} />
          <Skeleton width="45%" height={14} />
        </View>
        <Skeleton height={48} radius={radius.lg} />
        <View style={{ flexDirection: "row", gap: spacing.xl }}>
          <Skeleton width={56} height={40} />
          <Skeleton width={56} height={40} />
        </View>
        <View style={{ gap: spacing.sm }}>
          <Skeleton height={14} />
          <Skeleton height={14} />
          <Skeleton width="60%" height={14} />
        </View>
      </View>
    </View>
  );
}
