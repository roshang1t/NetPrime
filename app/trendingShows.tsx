import { GRID_COLUMNS, GRID_POSTER_WIDTH } from "@/components/popularList";
import { ErrorState } from "@/components/ui/ErrorState";
import { Poster, PosterGridPlaceholder } from "@/components/ui/Poster";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { radius, spacing, useTheme } from "@/constants/theme";
import { useMovieContext } from "@/contexts/movieContext";
import { Series } from "@/contexts/movieContext/types";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrendingShowsScreen() {
  const {
    series,
    loadingSeries,
    seriesError,
    seriesCurrentPage,
    seriesTotalPages,
    fetchPopularSeries,
    seriesHasMore,
  } = useMovieContext();

  const theme = useTheme();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [showGoToTop, setShowGoToTop] = useState(false);

  const handlePress = (id: number) => {
    router.push({
      pathname: "/(player)/tvDetails",
      params: { id: id.toString() },
    });
  };

  const handleEndReached = () => {
    // After a failed page, wait for the user to tap Retry instead of re-firing on scroll
    if (!loadingSeries && !seriesError && seriesHasMore && seriesCurrentPage < seriesTotalPages) {
      fetchPopularSeries(seriesCurrentPage + 1);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        ref={flatListRef}
        onScroll={(e) => setShowGoToTop(e.nativeEvent.contentOffset.y > 800)}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<ScreenHeader back title="Trending Shows" subtitle="Worldwide, updated daily" />}
        data={series}
        renderItem={({ item }: { item: Series }) => (
          <Poster path={item.poster_path} width={GRID_POSTER_WIDTH} onPress={() => handlePress(item.id)} />
        )}
        keyExtractor={(item) => item.id.toString()}
        numColumns={GRID_COLUMNS}
        columnWrapperStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg }}
        contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xxl }}
        onEndReached={handleEndReached}
        // Start the next page ~2 screens early so scrolling never hits the end
        onEndReachedThreshold={2}
        ListEmptyComponent={
          loadingSeries ? (
            <PosterGridPlaceholder width={GRID_POSTER_WIDTH} columns={GRID_COLUMNS} rows={3} />
          ) : seriesError ? (
            <ErrorState error={seriesError} onRetry={() => fetchPopularSeries(1)} />
          ) : null
        }
        ListFooterComponent={
          series.length === 0 ? null : loadingSeries ? (
            <PosterGridPlaceholder width={GRID_POSTER_WIDTH} columns={GRID_COLUMNS} rows={1} />
          ) : seriesError ? (
            <ErrorState
              compact
              error={seriesError}
              title="Couldn't load more"
              onRetry={() => fetchPopularSeries(seriesCurrentPage + 1)}
            />
          ) : null
        }
      />
      {showGoToTop && (
        <Pressable
          onPress={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}
          accessibilityRole="button"
          accessibilityLabel="Scroll to top"
          style={({ pressed }) => ({
            position: "absolute",
            right: spacing.lg,
            bottom: spacing.xl,
            width: 44,
            height: 44,
            borderRadius: radius.full,
            backgroundColor: theme.accent,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <MaterialIcons name="arrow-upward" size={22} color={theme.onAccent} />
        </Pressable>
      )}
    </SafeAreaView>
  );
}
