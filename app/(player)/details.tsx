import CastRow from "@/components/CastRow";
import DetailsHero, { DetailsSkeleton } from "@/components/DetailsHero";
import RatingStars from "@/components/RatingStars";
import RecommendationsRow from "@/components/RecommendationsRow";
import ReleaseNotice from "@/components/ReleaseNotice";
import TrailerButton from "@/components/TrailerButton";
import WatchlistButton from "@/components/WatchlistButton";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { ExpandableText } from "@/components/ui/ExpandableText";
import { spacing, useTheme } from "@/constants/theme";
import { tmdbGet } from "@/utils/api";
import { isReleased } from "@/utils/dates";
import { addToWatchHistory } from "@/utils/history";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ScrollView, useColorScheme, View } from "react-native";

export const options = {
  animation: "fade",
};

const formatRuntime = (minutes?: number) =>
  minutes ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : null;

const Details: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ headerShown: false, animation: "fade" });
  }, [navigation]);

  const colorScheme = useColorScheme();
  const theme = useTheme();
  // Local, not global: a person page pushed on top must not change this screen's id
  const { id } = useLocalSearchParams();

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        // One request for details, trailer, cast and recommendations
        const data = await tmdbGet(
          `movie/${id}?language=en-US&append_to_response=videos,credits,recommendations,similar`,
        );
        setDetails(data);
      } catch (err) {
        setError(err);
        setDetails(null);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id, attempt]);

  if (loading) {
    return <DetailsSkeleton />;
  }

  if (error || !details) {
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: theme.background }}>
        <ErrorState
          error={error}
          onRetry={() => setAttempt((n) => n + 1)}
          onBack={() => router.back()}
        />
      </View>
    );
  }

  // Upcoming, in production or delayed titles have nothing to stream yet
  const released = details.status === "Released" && isReleased(details.release_date);

  const handlePress = () => {
    void addToWatchHistory({
      id: id?.toString(),
      title: details.title,
      type: "movie",
      poster_path: details.poster_path,
    });
    router.push({
      pathname: "/(player)/player",
      params: {
        id: id.toString(),
        type: "movie",
        title: details.title,
        poster_path: details.poster_path || "",
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Hero artwork sits under the status bar */}
      <StatusBar style={colorScheme === "light" ? "dark" : "light"} />
      <ScrollView
        style={{ flex: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      >
        <DetailsHero
          posterPath={details.poster_path}
          backdropPath={details.backdrop_path}
          title={details.title}
          meta={[
            details.release_date?.slice(0, 4),
            formatRuntime(details.runtime),
            details.vote_average ? `★ ${details.vote_average.toFixed(1)}` : null,
          ]}
          genres={details.genres?.map((g: any) => g.name).join(", ")}
        />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
          {released ? (
            <Button title="Play" icon="play-arrow" onPress={handlePress} />
          ) : (
            <ReleaseNotice date={details.release_date} />
          )}
          <View style={{ flexDirection: "row", gap: spacing.xl }}>
            <WatchlistButton
              item={{
                id: details.id,
                type: "movie",
                title: details.title,
                poster_path: details.poster_path,
              }}
            />
            <TrailerButton videos={details.videos?.results} />
          </View>
          {details.overview ? <ExpandableText text={details.overview} /> : null}
          <RatingStars type="movie" id={details.id} />
        </View>

        <CastRow
          cast={details.credits?.cast}
          crew={details.credits?.crew?.filter((c: any) => c.job === "Director")}
          crewLabel="Directed by"
        />
        <RecommendationsRow
          type="movie"
          recommendations={details.recommendations?.results}
          similar={details.similar?.results}
        />
      </ScrollView>
    </View>
  );
};

export default Details;
