import { ThemedText } from "@/components/ThemedText";
import { radius, spacing, useTheme } from "@/constants/theme";
import { describeError, ErrorKind } from "@/utils/errors";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

const ICONS: Record<ErrorKind, IconName> = {
  offline: "wifi-off",
  timeout: "hourglass-empty",
  unavailable: "cloud-off",
  notFound: "search-off",
  rateLimited: "hourglass-empty",
  server: "cloud-off",
  unknown: "error-outline",
};

/**
 * Friendly error with a Retry button.
 * - full (default): centered, for a whole screen or a large section
 * - compact: a single card, for a row or "load more" footer
 */
export function ErrorState({
  error,
  onRetry,
  onBack,
  compact,
  title: titleOverride,
  style,
}: {
  error: unknown;
  onRetry?: () => void;
  onBack?: () => void;
  compact?: boolean;
  /** Replaces the generic title, e.g. "Couldn't load more" */
  title?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const friendly = useMemo(() => describeError(error), [error]);
  const title = titleOverride ?? friendly.title;

  useEffect(() => {
    // Raw details stay in the dev console, never on screen
    if (__DEV__ && error) console.warn("[request failed]", error);
  }, [error]);

  if (compact) {
    return (
      <View
        accessibilityRole="alert"
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            marginHorizontal: spacing.lg,
            padding: spacing.md,
            paddingLeft: spacing.lg,
            borderRadius: radius.lg,
            borderCurve: "continuous",
            backgroundColor: theme.surface,
          },
          style,
        ]}
      >
        <MaterialIcons name={ICONS[friendly.kind]} size={22} color={theme.textSecondary} />
        <View style={{ flex: 1, gap: 2 }}>
          <ThemedText variant="headline" numberOfLines={1}>
            {title}
          </ThemedText>
          <ThemedText variant="caption" tone="secondary" numberOfLines={2}>
            {friendly.message}
          </ThemedText>
        </View>
        {onRetry && <Button title="Retry" size="sm" variant="secondary" onPress={onRetry} />}
      </View>
    );
  }

  return (
    <View accessibilityRole="alert" style={style}>
      <EmptyState
        icon={ICONS[friendly.kind]}
        title={title}
        message={friendly.message}
        action={
          onRetry || onBack ? (
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {onBack && <Button title="Go back" variant="secondary" onPress={onBack} />}
              {onRetry && <Button title="Try again" icon="refresh" onPress={onRetry} />}
            </View>
          ) : undefined
        }
      />
    </View>
  );
}
