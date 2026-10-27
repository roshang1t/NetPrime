import { Poster } from "@/components/ui/Poster";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { spacing } from "@/constants/theme";
import { withPoster } from "@/utils/images";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, View } from "react-native";

interface Title {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  vote_average?: number;
  adult?: boolean;
}

/**
 * "More Like This": TMDB recommendations, falling back to similar titles
 * when a title is too obscure to have recommendations.
 */
export default function RecommendationsRow({
  type,
  recommendations,
  similar,
}: {
  type: "movie" | "tv";
  recommendations?: Title[];
  similar?: Title[];
}) {
  const router = useRouter();
  const pick = (list?: Title[]) => withPoster(list ?? []);
  const data = pick(recommendations).length ? pick(recommendations) : pick(similar);

  if (data.length === 0) return null;

  // replace, not push, so hopping between titles doesn't pile up screens
  const handlePress = (id: number) => {
    router.replace({
      pathname: type === "tv" ? "/(player)/tvDetails" : "/(player)/details",
      params: { id: id.toString(), type },
    });
  };

  return (
    <View>
      <SectionHeader title="More Like This" />
      <FlatList
        data={data}
        horizontal
        keyExtractor={(item) => item.id.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
        renderItem={({ item }) => (
          <Poster
            path={item.poster_path}
            title={item.title || item.name}
            subtitle={item.vote_average ? `★ ${item.vote_average.toFixed(1)}` : undefined}
            onPress={() => handlePress(item.id)}
          />
        )}
      />
    </View>
  );
}
