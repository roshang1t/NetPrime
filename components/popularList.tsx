// Now Playing grid on Home (infinite scroll); the rest of Home renders in its header

import { ThemedText } from "@/components/ThemedText";
import { ErrorState } from "@/components/ui/ErrorState";
import { Poster, PosterGridPlaceholder } from "@/components/ui/Poster";
import { radius, spacing, useTheme } from "@/constants/theme";
import { Movie, useMovieContext } from "@/contexts/movieContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Dimensions, FlatList, Pressable } from "react-native";

const { width } = Dimensions.get("window");
export const GRID_COLUMNS = 3;
export const GRID_POSTER_WIDTH = (width - spacing.lg * 2 - spacing.md * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

interface PopularListProps {
  ListHeaderComponent?: React.ReactElement | null;
}

const PopularList: React.FC<PopularListProps> = ({ ListHeaderComponent }) => {
  const {
    movies,
    loadingMovies,
    moviesError,
    currentPage,
    totalPages,
    fetchPopularMovies,
    hasMore,
  } = useMovieContext();

  const theme = useTheme();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [showGoToTop, setShowGoToTop] = useState(false);

  const handlePress = (id: number) => {
    router.push({
      pathname: "/(player)/details",
      params: { id: id.toString(), type: "movie" },
    });
  };

  const handleEndReached = () => {
    // After a failed page, wait for the user to tap Retry instead of re-firing on scroll
    if (!loadingMovies && !moviesError && hasMore && currentPage < totalPages) {
      fetchPopularMovies(currentPage + 1);
    }
  };

  const emptyContent =
    loadingMovies ? (
      <PosterGridPlaceholder width={GRID_POSTER_WIDTH} columns={GRID_COLUMNS} />
    ) : moviesError ? (
      <ErrorState
        compact
        error={moviesError}
        title="Couldn't load Now Playing"
        onRetry={() => fetchPopularMovies(1)}
      />
    ) : (
      <ThemedText variant="callout" tone="secondary" style={{ paddingHorizontal: spacing.lg }}>
        Nothing playing in theatres here right now.
      </ThemedText>
    );

  const footer =
    movies.length === 0 ? null : loadingMovies ? (
      <PosterGridPlaceholder width={GRID_POSTER_WIDTH} columns={GRID_COLUMNS} rows={1} />
    ) : moviesError ? (
      <ErrorState
        compact
        error={moviesError}
        title="Couldn't load more"
        onRetry={() => fetchPopularMovies(currentPage + 1)}
      />
    ) : null;

  return (
    <>
      <FlatList
        ref={flatListRef}
        onScroll={(e) => setShowGoToTop(e.nativeEvent.contentOffset.y > 800)}
        scrollEventThrottle={16}
        ListHeaderComponent={ListHeaderComponent}
        showsVerticalScrollIndicator={false}
        data={movies}
        renderItem={({ item }: { item: Movie }) => (
          <Poster path={item.poster_path} width={GRID_POSTER_WIDTH} onPress={() => handlePress(item.id)} />
        )}
        keyExtractor={(item) => item.id.toString()}
        numColumns={GRID_COLUMNS}
        columnWrapperStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg }}
        contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xxl }}
        onEndReached={handleEndReached}
        // Start the next page ~2 screens early so scrolling never hits the end
        onEndReachedThreshold={2}
        ListEmptyComponent={emptyContent}
        ListFooterComponent={footer}
      />
      {showGoToTop && (
        <Pressable
          onPress={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}
          accessibilityRole="button"
          accessibilityLabel="Scroll to top"
          style={({ pressed }) => ({
            position: "absolute",
            right: spacing.lg,
            bottom: spacing.lg,
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
    </>
  );
};

export default React.memo(PopularList);
