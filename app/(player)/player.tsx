import { getNextEpisode, markEpisodeWatched, NextEpisode } from "@/utils/episodes";
import { addToWatchHistory } from "@/utils/history";
import { ThemedText } from "@/components/ThemedText";
import { ErrorState } from "@/components/ui/ErrorState";
import { IconButton } from "@/components/ui/IconButton";
import { Colors, radius, spacing, useTheme } from "@/constants/theme";
import { fetchJson } from "@/utils/api";
import { Ionicons } from "@expo/vector-icons";
import { useKeepAwake } from "expo-keep-awake";
import { useGlobalSearchParams, useNavigation, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";

// The player is always dark, whatever the system theme
const dark = Colors.dark;

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
  const [nextEpisode, setNextEpisode] = useState<NextEpisode | null>(null);

  const navigation = useNavigation();
  const router = useRouter();
  const theme = useTheme();

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
      if (type === "tv" && season && ep) {
        markEpisodeWatched(id, Number(season), Number(ep));
      }
    }
  }, [id, title, type, season, ep, poster_path]);

  // Look up the episode after this one, if it has aired
  useEffect(() => {
    setNextEpisode(null);
    if (type !== "tv" || !id || !season || !ep) return;
    let active = true;
    getNextEpisode(id, Number(season), Number(ep)).then((next) => {
      if (active) setNextEpisode(next);
    });
    return () => {
      active = false;
    };
  }, [id, type, season, ep]);

  // Same screen, new params: the WebView reloads and the chosen provider is kept
  const playNextEpisode = () => {
    if (!nextEpisode) return;
    router.setParams({
      season: String(nextEpisode.season),
      ep: String(nextEpisode.episode),
    });
  };

  const fetchEmbedProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson<Provider[]>(GITHUB_RAW_JSON_URL);
      setProviders(data);
      // Keep the current server on retry; otherwise default to the first
      setSelectedProvider((current) => data.find((p) => p.id === current?.id) ?? data[0] ?? null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false); // Set loading to false once fetch is complete (success or error)
    }
  }, []);

  useEffect(() => {
    fetchEmbedProviders();
  }, [fetchEmbedProviders]);

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
    if (__DEV__) console.log("WebView tried to open new window:", nativeEvent.targetUrl);
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
    } catch {
      // Embedded players post their own non-JSON messages; only ours matter
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
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={dark.text} />
        <ThemedText variant="callout" style={{ color: dark.textSecondary, marginTop: spacing.md }}>
          Loading servers…
        </ThemedText>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      // Follows the app theme (ErrorState does); no video is showing yet
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.background }]}>
        <ErrorState
          error={error}
          title="Couldn't load servers"
          onRetry={fetchEmbedProviders}
          onBack={() => router.back()}
        />
      </View>
    );
  }

  const subtitle =
    type === "tv" && season && ep ? `Season ${season} · Episode ${ep}` : undefined;

  return (
    <>
      <StatusBar style={"light"} translucent />
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <IconButton
            icon="arrow-back"
            color={dark.text}
            onPress={() => router.back()}
            accessibilityLabel="Back"
          />
          <View style={{ flex: 1 }}>
            <ThemedText variant="headline" numberOfLines={1} style={{ color: dark.text }}>
              {title || (type === "tv" ? "Episode" : "Movie")}
            </ThemedText>
            {subtitle ? (
              <ThemedText variant="caption" style={{ color: dark.textSecondary }}>
                {subtitle}
              </ThemedText>
            ) : null}
          </View>
        </View>

        <WebView
          key={selectedProvider?.id || "default"} // Key changes to force WebView re-render when provider changes
          style={styles.webview}
          javaScriptEnabled={true}
          allowsFullscreenVideo={true}
          injectedJavaScriptBeforeContentLoaded=""
          overScrollMode="never"
          startInLoadingState={true}
          renderLoading={() => (
            <View style={[StyleSheet.absoluteFill, styles.centerContent]}>
              <ActivityIndicator size="large" color={dark.text} />
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

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <ThemedText variant="overline" style={{ color: dark.textTertiary }}>
              Servers
            </ThemedText>
            {nextEpisode && (
              <Pressable
                onPress={playNextEpisode}
                accessibilityRole="button"
                accessibilityLabel={`Play next episode, season ${nextEpisode.season} episode ${nextEpisode.episode}`}
                style={({ pressed }) => [styles.nextButton, { opacity: pressed ? 0.75 : 1 }]}
              >
                <ThemedText variant="callout" style={{ color: dark.onAccent }}>
                  Next · S{nextEpisode.season} E{nextEpisode.episode}
                </ThemedText>
                <Ionicons name="play-skip-forward" size={14} color={dark.onAccent} />
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.serverList}
          >
            {providers.map((item) => {
              const isSelected = selectedProvider?.id === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setSelectedProvider(item); // Set the selected provider on press
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={({ pressed }) => [
                    styles.serverChip,
                    {
                      backgroundColor: isSelected ? dark.accent : dark.surfaceRaised,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <ThemedText
                    variant="callout"
                    style={{ color: isSelected ? dark.onAccent : dark.text }}
                  >
                    {item.name}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          <ThemedText variant="caption" style={styles.hint}>
            Not playing? Try another server here, or switch servers inside the player.
          </ThemedText>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dark.background,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  webview: {
    flex: 1, // WebView takes up remaining space
    backgroundColor: dark.background,
  },
  panel: {
    // Sized by content so the Next Episode button fits
    backgroundColor: dark.surface,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    minHeight: 32,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: dark.accent,
  },
  serverList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  serverChip: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    justifyContent: "center",
  },
  hint: {
    color: dark.textTertiary,
    paddingHorizontal: spacing.lg,
  },
});

export default Player;
