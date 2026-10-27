import { ThemedText } from "@/components/ThemedText";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { radius, spacing, useTheme } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Pressable, View } from "react-native";

interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
  order?: number;
}

interface CrewMember {
  id: number;
  name: string;
}

const AVATAR = 72;

/**
 * Top-billed cast plus the key crew line ("Directed by" for movies,
 * "Created by" for shows). Tapping a name opens their person page.
 */
export default function CastRow({
  cast,
  crew,
  crewLabel,
}: {
  cast?: CastMember[];
  crew?: CrewMember[];
  crewLabel: string;
}) {
  const theme = useTheme();
  const router = useRouter();
  const topCast = [...(cast ?? [])]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .slice(0, 15);

  if (topCast.length === 0 && !crew?.length) return null;

  const openPerson = (id: number) =>
    router.push({ pathname: "/(player)/person", params: { id: String(id) } });

  return (
    <View>
      <SectionHeader title="Cast & Crew" />

      {crew && crew.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.lg,
          }}
        >
          <ThemedText variant="callout" tone="secondary">
            {crewLabel}{" "}
          </ThemedText>
          {crew.map((person, i) => (
            <Pressable key={person.id} onPress={() => openPerson(person.id)} hitSlop={6}>
              <ThemedText variant="callout">
                {person.name}
                {i < crew.length - 1 ? ", " : ""}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}

      <FlatList
        data={topCast}
        horizontal
        keyExtractor={(item) => `${item.id}-${item.character ?? ""}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openPerson(item.id)}
            accessibilityRole="button"
            accessibilityLabel={item.character ? `${item.name} as ${item.character}` : item.name}
            style={({ pressed }) => ({ width: AVATAR + spacing.md, alignItems: "center", opacity: pressed ? 0.7 : 1 })}
          >
            <View
              style={{
                width: AVATAR,
                height: AVATAR,
                borderRadius: radius.full,
                overflow: "hidden",
                backgroundColor: theme.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {item.profile_path ? (
                <Image
                  source={{ uri: `https://image.tmdb.org/t/p/w185${item.profile_path}` }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                />
              ) : (
                <MaterialIcons name="person" size={32} color={theme.textTertiary} />
              )}
            </View>
            <ThemedText
              variant="caption"
              numberOfLines={2}
              style={{ marginTop: spacing.sm, textAlign: "center", color: theme.text }}
            >
              {item.name}
            </ThemedText>
            {item.character ? (
              <ThemedText
                variant="caption"
                tone="tertiary"
                numberOfLines={1}
                style={{ marginTop: 2, textAlign: "center" }}
              >
                {item.character}
              </ThemedText>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}
