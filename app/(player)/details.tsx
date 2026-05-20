import { Colors } from "@/constants/Colors";
import { Movie } from "@/contexts/movieContext";
import { API_HEADERS, API_URL } from "@/contexts/movieContext/movieContext";
import { addToWatchHistory } from "@/utils/history";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useGlobalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
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

const Details: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string>();
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [searchError, setSearchError] = useState<string>();

  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ headerShown: false, animation: "fade" });
  }, [navigation]);

  const colorScheme = useColorScheme();
  const color = Colors[colorScheme ?? "dark"];
  const { id } = useGlobalSearchParams();

  const fetchInitial = useCallback(async () => {
    setSearchLoading(true);

    try {
      const response = await fetch(
        `${API_URL}movie/${id}/similar?language=en-US&page=1`,
        {
          headers: API_HEADERS,
        },
      );

      if (!response.ok) {
        // Handle HTTP errors (e.g., 401 Unauthorized, 404 Not Found)
        const errorData = await response.json();
        throw new Error(
          errorData.status_message || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();
      setSimilar(data.results);
      // Do NOT update currentPage, totalPages, or totalResults here
    } catch (err) {
      console.error("Failed to fetch series:", err);
      if (err instanceof Error) {
        setSearchError(err.message);
      } else {
        setSearchError("An unknown error occurred.");
      }
      setSimilar([]); // Clear movies on error
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const response = await fetch(`${API_URL}movie/${id}?language=en-US`, {
          headers: API_HEADERS,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.status_message ||
              `HTTP error! status: ${response.status}`,
          );
        }
        const data = await response.json();
        setDetails(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
        setDetails(null);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
    fetchInitial();
  }, [id]);

  const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors[colorScheme ?? "dark"].background,
          padding: 20,
        }}
      >
        <ShimmerPlaceholder
          shimmerColors={
            colorScheme === "dark" ? ["#222", "#111", "#222"] : undefined
          }
          style={{
            height: "50%",
            width: "100%",
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
            height: 150,
            width: "100%",
            borderRadius: 18,
            marginBottom: 30,
          }}
        />
        <ShimmerPlaceholder
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
        />
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
          <ShimmerPlaceholder
            shimmerColors={
              colorScheme === "dark" ? ["#222", "#111", "#222"] : undefined
            }
            style={{ height: 180, width: 120, borderRadius: 14 }}
          />
          <ShimmerPlaceholder
            shimmerColors={
              colorScheme === "dark" ? ["#222", "#111", "#222"] : undefined
            }
            style={{ height: 180, width: 120, borderRadius: 14 }}
          />
          <ShimmerPlaceholder
            shimmerColors={
              colorScheme === "dark" ? ["#222", "#111", "#222"] : undefined
            }
            style={{ height: 180, width: 120, borderRadius: 14 }}
          />
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
    return null;
  }

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

  const handleSimilarPress = (id: number) => {
    router.replace({
      pathname: "/(player)/details",
      params: { id: id.toString(), type: "movie" },
    });
  };

  const renderSimilar = ({ item }: { item: Movie }) => {
    return (
      <TouchableOpacity
        onPress={() => handleSimilarPress(item.id)}
        style={styles.similarCard}
      >
        {item.poster_path ? (
          <Image
            source={{
              uri: `https://image.tmdb.org/t/p/w300${item.poster_path}`,
            }}
            style={styles.similarImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.similarNoImage}>
            <Text style={styles.similarNoImageText}>No Image</Text>
          </View>
        )}
        <Text style={styles.movieTitle} numberOfLines={1}>
          {item.title || item.name}
        </Text>
        <Text style={styles.movieTitle}>
          <MaterialIcons name="star" /> {item.vote_average}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors[colorScheme ?? "dark"].background,
      }}
    >
      <ScrollView
        style={{ flex: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <ImageBackground
            source={{
              uri: `https://image.tmdb.org/t/p/w500${details.poster_path}`,
            }}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <View style={styles.overlay} />
            <View style={styles.headerContent}>
              <Text style={styles.title}>{details.title}</Text>
              <Text
                style={[
                  styles.value,
                  {
                    textAlign: "center",
                    fontStyle: "italic",
                    shadowColor: "#000",
                    shadowOffset: { width: 10, height: 10 },
                  },
                ]}
              >
                {details.genres?.map((g: any) => g.name).join(", ")}
              </Text>
              <Text
                style={[
                  styles.value,
                  {
                    textAlign: "center",
                    fontWeight: "bold",
                    shadowColor: "#000",
                    shadowOffset: { width: 10, height: 10 },
                  },
                ]}
              >
                Runtime : {details.runtime} min
              </Text>
            </View>
          </ImageBackground>
        </View>
        <View
          style={[
            styles.card,
            { backgroundColor: Colors[colorScheme ?? "dark"].background },
          ]}
        >
          <TouchableOpacity
            onPress={handlePress}
            style={[styles.btn, { borderColor: color.tint }]}
          >
            <Text
              style={[
                styles.label,
                { marginTop: 0, color: color.tint, elevation: 5 },
              ]}
            >
              Play Now
            </Text>
            <MaterialIcons name="play-circle" color={color.tint} size={25} />
          </TouchableOpacity>

          <Text style={[styles.overview, { color: color.text }]}>
            {details.overview.substring(0, details.overview.indexOf(".") + 1)}
          </Text>
        </View>
        <Text
          style={[
            {
              fontWeight: "bold",
              color: color.text,
              margin: 20,
              fontSize: 22,
              textAlign: "left",
            },
          ]}
        >
          You May Also Like
        </Text>
        <FlatList
          data={similar}
          horizontal
          renderItem={renderSimilar}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.similarList}
          ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
          ListEmptyComponent={() => {
            return (
              !searchLoading && (
                <Text style={{ color: "#888", margin: 20 }}>
                  Don&#39;t look here...!
                </Text>
              )
            );
          }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    justifyContent: "center",
    height: 50,
    width: "100%",
    // backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    borderWidth: 0.5,
    marginBottom: 10,
    borderRadius: 10,
    gap: 5,
  },
  headerContainer: {
    width: "100%",
    height: height * 0.6,
    position: "relative",
    marginBottom: 20,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: "flex-end",
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    height: "100%",
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    // Fade from transparent at top to black at bottom
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 8,
  },
  card: {
    // backgroundColor: "#181818",
    // marginHorizontal: 16,
    marginTop: -30,
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    width: "100%",
  },
  overview: {
    fontSize: 16,
    color: "#eee",
    textAlign: "center",
    marginBottom: 5,
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
  link: {
    color: "#4faaff",
    textDecorationLine: "underline",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  similarList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: "center",
  },
  movieTitle: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 2,
    color: "#fff",
  },
  similarCard: {
    width: 120,
    marginBottom: 8,
    alignItems: "center",
    backgroundColor: "#181818",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    marginHorizontal: 2,
  },
  similarImage: {
    width: 120,
    height: 180,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  similarNoImage: {
    width: 120,
    height: 180,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  similarNoImageText: {
    color: "#aaa",
    fontSize: 14,
  },
});

export default Details;
