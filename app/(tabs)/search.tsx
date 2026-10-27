import { GRID_COLUMNS, GRID_POSTER_WIDTH } from "@/components/popularList";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Poster, PosterGridPlaceholder } from "@/components/ui/Poster";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SearchField } from "@/components/ui/SearchField";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { spacing, useTheme } from "@/constants/theme";
import { Movie } from "@/contexts/movieContext";
import { isAbortError, tmdbGet } from "@/utils/api";
import { withPoster } from "@/utils/images";
import { useRegion } from "@/utils/region";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Search: React.FC = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<unknown>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const region = useRegion();

  // TMDB provider ids, "|" = any of. Prime Video is 9 in the US but 119 in e.g. India.
  const PROVIDERS = [
    { name: "Trending", id: null },
    { name: "Netflix", id: "8" },
    { name: "Prime Video", id: "9|119" },
    { name: "Apple TV+", id: "350" },
  ];

  const latestCallIdRef = useRef<number>(0);
  const currentAbortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);

  const fetchInitial = useCallback(async (providerId: string | null = selectedProvider): Promise<void> => {
    setSearchLoading(true);
    setSearchError(null);
    try {
      if (!providerId) {
        const data = await tmdbGet(`trending/all/day?language=en-US&page=1`);
        // Also drops people from trending/all, which have no poster_path
        setSearchResults(withPoster(data.results) as any);
      } else {
        const [tvData, movieData] = await Promise.all([
          tmdbGet(`discover/tv?language=en-US&sort_by=popularity.desc&watch_region=${region}&with_watch_providers=${encodeURIComponent(providerId)}`),
          tmdbGet(`discover/movie?language=en-US&sort_by=popularity.desc&watch_region=${region}&with_watch_providers=${encodeURIComponent(providerId)}`),
        ]);

        const combined = withPoster([...(tvData.results || []), ...(movieData.results || [])])
          .sort((a: any, b: any) => b.popularity - a.popularity);

        setSearchResults(combined as any);
      }
    } catch (err) {
      setSearchError(err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [selectedProvider, region]);

  // Use useCallback to memoize the handleSearch function itself
  const handleSearch = useCallback(
    async (query: string) => {
      // Increment the ID for this specific call initiation.
      // Use .current on the ref.
      const thisCallId = ++latestCallIdRef.current;

      setSearchQuery(query); // Update the input query display immediately

      // Clear any existing debounce timer immediately
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null; // Clear the ref after clearing
      }

      // Abort any previous in-flight fetch request immediately
      if (currentAbortControllerRef.current) {
        currentAbortControllerRef.current.abort();

        currentAbortControllerRef.current = null; // Clear the ref after aborting
      }

      if (!query) {
        // setSearchResults([]);
        setSearchError(null);
        setSearchLoading(false);
        fetchInitial();
        // If query is cleared, reset the latest ID so a new search is truly 'first'.
        latestCallIdRef.current = 0;
        return;
      }

      // Indicate loading as soon as a query is present
      if (!searchLoading) setSearchLoading(true);
      setSearchError(null);

      // Set a new debounce timeout for this specific call
      searchTimeoutRef.current = setTimeout(async () => {
        // --- CRITICAL CHECK 1: Is this still the latest intended call after debounce? ---
        // Compare this call's ID with the globally latest initiated ID
        if (thisCallId !== latestCallIdRef.current) {
          setSearchLoading(false); // Make sure loading is turned off for abandoned calls
          return; // Exit here if a newer call has already started
        }

        // Create a new AbortController for this fetch operation
        const controller = new AbortController();
        currentAbortControllerRef.current = controller; // Store it in the ref
        const signal = controller.signal;

        try {
          const data = await tmdbGet(
            `search/multi?query=${encodeURIComponent(query)}&language=en-US`,
            signal, // Link fetch to AbortController
          );

          // --- CRITICAL CHECK 2: After fetch, is this still the latest intended call? ---
          // This handles cases where a new call starts *during* the fetch operation.
          if (thisCallId !== latestCallIdRef.current) {
            return; // Exit if newer call exists
          }

          // Check if the fetch was explicitly aborted (e.g., by a newer call)
          if (signal.aborted) {
            return; // Exit if aborted
          }


          // --- CRITICAL CHECK 3: Final check before updating state ---
          if (thisCallId === latestCallIdRef.current) {
            // Posterless titles, adult titles and people (no poster_path) are dropped
            setSearchResults(withPoster<Movie>(data.results ?? []) as any);
          } else {
          }
        } catch (err) {
          // Check if the error is due to abortion (an expected "cancellation")
          // (DOMException isn't reliably defined on Hermes, so check the name)
          if (isAbortError(err)) {
            // Cancelled by a newer keystroke: nothing to show
          }
          // Only set error state if it's not an abort and it's for the currently latest call
          else if (thisCallId === latestCallIdRef.current) {
            setSearchError(err);
            setSearchResults([]); // Clear results on error for the latest call
          }
        } finally {
          // --- CRITICAL CHECK 4: Ensure loading state is only managed by the latest call ---
          if (thisCallId === latestCallIdRef.current) {
            setSearchLoading(false);
          }
          currentAbortControllerRef.current = null; // Always clear the controller ref when done
        }
      }, 500); // Debounce time: 300 milliseconds
    },
    [fetchInitial, searchLoading],
  ); // Keep handler aligned with the initial fetch and loading state

  // Optional: Cleanup on unmount
  useEffect(() => {
    fetchInitial();
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (currentAbortControllerRef.current) {
        currentAbortControllerRef.current.abort();
      }
    };
  }, [fetchInitial]);

  const router = useRouter();

  const handlePress = (item: Movie) => {
    if (item.name) {
      router.push({
        pathname: "/(player)/tvDetails",
        params: { id: item.id.toString() },
      });
    } else {
      router.push({
        pathname: "/(player)/details",
        params: { id: item.id.toString() },
      });
    }
  };

  const providerName = PROVIDERS.find((p) => p.id === selectedProvider)?.name;
  const listTitle = searchQuery
    ? "Results"
    : providerName && selectedProvider
      ? `Popular on ${providerName}`
      : "Trending Today";

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader tab title="Search" />
      <View style={{ paddingHorizontal: spacing.lg }}>
        <SearchField
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Movies, shows and more"
        />
      </View>

      {!searchQuery && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          // Horizontal ScrollViews default to flexShrink: 1, so a tall grid below
          // would squeeze this row and clip the chips
          style={{ flexGrow: 0, flexShrink: 0 }}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm }}
        >
          {PROVIDERS.map((provider) => (
            <Chip
              key={provider.name}
              label={provider.name}
              selected={selectedProvider === provider.id}
              onPress={() => {
                setSelectedProvider(provider.id);
                fetchInitial(provider.id);
              }}
            />
          ))}
        </ScrollView>
      )}

      <SectionHeader title={listTitle} style={{ marginTop: spacing.lg }} />

      {searchLoading ? (
        <PosterGridPlaceholder width={GRID_POSTER_WIDTH} columns={GRID_COLUMNS} rows={3} />
      ) : searchError ? (
        <ErrorState
          error={searchError}
          onRetry={() => (searchQuery ? handleSearch(searchQuery) : fetchInitial())}
        />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          data={searchResults as Movie[]}
          renderItem={({ item }) => (
            <Poster
              path={item.poster_path}
              width={GRID_POSTER_WIDTH}
              onPress={() => handlePress(item)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          numColumns={GRID_COLUMNS}
          columnWrapperStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg }}
          contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xxl, flexGrow: 1 }}
          ListEmptyComponent={
            searchQuery ? (
              <EmptyState
                icon="search-off"
                title="No results"
                message={`Nothing matched "${searchQuery}". Try another title.`}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

export const options = {
  animation: "fade",
};

export default React.memo(Search);
