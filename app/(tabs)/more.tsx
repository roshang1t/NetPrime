import appJson from "@/app.json";
import { Colors } from "@/constants/Colors";
import { checkGithubRelease } from "@/utils/checkGithubRelease";
import { clearAppCache, clearWatchHistory } from "@/utils/history";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MoreScreen() {
  const router = useRouter();
  const [aboutVisible, setAboutVisible] = useState(false);

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
    const current = appJson.expo?.version || "0.0.0";
    const res = await checkGithubRelease("roshan669", "Uott", current);
    if (res.isNewer) {
      const releasePage = res.htmlUrl;
      Alert.alert("Update available", `Latest: ${res.latestVersion}`, [
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
    <View
      style={[styles.container, { backgroundColor: Colors.dark.background }]}
    >
      <Text style={[styles.header, { color: Colors.dark.text }]}>Options</Text>

      <TouchableOpacity style={styles.item} onPress={handleClearCache}>
        <View style={styles.left}>
          <MaterialIcons name="delete" size={22} color={Colors.dark.text} />
          <Text style={[styles.label, { color: Colors.dark.text }]}>
            Clear cache
          </Text>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={22}
          color={Colors.dark.text}
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={handleClearHistory}>
        <View style={styles.left}>
          <MaterialIcons name="history" size={22} color={Colors.dark.text} />
          <Text style={[styles.label, { color: Colors.dark.text }]}>
            Clear watch history
          </Text>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={22}
          color={Colors.dark.text}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => router.push("/watchHistory")}
      >
        <View style={styles.left}>
          <MaterialIcons name="list" size={22} color={Colors.dark.text} />
          <Text style={[styles.label, { color: Colors.dark.text }]}>
            Watch history
          </Text>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={22}
          color={Colors.dark.text}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => setAboutVisible(true)}
      >
        <View style={styles.left}>
          <MaterialIcons name="info" size={22} color={Colors.dark.text} />
          <Text style={[styles.label, { color: Colors.dark.text }]}>About</Text>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={22}
          color={Colors.dark.text}
        />
      </TouchableOpacity>

      <Modal visible={aboutVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: Colors.dark.background },
            ]}
          >
            <Text style={[styles.title, { color: Colors.dark.text }]}>
              About
            </Text>
            <Text style={{ color: Colors.dark.text }}>
              Version: {appJson.expo?.version}
            </Text>
            <View style={{ height: 12 }} />
            <TouchableOpacity style={styles.cta} onPress={handleCheckUpdate}>
              <Text style={{ color: Colors.dark.text }}>Check for update</Text>
            </TouchableOpacity>
            <View style={{ height: 8 }} />
            <TouchableOpacity
              style={styles.cta}
              onPress={() => setAboutVisible(false)}
            >
              <Text style={{ color: Colors.dark.text }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 20, fontWeight: "600", marginBottom: 12 },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12 },
  label: { marginLeft: 12, fontSize: 16 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "86%",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 10,
  },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  cta: { paddingVertical: 10, alignItems: "center" },
});
