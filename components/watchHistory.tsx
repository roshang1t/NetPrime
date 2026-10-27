import { EmptyState } from "@/components/ui/EmptyState";
import { MediaRow } from "@/components/ui/MediaRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { spacing, useTheme } from "@/constants/theme";
import { getWatchHistory } from "@/utils/history";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WatchHistory() {
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const theme = useTheme();

  const load = useCallback(async () => {
    const list = await getWatchHistory();
    setItems(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  function openItem(item: any) {
    const params: Record<string, string> = {
      id: String(item.id ?? ""),
      type: item.type === "tv" ? "tv" : "movie",
      title: item.title || item.name || "",
      poster_path: item.poster_path || "",
    };

    if (item.type === "tv") {
      if (item.season !== undefined && item.season !== null) {
        params.season = String(item.season);
      }
      if (item.episode !== undefined && item.episode !== null) {
        params.ep = String(item.episode);
      }
    }

    router.push({
      pathname: "/(player)/player",
      params,
    });
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={items}
        ListHeaderComponent={
          <ScreenHeader back title="Watch History" subtitle="Tap anything to pick up where you left off." />
        }
        contentContainerStyle={{ paddingBottom: spacing.xxl, flexGrow: 1 }}
        keyExtractor={(item, idx) => (item.id ? `${item.type}-${item.id}` : String(idx))}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.text} />
        }
        renderItem={({ item }) => (
          <MediaRow
            posterPath={item.poster_path}
            title={item.title || item.name || "Untitled"}
            subtitle={
              item.type === "tv"
                ? `Season ${item.season ?? "-"} · Episode ${item.episode ?? "-"}`
                : "Movie"
            }
            onPress={() => openItem(item)}
            trailing={<MaterialIcons name="play-circle-outline" size={28} color={theme.textSecondary} />}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="history"
            title="No watch history yet"
            message="Your recently watched movies and shows will appear here."
          />
        }
      />
    </SafeAreaView>
  );
}
