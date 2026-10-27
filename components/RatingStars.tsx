import { ThemedText } from "@/components/ThemedText";
import { radius, spacing, useTheme } from "@/constants/theme";
import { MediaType } from "@/utils/tmdbAccount";
import { setRating, useRating } from "@/utils/ratings";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, View } from "react-native";

/** 5 stars mapped onto TMDB's 10-point scale (1 star = 2). Tap the current star again to clear. */
export default function RatingStars({ type, id }: { type: MediaType; id: number }) {
  const theme = useTheme();
  const rating = useRating(type, id);
  const stars = rating ? Math.round(rating / 2) : 0;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
        borderCurve: "continuous",
        backgroundColor: theme.surface,
      }}
    >
      <ThemedText variant="callout" tone="secondary">
        {stars ? "Your rating" : "Rate this"}
      </ThemedText>
      <View style={{ flexDirection: "row", gap: spacing.xs }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            hitSlop={6}
            onPress={() => {
              void Haptics.selectionAsync();
              setRating(type, id, n === stars ? null : n * 2);
            }}
            accessibilityRole="button"
            accessibilityLabel={n === stars ? "Clear rating" : `Rate ${n} out of 5`}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <MaterialIcons
              name={n <= stars ? "star" : "star-border"}
              size={28}
              color={n <= stars ? theme.star : theme.textTertiary}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
