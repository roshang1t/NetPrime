import RegionPicker from "@/components/RegionPicker";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Poster, PosterRowPlaceholder } from "@/components/ui/Poster";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { artwork, radius, spacing, useTheme } from "@/constants/theme";
import { useMovieContext } from "@/contexts/movieContext";
import { isAbortError, tmdbGet } from "@/utils/api";
import { useCountryName } from "@/utils/countries";
import { hideFromContinueWatching, useContinueWatching } from "@/utils/history";
import { flagEmoji, useRegion } from "@/utils/region";
import { toggleWatchlist, useIsInWatchlist, useWatchlist } from "@/utils/watchlist";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, FlatList, Pressable, StyleSheet, View } from "react-native";

const { width, height } = Dimensions.get("window");
const ROW_LIMIT = 15;

const rowListStyle = { paddingHorizontal: spacing.lg, gap: spacing.md } as const;

/** App name + compact region chip ("🇮🇳 IN ▾") that opens the region picker. */
export function HomeTopBar() {
  const theme = useTheme();
  const region = useRegion();
  const name = useCountryName(region);
  const [open, setOpen] = useState(false);

  return (
    <>
      <ScreenHeader
        tab
        title="NetPrime"
        trailing={
          <Pressable
            onPress={() => setOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Region: ${name}. Change region`}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
              height: 32,
              paddingLeft: spacing.md,
              paddingRight: spacing.sm,
              borderRadius: radius.full,
              backgroundColor: theme.surface,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <ThemedText variant="callout">{flagEmoji(region)}</ThemedText>
            <ThemedText variant="callout">{region}</ThemedText>
            <MaterialIcons name="expand-more" size={18} color={theme.textSecondary} />
          </Pressable>
        }
      />
      <RegionPicker visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Billboard for the #1 trending show, with Watch and My List under it. */
export function HomeHero() {
  const theme = useTheme();
  const router = useRouter();
  const { series, loadingSeries } = useMovieContext();
  const show = series[0];
  const saved = useIsInWatchlist(show?.id ?? -1, "tv");

  const heroWidth = width - spacing.lg * 2;
  const heroHeight = Math.min(heroWidth * 1.35, height * 0.62);

  if (!show) {
    // Failure is reported once, by the Trending Shows row below
    return loadingSeries ? (
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Skeleton height={heroHeight} radius={radius.xl} />
      </View>
    ) : null;
  }
  const open = () =>
    router.push({ pathname: "/(player)/tvDetails", params: { id: String(show.id) } });

  return (
    <View style={{ paddingHorizontal: spacing.lg }}>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`${show.name}, number one trending show`}
        style={({ pressed }) => ({
          height: heroHeight,
          borderRadius: radius.xl,
          borderCurve: "continuous",
          overflow: "hidden",
          backgroundColor: theme.surface,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        {show.poster_path && (
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w780${show.poster_path}` }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={300}
          />
        )}
                <LinearGradient
          colors={[artwork.scrimFrom, artwork.scrimTo]}
          locations={[0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ position: "absolute", left: spacing.lg, right: spacing.lg, bottom: spacing.lg, gap: spacing.md }}>
          <View style={{ gap: spacing.xs }}>
            <ThemedText variant="overline" style={{ color: artwork.textMuted }}>
              #1 Trending Show
            </ThemedText>
            <ThemedText variant="display" numberOfLines={2} style={{ color: artwork.text }}>
              {show.name}
            </ThemedText>
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Button title="Watch" icon="play-arrow" onPress={open} style={{ flex: 1 }} />
            <Button
              variant="secondary"
              icon={saved ? "check" : "add"}
              accessibilityLabel={saved ? "Remove from My List" : "Add to My List"}
              onPress={() =>
                toggleWatchlist({ id: show.id, type: "tv", title: show.name, poster_path: show.poster_path })
              }
            />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

/**
 * Last watched movies and episodes; tapping one resumes it in the player.
 * Long press shows a Remove button on that card. Hidden when empty.
 */
export function ContinueWatchingRow() {
  const router = useRouter();
  const history = useContinueWatching();
  // Card currently showing its Remove button (one at a time)
  const [removingId, setRemovingId] = useState<string | null>(null);

  if (history.length === 0) return null;

  function resume(item: any) {
    const params: Record<string, string> = {
      id: String(item.id ?? ""),
      type: item.type === "tv" ? "tv" : "movie",
      title: item.title || item.name || "",
      poster_path: item.poster_path || "",
    };
    if (item.type === "tv") {
      if (item.season !== undefined && item.season !== null) params.season = String(item.season);
      if (item.episode !== undefined && item.episode !== null) params.ep = String(item.episode);
    }
    router.push({ pathname: "/(player)/player", params });
  }

  return (
    <>
      <SectionHeader title="Continue Watching" onSeeAll={() => router.push("/watchHistory")} />
      <FlatList
        data={history.slice(0, ROW_LIMIT)}
        horizontal
        keyExtractor={(item, idx) => `${item.type}-${item.id ?? idx}`}
        extraData={removingId}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={rowListStyle}
        renderItem={({ item }) => {
          const title = item.title || item.name || "Untitled";
          const isRemoving = removingId === String(item.id);
          return (
            <Poster
              path={item.poster_path}
              title={title}
              subtitle={item.type === "tv" ? `S${item.season ?? "-"} · E${item.episode ?? "-"}` : "Movie"}
              // While the Remove button shows, a tap on the card cancels instead of playing
              onPress={() => (isRemoving ? setRemovingId(null) : resume(item))}
              onLongPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setRemovingId(String(item.id));
              }}
              accessibilityHint="Long press for the option to remove it from Continue Watching"
              badge={isRemoving ? undefined : <PlayBadge />}
              overlay={
                isRemoving ? (
                  <RemoveOverlay
                    title={title}
                    onRemove={() => {
                      hideFromContinueWatching(item.id);
                      setRemovingId(null);
                    }}
                  />
                ) : undefined
              }
            />
          );
        }}
      />
    </>
  );
}

/** Dims the artwork and shows a Remove button on top of it. */
function RemoveOverlay({ title, onRemove }: { title: string; onRemove: () => void }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: artwork.badge,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Pressable
        onPress={onRemove}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${title} from Continue Watching`}
        style={({ pressed }) => ({ alignItems: "center", gap: spacing.xs, opacity: pressed ? 0.7 : 1 })}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.full,
            backgroundColor: theme.danger,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name="delete-outline" size={24} color={artwork.text} />
        </View>
        <ThemedText variant="caption" style={{ color: artwork.text }}>
          Remove
        </ThemedText>
      </Pressable>
    </View>
  );
}

function PlayBadge() {
  return (
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: radius.full,
        backgroundColor: artwork.badge,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name="play" size={14} color={artwork.text} style={{ marginLeft: 2 }} />
    </View>
  );
}

/** Titles saved to My List; tapping one opens its details. Hidden when empty. */
export function MyListRow() {
  const router = useRouter();
  const items = useWatchlist();

  if (items.length === 0) return null;

  return (
    <>
      <SectionHeader title="My List" onSeeAll={() => router.push("/watchlist")} />
      <FlatList
        data={items.slice(0, ROW_LIMIT)}
        horizontal
        keyExtractor={(item) => `${item.type}-${item.id}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={rowListStyle}
        renderItem={({ item }) => (
          <Poster
            path={item.poster_path}
            onPress={() =>
              router.push({
                pathname: item.type === "tv" ? "/(player)/tvDetails" : "/(player)/details",
                params: { id: String(item.id), type: item.type },
              })
            }
          />
        )}
      />
    </>
  );
}

/**
 * A horizontal row filled from any TMDB list endpoint (page 1).
 * Shows placeholders while loading, a retry card on failure, and hides itself
 * if the list comes back empty.
 */
export function TmdbRow({
  title,
  path,
  type,
}: {
  title: string;
  path: string;
  type: "movie" | "tv";
}) {
  const router = useRouter();
  const [items, setItems] = useState<any[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setItems(null);
    setError(null);
    tmdbGet(path, controller.signal)
      .then((data) => setItems((data.results ?? []).filter((i: any) => i.poster_path && !i.adult)))
      .catch((e) => {
        if (!isAbortError(e)) setError(e);
      });
    return () => controller.abort();
  }, [path, attempt]);

  if (items?.length === 0) return null;

  return (
    <>
      <SectionHeader title={title} />
      {error ? (
        <ErrorState compact error={error} title={`Couldn't load ${title}`} onRetry={() => setAttempt((n) => n + 1)} />
      ) : items === null ? (
        <PosterRowPlaceholder />
      ) : (
        <FlatList
          data={items.slice(0, ROW_LIMIT)}
          horizontal
          keyExtractor={(item) => String(item.id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={rowListStyle}
          renderItem={({ item }) => (
            <Poster
              path={item.poster_path}
              onPress={() =>
                router.push({
                  pathname: type === "tv" ? "/(player)/tvDetails" : "/(player)/details",
                  params: { id: String(item.id), type },
                })
              }
            />
          )}
        />
      )}
    </>
  );
}
