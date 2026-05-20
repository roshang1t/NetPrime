import { addToWatchHistory } from "@/utils/history";
import { Ionicons } from "@expo/vector-icons";
import { useKeepAwake } from "expo-keep-awake";
import { useGlobalSearchParams, useNavigation } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { Colors } from "react-native/Libraries/NewAppScreen"; // Make sure Colors is correctly imported or defined

const GITHUB_RAW_JSON_URL =
  "https://raw.githubusercontent.com/roshang1t/NetPrime/refs/heads/master/providers.json";

interface Provider {
  // Renamed from 'providers' to 'Provider' for single item type
  id: string;
  name: string;
  urls: {
    movie: string;
    tv: string;
  };
  allowedDomain: string;
}

export const Player: React.FC = () => {
  useKeepAwake();
  // Ensure these params are converted to string if they might be arrays or undefined
  const { id, type, season, ep } = useGlobalSearchParams<{
    id: string;
    type: string;
    season?: string;
    ep?: string;
    title?: string;
    poster_path?: string;
  }>();
  const { title, poster_path } = useGlobalSearchParams<{
    title?: string;
    poster_path?: string;
  }>();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null,
  ); // State to hold the currently selected provider
  const [loading, setLoading] = useState(true); // Added loading state for initial fetch
  const [error, setError] = useState<unknown>(null); // Explicitly setting to null

  const colorScheme = useColorScheme();
  const color = Colors[colorScheme ?? "dark"]; // Ensure Colors is properly defined/imported

  const navigation = useNavigation();

  useEffect(() => {
    if (id) {
      void addToWatchHistory({
        id,
        title: title || `${type === "tv" ? "TV" : "Movie"} ${id}`,
        type,
        season,
        episode: ep,
        poster_path,
      });
    }

    const fetchEmbedProviders = async () => {
      try {
        const response = await fetch(GITHUB_RAW_JSON_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Provider[] = await response.json();
        setProviders(data);

        if (data.length > 0) {
          setSelectedProvider(data[0]); // Set the first provider as selected by default
        }
      } catch (e) {
        setError(e);
        console.error("Failed to fetch embed providers:", e);
      } finally {
        setLoading(false); // Set loading to false once fetch is complete (success or error)
      }
    };

    fetchEmbedProviders();
  }, [id, title, type, season, ep, poster_path]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false, animation: "fade" });
  }, [navigation]);

  interface ShouldStartLoadEvent {
    url: string;
    [key: string]: any;
  }

  // Handle URL navigation inside WebView
  const handleShouldStartLoadWithRequest = (
    event: ShouldStartLoadEvent,
  ): boolean => {
    const { url } = event;

    // Dynamically check against the base domains of all fetched providers
    const allowedDomains: string[] = providers
      .map((p) => {
        try {
          return `${p.allowedDomain}`;
        } catch (e) {
          console.warn(
            `Invalid URL format in provider ${p.name}: ${p.urls.movie}`,
            e,
          );
          return null;
        }
      })
      .filter((domain): domain is string => Boolean(domain)); // Filter out any null values from invalid URLs

    if (allowedDomains.some((domain) => url.startsWith(domain))) {
      return true; // Allow navigation to any of the fetched provider domains
    } else {
      console.warn(`Blocked external navigation from WebView: ${url}`);
      return false; // Prevent WebView from loading the external URL
    }
  };

  // Prevent WebView from opening new windows (pop-ups)
  const handleOnOpenWindow = ({
    nativeEvent,
  }: {
    nativeEvent: { targetUrl: string };
  }) => {
    console.log("WebView tried to open new window:", nativeEvent.targetUrl);
    return false;
  };

  // Listen for fullscreen events from the WebView
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && data.type === "fullscreenchange" && data.isFullscreen) {
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE,
        );
      } else if (
        data &&
        data.type === "fullscreenchange" &&
        !data.isFullscreen
      ) {
        ScreenOrientation.unlockAsync();
      }
    } catch (e) {
      console.error("Error parsing WebView message:", e);
    }
  };

  // Function to construct the WebView URL based on selectedProvider
  const getWebViewUrl = () => {
    if (!selectedProvider || !id) {
      // Return a blank page or a placeholder URL if no provider is selected or id is missing
      return "about:blank";
    }

    let urlTemplate = "";
    if (type === "tv" && season && ep) {
      urlTemplate = selectedProvider.urls.tv;

      return (
        urlTemplate
          .replace(/\$\{id\}/g, id)
          .replace(/\$\{season\}/g, season)
          .replace(/\$\{episode\}/g, ep) +
        (selectedProvider.id === "videasy"
          ? "?nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true"
          : "")
      );
    } else if (type === "movie") {
      urlTemplate = selectedProvider.urls.movie;
      // Replace placeholders for movies
      return urlTemplate.replace(/\$\{id\}/g, id);
    }
    return "about:blank"; // Fallback if type is neither movie nor tv, or params are missing
  };

  // Render loading state
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: "#000" },
        ]}
      >
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading providers...</Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: "#000" },
        ]}
      >
        <Text style={styles.errorText}>Error loading providers:</Text>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : String(error)}
        </Text>
        <TouchableOpacity onPress={() => setLoading(true)}>
          {" "}
          {/* Allow retry */}
          <Text style={styles.retryText}>Tap to Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={"light"} translucent />
      <SafeAreaView style={[styles.container, { backgroundColor: "#000" }]}>
        <WebView
          key={selectedProvider?.id || "default"} // Key changes to force WebView re-render when provider changes
          style={[
            styles.webview,
            {
              backgroundColor: "#000",
            },
          ]}
          javaScriptEnabled={true}
          allowsFullscreenVideo={true}
          injectedJavaScriptBeforeContentLoaded=""
          overScrollMode="never"
          startInLoadingState={true}
          renderLoading={() => (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color="#007bff" />
            </View>
          )}
          source={{ uri: getWebViewUrl() }} // Dynamic URL from getWebViewUrl
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          setSupportMultipleWindows={false}
          onOpenWindow={handleOnOpenWindow}
          onMessage={handleMessage}
          injectedJavaScript={`
            document.documentElement.style.backgroundColor = '#000000';
            document.body.style.backgroundColor = '#000000';
            // Post message when fullscreen changes
            document.addEventListener('fullscreenchange', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'fullscreenchange', isFullscreen: !!document.fullscreenElement }));
            });
            // Auto-play the video if possible (this is often blocked by browsers/WebViews for user experience)
            const video = document.querySelector('video');
            if (video) {
                video.play().catch(e => console.log("Autoplay failed:", e));
            }
            true;
          `}
        />

        <View style={styles.providerListSection}>
          <Text style={styles.infoText}>
            Please select another provider if getting an error in the current
            one.{"\n"}or select diffrent server in player
          </Text>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.flatListContentContainer}
            data={providers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedProvider(item); // Set the selected provider on press
                }}
                style={[
                  styles.providerItem,
                  selectedProvider?.id === item.id &&
                    styles.providerItemSelected, // Apply selected style
                ]}
              >
                <Ionicons
                  name="play"
                  color={
                    selectedProvider?.id === item.id ? Colors.white : color.text
                  }
                  size={20}
                />
                <Text
                  style={[
                    styles.providerName,
                    selectedProvider?.id === item.id &&
                      styles.providerNameSelected, // Apply selected text style
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1, // Ensure it takes full space for centering
    justifyContent: "center",
    alignItems: "center",
  },
  webview: {
    flex: 1, // WebView takes up remaining space
  },
  providerListSection: {
    height: "15%", // Adjusted height slightly for better visual balance, or set to a fixed number like 180
    backgroundColor: Colors.background, // Use Colors.background for consistency
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth, // Small line to separate from WebView
    borderTopColor: "#fff",
    // borderTopLeftRadius: 0,
  },
  infoText: {
    color: "#fff", // Orange color for warning

    fontWeight: "400", // Slightly bolder than 200
    fontSize: 10, // Slightly larger
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 5,
  },
  flatListContentContainer: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  providerItem: {
    backgroundColor: "#333", // Use Colors.card or a light color from Colors
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8, // Increased gap for better spacing between icon and text
    marginHorizontal: 5, // Spacing between items
    // Min width and height for consistent button size
    minWidth: 120,
    height: 50,
    elevation: 3,
  },
  providerItemSelected: {
    backgroundColor: "#0a7ea4", // Blue background for selected item
    borderColor: "#0a7ea4",
    borderWidth: 2, // Thicker border for selected
    fontWeight: "bold",
  },
  providerName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text, // Use Colors.text for dynamic color
  },
  providerNameSelected: {
    color: Colors.white, // White text for selected item
  },
  loadingText: {
    color: Colors.text,
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: Colors.error, // Assuming Colors.error exists or define 'red'
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  retryText: {
    color: "#007bff", // Blue for retry text
    fontSize: 16,
    marginTop: 10,
    textDecorationLine: "underline",
  },
});

export default Player;
