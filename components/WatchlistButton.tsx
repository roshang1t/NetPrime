import { ActionButton } from "@/components/ui/ActionButton";
import { toggleWatchlist, useIsInWatchlist, WatchlistItem } from "@/utils/watchlist";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleProp, ViewStyle } from "react-native";

export default function WatchlistButton({
  item,
  style,
}: {
  item: WatchlistItem;
  style?: StyleProp<ViewStyle>;
}) {
  const saved = useIsInWatchlist(item.id, item.type);

  return (
    <ActionButton
      icon={saved ? "check" : "add"}
      label="My List"
      active={saved}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toggleWatchlist(item);
      }}
      accessibilityLabel={saved ? "Remove from My List" : "Add to My List"}
      style={style}
    />
  );
}
