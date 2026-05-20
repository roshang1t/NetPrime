import { Colors } from "@/constants/Colors";
import { getWatchHistory } from "@/utils/history";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function WatchHistory() {
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

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

  const emptyMessage = useMemo(() => {
    return "Your recently watched movies and shows will appear here.";
  }, []);

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
    <View style={styles.screen}>
      <View style={styles.headerWrap}>
        <Text style={styles.kicker}>Library</Text>
        <Text style={styles.title}>Watch History</Text>
        <Text style={styles.subtitle}>{emptyMessage}</Text>
      </View>

      <FlatList
        data={items}
        contentContainerStyle={
          items.length === 0 ? styles.emptyContainer : styles.listContent
        }
        keyExtractor={(item, idx) => (item.id ? String(item.id) : String(idx))}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.dark.tint}
          />
        }
        renderItem={({ item }) => {
          const label =
            item.type === "tv"
              ? `Season ${item.season ?? "-"} • Episode ${item.episode ?? "-"}`
              : "Movie";

          return (
            <Pressable style={styles.card} onPress={() => openItem(item)}>
              <View style={styles.posterWrap}>
                {item.poster_path ? (
                  <Image
                    source={{
                      uri: `https://image.tmdb.org/t/p/w185${item.poster_path}`,
                    }}
                    style={styles.poster}
                  />
                ) : (
                  <View style={[styles.poster, styles.posterFallback]}>
                    <MaterialIcons name="movie" size={26} color="#E6E1D6" />
                  </View>
                )}
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title || item.name || "Untitled"}
                </Text>
                <Text style={styles.cardMeta}>{label}</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {item.type === "tv" ? "Series" : "Film"}
                    </Text>
                  </View>
                  <View style={styles.badgeAccent}>
                    <MaterialIcons
                      name="play-arrow"
                      size={16}
                      color="#120F0A"
                    />
                    <Text style={styles.badgeAccentText}>Resume</Text>
                  </View>
                </View>
              </View>

              <MaterialIcons name="chevron-right" size={24} color="#A79F90" />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="history" size={30} color="#EDE5D7" />
            </View>
            <Text style={styles.emptyTitle}>No watch history yet</Text>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0E0C09",
    paddingTop: 18,
  },
  headerWrap: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  kicker: {
    color: Colors.dark.tint,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  subtitle: {
    color: "rgba(255,255,255,0.62)",
    marginTop: 8,
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 12,
  },
  emptyContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 22,
    padding: 12,
    gap: 12,
  },
  posterWrap: {
    width: 56,
    height: 84,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  poster: {
    width: "100%",
    height: "100%",
  },
  posterFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  cardBody: {
    flex: 1,
    minHeight: 84,
    justifyContent: "center",
  },
  cardTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 5,
  },
  cardMeta: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 13,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  badgeText: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: "600",
  },
  badgeAccent: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.dark.tint,
    flexDirection: "row",
    alignItems: "center",
  },
  badgeAccentText: {
    color: "#120F0A",
    fontSize: 12,
    fontWeight: "800",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  emptyTitle: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptyText: {
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
});
