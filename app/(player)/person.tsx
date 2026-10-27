import { GRID_POSTER_WIDTH } from "@/components/popularList";
import { ThemedText } from "@/components/ThemedText";
import { ErrorState } from "@/components/ui/ErrorState";
import { ExpandableText } from "@/components/ui/ExpandableText";
import { IconButton } from "@/components/ui/IconButton";
import { Poster } from "@/components/ui/Poster";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { radius, spacing, useTheme } from "@/constants/theme";
import { tmdbGet } from "@/utils/api";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Credit {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  poster_path: string | null;
  vote_count: number;
  adult?: boolean;
}

interface PersonData {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  known_for_department: string;
  profile_path: string | null;
  combined_credits?: { cast: Credit[]; crew: Credit[] };
}

const PHOTO = 112;

const Person: React.FC = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [person, setPerson] = useState<PersonData | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    navigation.setOptions({ headerShown: false, animation: "fade" });
  }, [navigation]);

  useEffect(() => {
    async function fetchPerson() {
      setError(null);
      setPerson(null);
      try {
        setPerson(await tmdbGet(`person/${id}?language=en-US&append_to_response=combined_credits`));
      } catch (err) {
        setError(err);
      }
    }
    fetchPerson();
  }, [id, attempt]);

  // Acting and crew credits together, one entry per title, most-voted first
  const knownFor = useMemo(() => {
    const credits = [
      ...(person?.combined_credits?.cast ?? []),
      ...(person?.combined_credits?.crew ?? []),
    ];
    const seen = new Set<string>();
    return credits
      .filter((c) => {
        const key = `${c.media_type}-${c.id}`;
        if (seen.has(key) || !c.poster_path || c.adult) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => b.vote_count - a.vote_count)
      .slice(0, 30);
  }, [person]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: theme.background }}>
        <ErrorState
          error={error}
          onRetry={() => setAttempt((n) => n + 1)}
          onBack={() => router.back()}
        />
      </View>
    );
  }

  if (!person) {
    // Same layout as the loaded page so nothing jumps
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={{ paddingHorizontal: spacing.sm, paddingTop: spacing.xs }}>
          <IconButton icon="arrow-back" onPress={() => router.back()} accessibilityLabel="Back" />
        </View>
        <View
          accessibilityLabel="Loading"
          style={{ flexDirection: "row", gap: spacing.lg, paddingHorizontal: spacing.lg, marginTop: spacing.sm }}
        >
          <Skeleton width={PHOTO} height={PHOTO * 1.5} radius={radius.md} />
          <View style={{ flex: 1, justifyContent: "flex-end", gap: spacing.sm }}>
            <Skeleton width="80%" height={26} />
            <Skeleton width="50%" height={14} />
            <Skeleton width="65%" height={12} />
          </View>
        </View>
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl, gap: spacing.sm }}>
          <Skeleton height={14} />
          <Skeleton height={14} />
          <Skeleton width="70%" height={14} />
        </View>
      </SafeAreaView>
    );
  }

  const life = [
    person.birthday && `Born ${person.birthday}`,
    person.deathday && `Died ${person.deathday}`,
    person.place_of_birth,
  ].filter(Boolean);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: spacing.sm, paddingTop: spacing.xs }}>
          <IconButton icon="arrow-back" onPress={() => router.back()} accessibilityLabel="Back" />
        </View>

        <View style={{ flexDirection: "row", gap: spacing.lg, paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
          <View
            style={{
              width: PHOTO,
              height: PHOTO * 1.5,
              borderRadius: radius.md,
              borderCurve: "continuous",
              overflow: "hidden",
              backgroundColor: theme.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {person.profile_path ? (
              <Image
                source={{ uri: `https://image.tmdb.org/t/p/w300${person.profile_path}` }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
              />
            ) : (
              <MaterialIcons name="person" size={48} color={theme.textTertiary} />
            )}
          </View>
          <View style={{ flex: 1, justifyContent: "flex-end", gap: spacing.xs }}>
            <ThemedText variant="title">{person.name}</ThemedText>
            <ThemedText variant="callout" tone="secondary">
              {person.known_for_department}
            </ThemedText>
            {life.map((line) => (
              <ThemedText key={line as string} variant="caption" tone="tertiary">
                {line}
              </ThemedText>
            ))}
          </View>
        </View>

        {person.biography ? (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
            <ExpandableText text={person.biography} lines={5} />
          </View>
        ) : null}

        {knownFor.length > 0 && (
          <>
            <SectionHeader title="Known For" />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, paddingHorizontal: spacing.lg }}>
              {knownFor.map((item) => (
                <Poster
                  key={`${item.media_type}-${item.id}`}
                  path={item.poster_path}
                  width={GRID_POSTER_WIDTH}
                  title={item.title || item.name}
                  onPress={() =>
                    router.push({
                      pathname: item.media_type === "tv" ? "/(player)/tvDetails" : "/(player)/details",
                      params: { id: String(item.id), type: item.media_type },
                    })
                  }
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Person;
