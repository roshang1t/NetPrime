import CastRow from "@/components/CastRow";
import DetailsHero, { DetailsSkeleton } from "@/components/DetailsHero";
import RatingStars from "@/components/RatingStars";
import RecommendationsRow from "@/components/RecommendationsRow";
import { ThemedText } from "@/components/ThemedText";
import TrailerButton from "@/components/TrailerButton";
import WatchlistButton from "@/components/WatchlistButton";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ErrorState } from "@/components/ui/ErrorState";
import { ExpandableText } from "@/components/ui/ExpandableText";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { artwork, radius, spacing, useTheme } from "@/constants/theme";
import { tmdbGet } from "@/utils/api";
import {
  countWatchedInSeason,
  episodeKey,
  toggleEpisodeWatched,
  useWatchedEpisodes,
} from "@/utils/episodes";
import ReleaseNotice from "@/components/ReleaseNotice";
import { formatDate, isReleased } from "@/utils/dates";
import { addToWatchHistory } from "@/utils/history";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, useColorScheme, View } from "react-native";

export const options = {
  animation: "fade",
};

// --- Type Definitions ---
interface Genre {
  id: number;
  name: string;
}

interface Network {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

interface SeasonOverview {
  // This is for the `seasons` array in TV show details
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  vote_average: number;
}

interface Episode {
  air_date: string;
  episode_number: number;
  episode_type: string;
  id: number;
  name: string;
  overview: string;
  runtime: number;
  season_number: number;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
}

interface SeasonDetailsData {
  // This is for the detailed season API response
  _id: string;
  air_date: string;
  episodes: Episode[];
  name: string;
  overview: string;
  id: number;
  poster_path: string | null;
  season_number: number;
  vote_average: number;
}

interface TvShowDetailsData {
  // Main TV Show details
  adult: boolean;
  backdrop_path: string | null;
  created_by: any[];
  episode_run_time: number[];
  first_air_date: string;
  genres: Genre[];
  homepage: string;
  id: number;
  in_production: boolean;
  languages: string[];
  last_air_date: string;
  last_episode_to_air: Episode | null;
  name: string;
  networks: Network[];
  next_episode_to_air: any;
  number_of_episodes: number;
  number_of_seasons: number;
  origin_country: string[];
  original_language: string;
  original_name: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  production_companies: any[];
  production_countries: any[];
  seasons: SeasonOverview[];
  spoken_languages: any[];
  status: string;
  tagline: string;
  type: string;
  vote_average: number;
  vote_count: number;
  // From append_to_response
  videos?: { results: any[] };
  credits?: { cast: any[] };
  recommendations?: { results: any[] };
  similar?: { results: any[] };
}

const TvDetails: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [details, setDetails] = useState<TvShowDetailsData | null>(null);
  const [seasonDetails, setSeasonDetails] = useState<SeasonDetailsData | null>(
    null,
  ); // State for selected season's episodes
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<
    number | null
  >(null); // Track selected season
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  // Season failures stay inline so the rest of the page remains usable
  const [seasonError, setSeasonError] = useState<unknown>(null);
  const [seasonAttempt, setSeasonAttempt] = useState(0);

  const colorScheme = useColorScheme();
  const theme = useTheme();
  // Local, not global: a person page pushed on top must not change this screen's id
  const { id } = useLocalSearchParams();
  const tvShowId =
    typeof id === "string" ? id : Array.isArray(id) ? id[0] : null;
  const watched = useWatchedEpisodes(tvShowId);

  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ headerShown: false, animation: "fade" });
  }, [navigation]);

  // --- Effect to fetch TV Show Details ---
  useEffect(() => {
    if (!tvShowId) {
      setError("TV Show ID is missing.");
      setLoading(false);
      return;
    }

    async function fetchTvShowDetail() {
      setLoading(true);
      setError(null);

      try {
        // One request for details, trailer, cast and recommendations
        const data = await tmdbGet<TvShowDetailsData>(
          `tv/${tvShowId}?language=en-US&append_to_response=videos,credits,recommendations,similar`,
        );
        setDetails(data);

        // --- Automatically select the first season with episodes if available ---
        if (data.seasons && data.seasons.length > 0) {
          // Find the first season that is not "Specials" (season_number 0) and has episodes
          const defaultSeason =
            data.seasons.find(
              (season) => season.season_number > 0 && season.episode_count > 0,
            ) || data.seasons[0]; // Fallback to Season 0 or first if no other valid found

          if (defaultSeason) {
            setSelectedSeasonNumber(defaultSeason.season_number);
          }
        }
      } catch (err) {
        setError(err);
        setDetails(null);
      } finally {
        setLoading(false);
      }
    }
    fetchTvShowDetail();
  }, [tvShowId, attempt]);

  // --- Effect to fetch Season Details when selectedSeasonNumber changes ---
  useEffect(() => {
    if (!tvShowId || selectedSeasonNumber === null) {
      setSeasonDetails(null); // Clear season details if no season is selected
      return;
    }

    async function fetchSelectedSeasonDetails() {
      setSeasonError(null);

      try {
        const data = await tmdbGet<SeasonDetailsData>(
          `tv/${tvShowId}/season/${selectedSeasonNumber}?language=en-US`,
        );
        setSeasonDetails(data);
      } catch (err) {
        setSeasonError(err);
        setSeasonDetails(null);
      }
    }
    fetchSelectedSeasonDetails();
  }, [tvShowId, selectedSeasonNumber, seasonAttempt]); // Re-fetch when TV show ID or selected season changes

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

  const handlePress = (ep: number) => {
    void addToWatchHistory({
      id: tvShowId,
      title: details.name,
      type: "tv",
      season: selectedSeasonNumber,
      episode: ep,
      poster_path: details.poster_path,
    });
    router.push({
      pathname: "/(player)/player",
      params: {
        id: tvShowId!,
        type: "tv",
        season: selectedSeasonNumber,
        ep,
        title: details.name,
        poster_path: details.poster_path || "",
      },
    });
  };

  const selectedSeason = details.seasons?.find(
    (s) => s.season_number === selectedSeasonNumber,
  );
  // The previous season's data stays in state until the new one loads
  const currentSeason =
    seasonDetails?.season_number === selectedSeasonNumber ? seasonDetails : null;
  const seasonEpisodeCount =
    currentSeason?.episodes.length ?? selectedSeason?.episode_count ?? 0;
  const seasonWatchedCount =
    selectedSeasonNumber === null
      ? 0
      : countWatchedInSeason(watched, selectedSeasonNumber);

  // Only aired episodes can be played; a show that hasn't premiered has none
  const showReleased = isReleased(details.first_air_date);
  const airedEpisodes =
    currentSeason?.episodes.filter((e) => isReleased(e.air_date)) ?? [];

  // Primary action: first unwatched aired episode of the selected season
  const nextUp =
    airedEpisodes.find(
      (e) => !watched.has(episodeKey(e.season_number, e.episode_number)),
    ) ?? airedEpisodes[0];
  const playLabel = nextUp
    ? `${seasonWatchedCount > 0 ? "Continue" : "Play"} S${nextUp.season_number} E${nextUp.episode_number}`
    : "Play";

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Hero artwork sits under the status bar */}
      <StatusBar style={colorScheme === "light" ? "dark" : "light"} />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      >
        <DetailsHero
          posterPath={details.poster_path}
          backdropPath={details.backdrop_path}
          title={details.name}
          meta={[
            details.first_air_date?.slice(0, 4),
            details.number_of_seasons
              ? `${details.number_of_seasons} Season${details.number_of_seasons === 1 ? "" : "s"}`
              : null,
            details.vote_average ? `★ ${details.vote_average.toFixed(1)}` : null,
          ]}
          genres={details.genres?.map((g: Genre) => g.name).join(", ")}
        />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
          {!showReleased ? (
            <ReleaseNotice date={details.first_air_date} />
          ) : nextUp ? (
            <Button
              title={playLabel}
              icon="play-arrow"
              onPress={() => handlePress(nextUp.episode_number)}
            />
          ) : seasonError ? (
            // Retry lives on the episode list below
            <Button title="Play" icon="play-arrow" disabled />
          ) : currentSeason ? (
            // Selected season hasn't started airing
            <ReleaseNotice
              label={selectedSeasonNumber === 0 ? "Coming" : `Season ${selectedSeasonNumber} premieres`}
              date={
                currentSeason.episodes.find((e) => !isReleased(e.air_date))?.air_date ??
                selectedSeason?.air_date
              }
            />
          ) : (
            // Season still loading
            <Button title="Play" icon="play-arrow" disabled />
          )}
          <View style={{ flexDirection: "row", gap: spacing.xl }}>
            <WatchlistButton
              item={{
                id: details.id,
                type: "tv",
                title: details.name,
                poster_path: details.poster_path,
              }}
            />
            <TrailerButton videos={details.videos?.results} />
          </View>
          {details.overview ? <ExpandableText text={details.overview} /> : null}
          <RatingStars type="tv" id={details.id} />
        </View>

        {/* --- Seasons --- */}
        {details.seasons && details.seasons.length > 0 && (
          <>
            <SectionHeader title="Episodes" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
            >
              {details.seasons
                .filter((s) => s.episode_count > 0) // Only show seasons with episodes
                .map((item) => {
                  const isSelected = item.season_number === selectedSeasonNumber;
                  const isComplete =
                    countWatchedInSeason(watched, item.season_number) >= item.episode_count;
                  return (
                    <Chip
                      key={item.id}
                      label={item.season_number === 0 ? "Specials" : `Season ${item.season_number}`}
                      selected={isSelected}
                      onPress={() => setSelectedSeasonNumber(item.season_number)}
                      trailing={
                        isComplete ? (
                          <MaterialIcons
                            name="check-circle"
                            size={14}
                            color={isSelected ? theme.onAccent : theme.textSecondary}
                          />
                        ) : undefined
                      }
                    />
                  );
                })}
            </ScrollView>
          </>
        )}

        {/* --- Season progress --- */}
        {selectedSeasonNumber !== null && seasonEpisodeCount > 0 && (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg, gap: spacing.sm }}>
            <ThemedText variant="caption" tone="secondary">
              {seasonWatchedCount} of {seasonEpisodeCount} watched
            </ThemedText>
            <View
              style={{
                height: 4,
                borderRadius: radius.full,
                overflow: "hidden",
                backgroundColor: theme.surfaceRaised,
              }}
            >
              <View
                style={{
                  height: "100%",
                  borderRadius: radius.full,
                  backgroundColor: theme.accent,
                  width: `${Math.min(100, (seasonWatchedCount / seasonEpisodeCount) * 100)}%`,
                }}
              />
            </View>
          </View>
        )}

        {/* --- Episodes --- */}
        {selectedSeasonNumber !== null && (
          <View style={{ marginTop: spacing.md }}>
            {seasonError ? (
              <ErrorState
                compact
                error={seasonError}
                title="Couldn't load episodes"
                onRetry={() => setSeasonAttempt((n) => n + 1)}
                style={{ marginVertical: spacing.sm }}
              />
            ) : currentSeason ? (
              currentSeason.episodes.length > 0 ? (
                currentSeason.episodes.map((episode) => (
                  <EpisodeRow
                    key={episode.id}
                    episode={episode}
                    isWatched={watched.has(
                      episodeKey(episode.season_number, episode.episode_number),
                    )}
                    aired={isReleased(episode.air_date)}
                    onPlay={() => handlePress(episode.episode_number)}
                    onToggleWatched={() =>
                      toggleEpisodeWatched(
                        tvShowId!,
                        episode.season_number,
                        episode.episode_number,
                      )
                    }
                  />
                ))
              ) : (
                <ThemedText
                  variant="callout"
                  tone="secondary"
                  style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}
                >
                  No episodes found for this season.
                </ThemedText>
              )
            ) : (
              [1, 2, 3].map((i) => <EpisodeRowPlaceholder key={i} />)
            )}
          </View>
        )}

        <CastRow cast={details.credits?.cast} crew={details.created_by} crewLabel="Created by" />
        <RecommendationsRow
          type="tv"
          recommendations={details.recommendations?.results}
          similar={details.similar?.results}
        />

        <ThemedText
          variant="caption"
          tone="tertiary"
          style={{ textAlign: "center", marginTop: spacing.xxl }}
        >
          Made with 💓 by cody
        </ThemedText>
      </ScrollView>
    </View>
  );
};

const STILL_WIDTH = 128;
const STILL_HEIGHT = 72;

function EpisodeRow({
  episode,
  isWatched,
  aired,
  onPlay,
  onToggleWatched,
}: {
  episode: Episode;
  isWatched: boolean;
  aired: boolean;
  onPlay: () => void;
  onToggleWatched: () => void;
}) {
  const theme = useTheme();
  const meta = aired
    ? [
        episode.runtime ? `${episode.runtime}m` : null,
        episode.air_date ? formatDate(episode.air_date) : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : episode.air_date
      ? `Airs ${formatDate(episode.air_date)}`
      : "Air date not announced";

  return (
    <Pressable
      onPress={onPlay}
      // Unaired episodes have nothing to stream yet
      disabled={!aired}
      accessibilityRole="button"
      accessibilityLabel={
        aired
          ? `Play episode ${episode.episode_number}, ${episode.name}`
          : `Episode ${episode.episode_number}, ${episode.name}. ${meta}`
      }
      style={({ pressed }) => ({
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        gap: spacing.sm,
        opacity: !aired ? 0.5 : pressed ? 0.7 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View
          style={{
            width: STILL_WIDTH,
            height: STILL_HEIGHT,
            borderRadius: radius.sm,
            borderCurve: "continuous",
            overflow: "hidden",
            backgroundColor: theme.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {episode.still_path && (
            <Image
              source={{ uri: `https://image.tmdb.org/t/p/w300${episode.still_path}` }}
              style={{ position: "absolute", width: "100%", height: "100%" }}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
          )}
          {aired ? (
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
              <MaterialIcons name="play-arrow" size={20} color={artwork.text} />
            </View>
          ) : (
            !episode.still_path && <MaterialIcons name="event" size={22} color={theme.textTertiary} />
          )}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <ThemedText variant="headline" numberOfLines={2}>
            {episode.episode_number}. {episode.name}
          </ThemedText>
          {meta ? (
            <ThemedText variant="caption" tone="secondary">
              {meta}
            </ThemedText>
          ) : null}
        </View>
        {aired && (
          <Pressable
            hitSlop={10}
            onPress={onToggleWatched}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isWatched }}
            accessibilityLabel={`Mark episode ${episode.episode_number} as ${isWatched ? "unwatched" : "watched"}`}
          >
            <MaterialIcons
              name={isWatched ? "check-circle" : "radio-button-unchecked"}
              size={24}
              color={isWatched ? theme.text : theme.textTertiary}
            />
          </Pressable>
        )}
      </View>
      {episode.overview ? (
        <ThemedText variant="callout" tone="secondary" numberOfLines={2}>
          {episode.overview}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

function EpisodeRowPlaceholder() {
  return (
    <View
      accessibilityLabel="Loading episode"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
      }}
    >
      <Skeleton width={STILL_WIDTH} height={STILL_HEIGHT} radius={radius.sm} />
      <View style={{ flex: 1, gap: spacing.sm }}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={10} />
      </View>
    </View>
  );
}

export default React.memo(TvDetails);
