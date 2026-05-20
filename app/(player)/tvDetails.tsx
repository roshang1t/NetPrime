import { Colors } from "@/constants/Colors";
import { API_HEADERS, API_URL } from "@/contexts/movieContext/movieContext";
import { addToWatchHistory } from "@/utils/history";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useGlobalSearchParams, useNavigation, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";

const { height } = Dimensions.get("window");
const API_URI = "https://db.bitcine.app/3/";

const API_KEY = "ad301b7cc82ffe19273e55e4d4206885";

export const options = {
  animation: "fade",
};

// --- Type Definitions (Updated/Added) ---
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
  last_episode_to_air: Episode | null; // Use Episode interface
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
  seasons: SeasonOverview[]; // Use SeasonOverview
  spoken_languages: any[];
  status: string;
  tagline: string;
  type: string;
  vote_average: number;
  vote_count: number;
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
  const [error, setError] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const color = Colors[colorScheme ?? "dark"];
  const { id } = useGlobalSearchParams();
  const tvShowId =
    typeof id === "string" ? id : Array.isArray(id) ? id[0] : null;

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
        const response = await fetch(
          `${API_URL}tv/${tvShowId}?language=en-US`,
          {
            headers: API_HEADERS,
          },
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.status_message ||
              `HTTP error! status: ${response.status}`,
          );
        }
        const data: TvShowDetailsData = await response.json();
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
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred while fetching TV show details.");
        }
        setDetails(null);
      } finally {
        setLoading(false);
      }
    }
    fetchTvShowDetail();
  }, [tvShowId]);

  // --- Effect to fetch Season Details when selectedSeasonNumber changes ---
  useEffect(() => {
    if (!tvShowId || selectedSeasonNumber === null) {
      setSeasonDetails(null); // Clear season details if no season is selected
      return;
    }

    async function fetchSelectedSeasonDetails() {
      // You might want a separate loading state for season details to avoid flashing main loader
      // setLoading(true); // Or use a dedicated `seasonLoading` state
      setError(null); // Clear errors related to season fetch

      try {
        const response = await fetch(
          `${API_URL}tv/${tvShowId}/season/${selectedSeasonNumber}?language=en-US`,
          {
            headers: API_HEADERS,
          },
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.status_message ||
              `HTTP error! status: ${response.status}`,
          );
        }
        const data: SeasonDetailsData = await response.json();
        setSeasonDetails(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            `An unknown error occurred while fetching Season ${selectedSeasonNumber} details.`,
          );
        }
        setSeasonDetails(null);
      } finally {
        // setLoading(false); // Only if using main loading state
      }
    }
    fetchSelectedSeasonDetails();
  }, [tvShowId, selectedSeasonNumber]); // Re-fetch when TV show ID or selected season changes

  const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

  if (loading) {
    return (
      <View
        style={[
          styles.centeredContainer,
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: color.background,
          },
        ]}
      >
        <ShimmerPlaceholder
          shimmerColors={
            colorScheme === "dark" ? ["#222", "#111", "#222"] : undefined
          }
          style={{
            height: "60%",
            width: "95%",
            borderRadius: 8,
            marginBottom: 20,
            alignSelf: "center",
          }}
        />
        <ShimmerPlaceholder
          shimmerColors={
            colorScheme === "dark" ? ["#222", "#111", "#222"] : undefined
          }
          style={{
            height: 210,
            width: "90%",
            borderRadius: 18,
            marginBottom: 30,
          }}
        />
        {/* <ShimmerPlaceholder
          shimmerColors={
            colorScheme === "dark" ? ["#222", "#111", "#222"] : undefined
          }
          style={{
            height: 30,
            width: 120,
            borderRadius: 8,
            marginBottom: 20,
            alignSelf: "flex-start",
          }}
        /> */}
        {/* Episode shimmer row */}
        <View style={{ width: "70%", margin: 10 }}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 15,
              }}
            >
              <ShimmerPlaceholder
                shimmerColors={
                  colorScheme === "dark" ? ["#222", "#111", "#222"] : undefined
                }
                style={{
                  width: 100,
                  height: 50,
                  borderRadius: 8,
                  marginRight: 15,
                }}
              />
              <View style={{ flex: 1 }}>
                <ShimmerPlaceholder
                  shimmerColors={
                    colorScheme === "dark"
                      ? ["#222", "#111", "#222"]
                      : undefined
                  }
                  style={{
                    height: 18,
                    width: "60%",
                    borderRadius: 6,
                    marginBottom: 8,
                  }}
                />
                <ShimmerPlaceholder
                  shimmerColors={
                    colorScheme === "dark"
                      ? ["#222", "#111", "#222"]
                      : undefined
                  }
                  style={{ height: 12, width: "80%", borderRadius: 6 }}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!details) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={{ color: color.text }}>No details available.</Text>
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

  const imageUrl = details.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${details.backdrop_path}`
    : details.poster_path
      ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
      : null;

  return (
    <>
      <StatusBar style={colorScheme === "dark" ? "dark" : "light"} />
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.headerContainer}>
          {imageUrl ? (
            <ImageBackground
              source={{ uri: imageUrl }}
              style={styles.backgroundImage}
              resizeMode="cover"
            >
              <View style={styles.overlay} />
              <View style={styles.headerContent}>
                <Text style={styles.title}>{details.name}</Text>

                <Text
                  style={[
                    styles.value,
                    { marginBottom: 5, textAlign: "center" },
                  ]}
                >
                  {details.genres?.map((g: Genre) => g.name).join(", ") ||
                    "N/A"}
                </Text>

                <Text
                  style={[
                    styles.tagline,
                    { fontStyle: "normal", fontWeight: "bold" },
                  ]}
                >
                  {details.number_of_seasons || "N/A"} Seasons •{" "}
                  {details.number_of_episodes} Episodes
                </Text>
              </View>
            </ImageBackground>
          ) : (
            <View style={[styles.backgroundImage, styles.noImageBackground]}>
              <View style={styles.overlay} />
              <View style={styles.headerContent}>
                <Text style={styles.title}>{details.name}</Text>
                {details.tagline ? (
                  <Text style={styles.tagline}>{details.tagline}</Text>
                ) : null}
                <Text style={styles.noImageText}>No image available</Text>
              </View>
            </View>
          )}
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: Colors[colorScheme ?? "dark"].background },
          ]}
        >
          <Text style={[styles.overview, { color: color.text }]}>
            {details.overview.substring(0, details.overview.indexOf(".") + 1)}
          </Text>

          {/* --- Seasons Section --- */}
          {details.seasons && details.seasons.length > 0 && (
            <View style={styles.seasonsContainer}>
              <FlatList
                horizontal
                data={details.seasons.filter((s) => s.episode_count > 0)} // Only show seasons with episodes
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.seasonListContent}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.seasonButton,
                      { borderColor: color.text },
                      item.season_number === selectedSeasonNumber && {
                        backgroundColor: color.tint,
                      },
                    ]}
                    onPress={() => setSelectedSeasonNumber(item.season_number)}
                  >
                    <Text
                      style={[
                        styles.seasonButtonText,
                        {
                          color:
                            item.season_number === selectedSeasonNumber
                              ? Colors.light.text
                              : color.text,
                        },
                      ]}
                    >
                      {item.season_number === 0
                        ? "Specials"
                        : `Season ${item.season_number}`}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* --- Episodes Section --- */}
          {selectedSeasonNumber !== null && (
            <View style={styles.episodesContainer}>
              {seasonDetails ? (
                seasonDetails.episodes.length > 0 ? (
                  seasonDetails.episodes.map((episode) => (
                    <TouchableOpacity
                      onPress={() => handlePress(episode.episode_number)}
                      key={episode.id}
                      style={[styles.episodeItem, { borderColor: color.icon }]}
                      // onPress={() => handlePlayEpisode(episode)} // Implement this for specific episode playback
                    >
                      {episode.still_path && (
                        <ImageBackground
                          source={{
                            uri: `https://image.tmdb.org/t/p/w300${episode.still_path}`,
                          }}
                          style={styles.episodeStill}
                          imageStyle={{ borderRadius: 8 }}
                        >
                          <MaterialIcons
                            name="play-circle"
                            size={40}
                            color="rgba(255,255,255,0.8)"
                          />
                        </ImageBackground>
                      )}
                      <View style={styles.episodeInfo}>
                        <Text
                          style={[styles.episodeTitle, { color: color.text }]}
                        >
                          E{episode.episode_number}: {episode.name}
                        </Text>
                        <Text
                          style={[
                            styles.episodeOverview,
                            { color: color.icon },
                          ]}
                        >
                          {episode.overview
                            ? episode.overview.substring(0, 50) + "..."
                            : "No overview available."}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={[styles.noEpisodesText, { color: color.icon }]}>
                    No episodes found for this season.
                  </Text>
                )
              ) : (
                // shimmer loading for episode list
                <View style={{ width: "100%" }}>
                  {[1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 15,
                      }}
                    >
                      <ShimmerPlaceholder
                        shimmerColors={
                          colorScheme === "dark"
                            ? ["#222", "#111", "#222"]
                            : undefined
                        }
                        style={{
                          width: 100,
                          height: 50,
                          borderRadius: 8,
                          marginRight: 15,
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <ShimmerPlaceholder
                          shimmerColors={
                            colorScheme === "dark"
                              ? ["#222", "#111", "#222"]
                              : undefined
                          }
                          style={{
                            height: 18,
                            width: "60%",
                            borderRadius: 6,
                            marginBottom: 8,
                          }}
                        />
                        <ShimmerPlaceholder
                          shimmerColors={
                            colorScheme === "dark"
                              ? ["#222", "#111", "#222"]
                              : undefined
                          }
                          style={{ height: 12, width: "80%", borderRadius: 6 }}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <TouchableOpacity style={[styles.btn, { borderColor: color.icon }]}>
            <Text style={{ color: color.text }}>💓cody</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    justifyContent: "center",
    height: 50,
    width: "100%",
    alignItems: "center",
    // borderWidth: 2,
    marginTop: 20,
    borderRadius: 10,
    padding: 5,
    gap: 4,
  },
  headerContainer: {
    width: "100%",
    height: height * 0.6,
    // position: "relative",
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundImage: {
    flex: 1,
    justifyContent: "flex-end",
    width: "100%",
    height: "100%",
    // borderBottomLeftRadius: 30,
    // borderBottomRightRadius: 30,
    // overflow: "hidden",
  },
  noImageBackground: {
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    color: "#ccc",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    height: "100%",
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  headerContent: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#e0e0e0",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginBottom: 20,
  },
  card: {
    marginHorizontal: 0,
    marginTop: -50,
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    width: "100%",
    // backgroundColor: "rgba(0,0,0,0.05)",
  },
  overview: {
    fontSize: 16,
    color: "#eee",
    textAlign: "center",
    marginBottom: 16,
  },
  label: {
    fontWeight: "bold",
    color: "#fff",
    marginTop: 10,
  },
  value: {
    fontWeight: "normal",
    color: "#eee",
  },
  centeredContainer: {
    flex: 1,
    // justifyContent: "center",
    // alignItems: "center",
    backgroundColor: "#111",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  // --- New Styles for Seasons and Episodes ---
  seasonsContainer: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    // textAlign: "center",
  },
  seasonListContent: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  seasonButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderRadius: 20,
    marginHorizontal: 5,
    minWidth: 60, // Ensure some minimum width
    justifyContent: "center",
    alignItems: "center",
    // width: 50,
  },
  seasonButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  episodesContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  episodeItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 0.2,
    borderRadius: 20,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.05)", // Slightly translucent background
    width: "100%",
  },
  episodeStill: {
    width: 100,
    height: 50,
    borderRadius: 8,
    marginRight: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  episodeInfo: {
    flex: 1,
  },
  episodeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  episodeOverview: {
    fontSize: 12,
  },
  noEpisodesText: {
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
});

export default React.memo(TvDetails);
