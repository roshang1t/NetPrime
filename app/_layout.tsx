import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import React, { useEffect, useState } from "react";
import { Linking, Modal, ScrollView, useColorScheme, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { artwork, radius, spacing, useTheme } from "@/constants/theme";
import { MovieContextProvider } from "./../contexts/movieContext";
import appJson from "../app.json";
import {
  checkGithubRelease,
  formatReleaseNotes,
  GITHUB_OWNER,
  GITHUB_REPO,
} from "../utils/checkGithubRelease";
import { syncWithTmdb } from "../utils/tmdbSync";
export const unstable_settings = {
  initialRouteName: "index",
  // Only include these as tabs
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [releaseUrl, setReleaseUrl] = useState<string | undefined>(undefined);
  const [latestVersion, setLatestVersion] = useState<string | undefined>(
    undefined,
  );
  const [releaseNotes, setReleaseNotes] = useState("");

  SystemUI.setBackgroundColorAsync(theme.background);

  // Send changes made offline and pull edits from the TMDB website (no-op when signed out)
  useEffect(() => {
    void syncWithTmdb();
  }, []);

  useEffect(() => {
    let mounted = true;
    async function runCheck() {
      try {
        const currentVersion = appJson.expo?.version || "0.0.0";
        const res = await checkGithubRelease(GITHUB_OWNER, GITHUB_REPO, currentVersion);
        if (!mounted) return;
        if (res.isNewer) {
          setLatestVersion(res.latestVersion);
          setReleaseUrl(res.htmlUrl);
          setReleaseNotes(formatReleaseNotes(res.body));
          setModalVisible(true);
        }
      } catch {
        // ignore
      }
    }
    runCheck();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <MovieContextProvider>
      <StatusBar
        style={colorScheme === "light" ? "dark" : "light"}
        translucent
      />
      <Stack screenOptions={{ headerShown: false }} />

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: artwork.dialogScrim,
            justifyContent: "center",
            padding: spacing.xl,
          }}
        >
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: radius.xl,
              borderCurve: "continuous",
              padding: spacing.xl,
              gap: spacing.lg,
            }}
          >
            <View style={{ gap: spacing.xs }}>
              <ThemedText variant="title">Update available</ThemedText>
              <ThemedText variant="callout" tone="secondary">
                {latestVersion ? `Version ${latestVersion}` : "A new release is available."}
              </ThemedText>
            </View>
            {releaseNotes ? (
              <ScrollView style={{ maxHeight: 240 }}>
                <ThemedText variant="callout" tone="secondary">
                  {releaseNotes}
                </ThemedText>
              </ScrollView>
            ) : null}
            <View style={{ gap: spacing.sm }}>
              <Button
                title="Open release"
                icon="system-update"
                onPress={() => {
                  if (releaseUrl) Linking.openURL(releaseUrl);
                }}
              />
              <Button title="Not now" variant="ghost" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </MovieContextProvider>
  );
}
