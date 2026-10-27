import appJson from "@/app.json";
import RegionPicker from "@/components/RegionPicker";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { ListGroup, ListRow } from "@/components/ui/List";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { artwork, radius, spacing, useTheme } from "@/constants/theme";
import {
  checkGithubRelease,
  formatReleaseNotes,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_URL,
} from "@/utils/checkGithubRelease";
import { useCountryName } from "@/utils/countries";
import { clearAppCache, clearWatchHistory } from "@/utils/history";
import { flagEmoji, useRegion } from "@/utils/region";
import { getTmdbSession, loginWithTmdb, logoutTmdb } from "@/utils/tmdbAccount";
import { clearTmdbPending, connectTmdbSync, syncWithTmdb } from "@/utils/tmdbSync";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Linking, Modal, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MoreScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [aboutVisible, setAboutVisible] = useState(false);
  const [tmdbUser, setTmdbUser] = useState<string | null>(null);
  const [tmdbBusy, setTmdbBusy] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const region = useRegion();
  const countryName = useCountryName(region);

  useFocusEffect(
    useCallback(() => {
      void getTmdbSession().then((s) => setTmdbUser(s?.username ?? null));
    }, []),
  );

  async function connectTmdb() {
    setTmdbBusy(true);
    try {
      const session = await loginWithTmdb();
      if (!session) return; // closed the browser without approving
      setTmdbUser(session.username);
      const synced = await connectTmdbSync();
      Alert.alert(
        "Connected",
        synced
          ? `My List and ratings are now synced with ${session.username}.`
          : `Signed in as ${session.username}. My List and ratings will sync when you're back online.`,
      );
    } catch {
      Alert.alert("Couldn't connect", "Check your connection and try again.");
    } finally {
      setTmdbBusy(false);
    }
  }

  async function handleTmdbSync() {
    if (tmdbBusy) return;
    if (!tmdbUser) {
      Alert.alert(
        "Sync My List with TMDB",
        "Optional. Sign in with a free TMDB account to back up My List and your ratings, and keep them in sync across devices.\n\nYou sign in on themoviedb.org, so this app never sees your password.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Continue", onPress: connectTmdb },
        ],
      );
      return;
    }
    Alert.alert("TMDB sync", `My List and ratings are synced with ${tmdbUser}.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sync now",
        onPress: async () => {
          setTmdbBusy(true);
          const ok = await syncWithTmdb();
          // A session revoked on TMDB is dropped during sync
          const session = await getTmdbSession();
          setTmdbUser(session?.username ?? null);
          setTmdbBusy(false);
          if (!session) {
            Alert.alert("Signed out", "Your TMDB session expired. Connect again to keep syncing.");
          } else {
            Alert.alert(
              ok ? "Synced" : "Sync failed",
              ok ? "My List and ratings are up to date." : "Check your connection and try again.",
            );
          }
        },
      },
      {
        text: "Disconnect",
        style: "destructive",
        onPress: async () => {
          await logoutTmdb();
          clearTmdbPending();
          setTmdbUser(null);
          Alert.alert("Disconnected", "My List and ratings stay on this device.");
        },
      },
    ]);
  }

  async function handleClearCache() {
    Alert.alert("Clear cache", "Clear app cache and history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          await clearAppCache();
          Alert.alert("Done", "Cache cleared.");
        },
      },
    ]);
  }

  async function handleClearHistory() {
    Alert.alert("Clear watch history", "Remove all watch history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          await clearWatchHistory();
          Alert.alert("Done", "History cleared.");
        },
      },
    ]);
  }

  async function handleCheckUpdate() {
    setCheckingUpdate(true);
    const current = appJson.expo?.version || "0.0.0";
    const res = await checkGithubRelease(GITHUB_OWNER, GITHUB_REPO, current);
    setCheckingUpdate(false);
    if (res.isNewer) {
      const releasePage = res.htmlUrl;
      const notes = formatReleaseNotes(res.body, 600);
      Alert.alert("Update available", `Latest: ${res.latestVersion}${notes ? `\n\n${notes}` : ""}`, [
        {
          text: "Open",
          onPress: () => releasePage && Linking.openURL(releasePage),
        },
        { text: "OK", style: "cancel" },
      ]);
    } else {
      Alert.alert("Up to date", `Current: ${current}`);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <ScreenHeader tab title="More" />
        <View style={{ paddingHorizontal: spacing.lg }}>
          <ListGroup title="Library">
            <ListRow icon="bookmarks" label="My List" onPress={() => router.push("/watchlist")} />
            <ListRow icon="history" label="Watch history" onPress={() => router.push("/watchHistory")} />
          </ListGroup>

          <ListGroup title="Preferences">
            <ListRow
              icon="public"
              label="Region"
              value={`${flagEmoji(region)} ${countryName}`}
              onPress={() => setRegionOpen(true)}
            />
          </ListGroup>

          <ListGroup title="TMDB sync · optional">
            <ListRow
              icon={tmdbUser ? "cloud-done" : "cloud-sync"}
              label={tmdbBusy ? "Syncing…" : tmdbUser ? "Connected" : "Connect TMDB account"}
              value={tmdbUser ?? undefined}
              onPress={handleTmdbSync}
              disabled={tmdbBusy}
            />
          </ListGroup>

          <ListGroup title="Storage">
            <ListRow icon="cleaning-services" label="Clear cache" onPress={handleClearCache} accessory="none" />
            <ListRow
              icon="delete-outline"
              label="Clear watch history"
              onPress={handleClearHistory}
              destructive
              accessory="none"
            />
          </ListGroup>

          <ListGroup title="About">
            <ListRow
              icon="info-outline"
              label="About NetPrime"
              value={`v${appJson.expo?.version}`}
              onPress={() => setAboutVisible(true)}
            />
            <ListRow
              icon="star-outline"
              label="Star this project"
              accessory="external"
              onPress={() => Linking.openURL(GITHUB_URL)}
            />
          </ListGroup>
        </View>
      </ScrollView>

      <RegionPicker visible={regionOpen} onClose={() => setRegionOpen(false)} />

      <Modal
        visible={aboutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAboutVisible(false)}
      >
        <Pressable
          onPress={() => setAboutVisible(false)}
          style={{
            flex: 1,
            backgroundColor: artwork.dialogScrim,
            justifyContent: "center",
            padding: spacing.xl,
          }}
        >
          {/* Inner Pressable swallows taps so only the backdrop closes the dialog */}
          <Pressable
            style={{
              backgroundColor: theme.surface,
              borderRadius: radius.xl,
              borderCurve: "continuous",
              padding: spacing.xl,
              gap: spacing.lg,
            }}
          >
            <View style={{ gap: spacing.xs }}>
              <ThemedText variant="title">NetPrime</ThemedText>
              <ThemedText variant="callout" tone="secondary">
                Version {appJson.expo?.version}
              </ThemedText>
            </View>
            <View style={{ gap: spacing.sm }}>
              <Button
                title="Check for update"
                icon="system-update"
                onPress={handleCheckUpdate}
                loading={checkingUpdate}
              />
              <Button
                title="View on GitHub"
                variant="secondary"
                icon="code"
                onPress={() => Linking.openURL(GITHUB_URL)}
              />
              <Button title="Close" variant="ghost" onPress={() => setAboutVisible(false)} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
