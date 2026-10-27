import { ActionButton } from "@/components/ui/ActionButton";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { StyleProp, ViewStyle } from "react-native";

interface Video {
  key: string;
  site: string;
  type: string;
  official?: boolean;
}

// Prefer an official trailer, then any trailer, then a teaser
function pickTrailer(videos?: Video[]): Video | undefined {
  const youtube = (videos ?? []).filter((v) => v.site === "YouTube");
  return (
    youtube.find((v) => v.type === "Trailer" && v.official) ??
    youtube.find((v) => v.type === "Trailer") ??
    youtube.find((v) => v.type === "Teaser")
  );
}

/** Renders nothing when TMDB has no YouTube trailer for the title. */
export default function TrailerButton({
  videos,
  style,
}: {
  videos?: Video[];
  style?: StyleProp<ViewStyle>;
}) {
  const trailer = pickTrailer(videos);
  if (!trailer) return null;

  return (
    <ActionButton
      icon="smart-display"
      label="Trailer"
      onPress={() =>
        WebBrowser.openBrowserAsync(
          `https://www.youtube.com/watch?v=${encodeURIComponent(trailer.key)}`,
        )
      }
      accessibilityLabel="Watch trailer"
      style={style}
    />
  );
}
