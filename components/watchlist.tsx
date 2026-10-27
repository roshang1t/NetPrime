import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { MediaRow } from "@/components/ui/MediaRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { spacing, useTheme } from "@/constants/theme";
import { getTmdbSession } from "@/utils/tmdbAccount";
import {
  removeFromWatchlist,
  syncWatchlist,
  useWatchlist,
  WatchlistItem,
} from "@/utils/watchlist";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Watchlist() {
  const items = useWatchlist();
  const [refreshing, setRefreshing] = useState(false);
  const [syncedAs, setSyncedAs] = useState<string | null>(null);
  const router = useRouter();
  const theme = useTheme();

  const sync = useCallback(async () => {
    const session = await getTmdbSession();
    setSyncedAs(session?.username ?? null);
    if (session) await syncWatchlist();
  }, []);

  // Pull changes made on TMDB or another device whenever the screen opens
  useFocusEffect(
    useCallback(() => {
      void sync();
    }, [sync]),
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await sync();
    } finally {
      setRefreshing(false);
    }
  }

  function openItem(item: WatchlistItem) {
    router.push({
      pathname: item.type === "tv" ? "/(player)/tvDetails" : "/(player)/details",
      params: { id: String(item.id), type: item.type },
    });
  }

  const subtitle = syncedAs
    ? `Synced with TMDB as ${syncedAs}`
    : "Saved on this device. Connect TMDB in More to back it up.";

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={items}
        ListHeaderComponent={<ScreenHeader back title="My List" subtitle={subtitle} />}
        contentContainerStyle={{ paddingBottom: spacing.xxl, flexGrow: 1 }}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.text} />
        }
        renderItem={({ item }) => (
          <MediaRow
            posterPath={item.poster_path}
            title={item.title || "Untitled"}
            subtitle={item.type === "tv" ? "Series" : "Movie"}
            onPress={() => openItem(item)}
            trailing={
              <IconButton
                icon="bookmark-remove"
                color={theme.textSecondary}
                onPress={() => removeFromWatchlist(item)}
                accessibilityLabel={`Remove ${item.title} from My List`}
              />
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="bookmark-border"
            title="Nothing saved yet"
            message="Tap My List on any movie or show to save it here."
          />
        }
      />
    </SafeAreaView>
  );
}
