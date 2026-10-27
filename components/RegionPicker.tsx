import { ThemedText } from "@/components/ThemedText";
import { ErrorState } from "@/components/ui/ErrorState";
import { IconButton } from "@/components/ui/IconButton";
import { SearchField } from "@/components/ui/SearchField";
import { Skeleton } from "@/components/ui/Skeleton";
import { spacing, useTheme } from "@/constants/theme";
import { loadCountries, useCountries } from "@/utils/countries";
import {
  flagEmoji,
  getDeviceRegion,
  setRegion,
  useIsDeviceRegion,
  useRegion,
} from "@/utils/region";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Full-screen country list with search, plus "use device region". */
export default function RegionPicker({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const countries = useCountries();
  const region = useRegion();
  const isDeviceRegion = useIsDeviceRegion();
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState<unknown>(null);

  // The list is cached after the first success; only fetch when it's missing
  useEffect(() => {
    if (visible && countries.length === 0) loadCountries().then(setLoadError);
  }, [visible, countries.length]);

  const retryLoad = () => {
    setLoadError(null);
    loadCountries().then(setLoadError);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q,
    );
  }, [countries, query]);

  const deviceRegion = getDeviceRegion();
  const deviceName = countries.find((c) => c.code === deviceRegion)?.name ?? deviceRegion;

  function choose(code: string | null) {
    setRegion(code);
    setQuery("");
    onClose();
  }

  const row = (key: string, leading: React.ReactNode, label: string, checked: boolean, onPress: () => void) => (
    <Pressable
      key={key}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: checked }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        minHeight: 52,
        paddingHorizontal: spacing.lg,
        backgroundColor: pressed ? theme.surface : "transparent",
      })}
    >
      {leading}
      <ThemedText variant="body" style={{ flex: 1 }}>
        {label}
      </ThemedText>
      {checked && <MaterialIcons name="check" size={22} color={theme.text} />}
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: spacing.lg,
            paddingRight: spacing.sm,
            paddingTop: spacing.sm,
          }}
        >
          <ThemedText variant="display">Region</ThemedText>
          <IconButton icon="close" onPress={onClose} accessibilityLabel="Close" />
        </View>
        <ThemedText
          variant="body"
          tone="secondary"
          style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xs, marginBottom: spacing.lg }}
        >
          Sets Now Playing, Coming Soon, regional rows and streaming filters.
        </ThemedText>

        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search countries"
          style={{ marginHorizontal: spacing.lg, marginBottom: spacing.sm }}
        />

        {row(
          "device",
          <MaterialIcons name="my-location" size={22} color={theme.textSecondary} />,
          `Use device region (${deviceName})`,
          isDeviceRegion,
          () => choose(null),
        )}
        <View style={{ height: 1, backgroundColor: theme.separator, marginHorizontal: spacing.lg }} />

        {countries.length === 0 ? (
          loadError ? (
            <ErrorState
              compact
              error={loadError}
              title="Couldn't load countries"
              onRetry={retryLoad}
              style={{ marginTop: spacing.lg }}
            />
          ) : (
            <View accessibilityLabel="Loading countries">
              {Array.from({ length: 8 }, (_, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                    minHeight: 52,
                    paddingHorizontal: spacing.lg,
                  }}
                >
                  <Skeleton width={26} height={20} />
                  <Skeleton width={`${40 + ((i * 17) % 35)}%`} height={14} />
                </View>
              ))}
            </View>
          )
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item }) =>
              row(
                item.code,
                <ThemedText variant="headline" style={{ width: 26 }}>
                  {flagEmoji(item.code)}
                </ThemedText>,
                item.name,
                !isDeviceRegion && item.code === region,
                () => choose(item.code),
              )
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
