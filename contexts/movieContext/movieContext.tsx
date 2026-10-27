import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { tmdbGet } from "@/utils/api";
import { prefetchPosters, withPoster } from "@/utils/images";
import { useRegion } from "@/utils/region";
import { Movie, MovieContextType, Series } from "./types";

// API constants live in utils/api; re-exported here for existing imports
export { API_BEARER_TOKEN, API_HEADERS, API_URL } from "@/utils/api";

// Default context value for initial creation and for cases where it's used outside a Provider.
// Ensure all properties from MovieContextType are present.
const MovieContext = createContext<MovieContextType | undefined>(undefined);

interface MovieContextProviderProps {
  children: React.ReactNode;
}

interface Page<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// Append a page, skipping ids already in the list
function mergePage<T extends { id: number }>(prev: T[], next: T[]): T[] {
  return [...prev, ...next.filter((n) => !prev.some((p) => p.id === n.id))];
}

// Pages to skip past at most when every result on one lacks artwork
const MAX_EMPTY_PAGES = 3;

/**
 * Fetch a page keeping only titles with a poster. If a whole page is filtered
 * out, move on to the next one: the list wouldn't grow, so FlatList would never
 * fire onEndReached again and infinite scroll would stall.
 */
async function fetchUsablePage<T extends { poster_path?: string | null; adult?: boolean }>(
  pathForPage: (page: number) => string,
  page: number,
): Promise<{ data: Page<T>; results: T[] }> {
  let data = await tmdbGet<Page<T>>(pathForPage(page));
  let results = withPoster(data.results);
  for (let skipped = 0; results.length === 0 && data.page < data.total_pages && skipped < MAX_EMPTY_PAGES; skipped++) {
    data = await tmdbGet<Page<T>>(pathForPage(data.page + 1));
    results = withPoster(data.results);
  }
  // Warm the image cache so posters are ready before they scroll into view
  prefetchPosters(results);
  return { data, results };
}

export const MovieContextProvider: React.FC<MovieContextProviderProps> = ({
  children,
}) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loadingMovies, setLoadingMovies] = useState<boolean>(true);
  const [loadingSeries, setLoadingSeries] = useState<boolean>(true);
  const [moviesError, setMoviesError] = useState<unknown>(null);
  const [seriesError, setSeriesError] = useState<unknown>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const [seriesCurrentPage, setSeriesCurrentPage] = useState<number>(1);
  const [seriesTotalPages, setSeriesTotalPages] = useState<number>(1);
  const [seriesTotalResults, setSeriesTotalResults] = useState<number>(0);
  const [seriesHasMore, setSeriesHasMore] = useState<boolean>(true);
  const region = useRegion();

  const fetchPopularMovies = useCallback(async (page: number = 1) => {
    setLoadingMovies(true);
    setMoviesError(null);

    try {
      // region: only movies currently in theatres in the user's country
      const { data, results } = await fetchUsablePage<Movie>(
        (p) => `movie/now_playing?language=en-US&region=${region}&page=${p}`,
        page,
      );
      setMovies((prev) => (page === 1 ? results : mergePage(prev, results)));
      setCurrentPage(data.page);
      setTotalPages(data.total_pages);
      setTotalResults(data.total_results);
      setHasMore(data.page < data.total_pages);
    } catch (err) {
      setMoviesError(err);
      // A failed first page means a new region or a fresh start: drop stale items
      if (page === 1) setMovies([]);
    } finally {
      setLoadingMovies(false);
    }
  }, [region]);

  const fetchPopularSeries = useCallback(async (page: number = 1) => {
    setLoadingSeries(true);
    setSeriesError(null);

    try {
      const { data, results } = await fetchUsablePage<Series>(
        (p) => `trending/tv/day?language=en-US&page=${p}`,
        page,
      );
      setSeries((prev) => (page === 1 ? results : mergePage(prev, results)));
      setSeriesCurrentPage(data.page);
      setSeriesTotalPages(data.total_pages);
      setSeriesTotalResults(data.total_results);
      setSeriesHasMore(data.page < data.total_pages);
    } catch (err) {
      setSeriesError(err);
      if (page === 1) setSeries([]);
    } finally {
      setLoadingSeries(false);
    }
  }, []);

  // Fetch on mount; Now Playing again whenever the region changes
  useEffect(() => {
    fetchPopularMovies(1);
  }, [fetchPopularMovies]);

  useEffect(() => {
    fetchPopularSeries(1);
  }, [fetchPopularSeries]);

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo<MovieContextType>(
    () => ({
      movies,
      loading: loadingMovies || loadingSeries,
      loadingMovies,
      loadingSeries,
      moviesError,
      seriesError,
      currentPage,
      totalPages,
      totalResults,
      fetchPopularMovies,
      fetchPopularSeries,
      series,
      hasMore,
      seriesCurrentPage,
      seriesTotalPages,
      seriesTotalResults,
      seriesHasMore,
    }),
    [
      movies,
      loadingMovies,
      loadingSeries,
      moviesError,
      seriesError,
      currentPage,
      totalPages,
      totalResults,
      fetchPopularMovies,
      fetchPopularSeries,
      series,
      hasMore,
      seriesCurrentPage,
      seriesTotalPages,
      seriesTotalResults,
      seriesHasMore,
    ],
  );

  return (
    <MovieContext.Provider value={contextValue}>
      {children}
    </MovieContext.Provider>
  );
};

// Custom hook for consuming the context
export const useMovieContext = () => {
  const context = useContext(MovieContext);
  if (context === undefined) {
    throw new Error(
      "useMovieContext must be used within a MovieContextProvider",
    );
  }
  return context;
};
