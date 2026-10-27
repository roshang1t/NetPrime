// Trending Shows row on Home

import { ErrorState } from "@/components/ui/ErrorState";
import { Poster, PosterRowPlaceholder } from "@/components/ui/Poster";
import { spacing } from "@/constants/theme";
import { useMovieContext } from "@/contexts/movieContext";
import { Series } from "@/contexts/movieContext/types";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList } from "react-native";

const MovieList: React.FC = React.memo(function MovieList() {
  const router = useRouter();
  const { loadingSeries, seriesError, series, fetchPopularSeries } = useMovieContext();

  const handlePress = (id: number) => {
    router.push({
      pathname: "/(player)/tvDetails",
      params: { id: id.toString() },
    });
  };

  if (series.length === 0) {
    if (seriesError && !loadingSeries) {
      return (
        <ErrorState
          compact
          error={seriesError}
          title="Couldn't load trending shows"
          onRetry={() => fetchPopularSeries(1)}
        />
      );
    }
    return <PosterRowPlaceholder />;
  }

  return (
    <FlatList
      // First show is the hero billboard above
      data={series.slice(1, 11)}
      horizontal
      renderItem={({ item }: { item: Series }) => (
        <Poster path={item.poster_path} onPress={() => handlePress(item.id)} />
      )}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
      showsHorizontalScrollIndicator={false}
    />
  );
});

export default MovieList;
