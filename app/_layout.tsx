import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import React, { useEffect, useState } from "react";
import {
  Button,
  Linking,
  Modal,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import appJson from "../app.json";
import { checkGithubRelease } from "../utils/checkGithubRelease";
export const unstable_settings = {
  initialRouteName: "index",
  // Only include these as tabs
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [releaseUrl, setReleaseUrl] = useState<string | undefined>(undefined);
  const [latestVersion, setLatestVersion] = useState<string | undefined>(
    undefined,
  );

  SystemUI.setBackgroundColorAsync("#000000");

  useEffect(() => {
    let mounted = true;
    async function runCheck() {
      try {
        const currentVersion = appJson.expo?.version || "0.0.0";
        const res = await checkGithubRelease(
          "roshang1t",
          "NetPrime",
          currentVersion,
        );
        if (!mounted) return;
        if (res.isNewer) {
          setLatestVersion(res.latestVersion);
          setReleaseUrl(res.htmlUrl);
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
    <>
      <StatusBar
        style={colorScheme === "light" ? "dark" : "light"}
        translucent
      />
      <Stack screenOptions={{ headerShown: false }} />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.container}>
            <Text style={styles.title}>New version available</Text>
            <Text style={styles.body}>
              {latestVersion
                ? `Latest: ${latestVersion}`
                : "A new release is available."}
            </Text>
            <View style={styles.buttons}>
              <Button
                title="Open release"
                onPress={() => {
                  if (releaseUrl) Linking.openURL(releaseUrl);
                }}
              />
              <Button title="Dismiss" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "86%",
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "600", marginBottom: 8 },
  body: { color: "#ddd", fontSize: 14, marginBottom: 16, textAlign: "center" },
  buttons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "space-between",
  },
});
