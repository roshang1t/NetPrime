import { ThemedText } from "@/components/ThemedText";
import { spacing } from "@/constants/theme";
import React, { useState } from "react";
import { Pressable } from "react-native";

/** Body text clamped to `lines`, tap to expand. */
export function ExpandableText({ text, lines = 3 }: { text: string; lines?: number }) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);

  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      disabled={!clamped && !expanded}
      accessibilityRole="button"
      accessibilityHint={expanded ? "Collapse text" : "Expand text"}
    >
      <ThemedText
        variant="body"
        tone="secondary"
        numberOfLines={expanded ? undefined : lines}
        onTextLayout={(e) => {
          if (!expanded) setClamped(e.nativeEvent.lines.length >= lines);
        }}
      >
        {text}
      </ThemedText>
      {(clamped || expanded) && (
        <ThemedText variant="callout" style={{ marginTop: spacing.xs }}>
          {expanded ? "Less" : "More"}
        </ThemedText>
      )}
    </Pressable>
  );
}
