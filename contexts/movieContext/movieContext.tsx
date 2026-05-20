import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Movie, MovieContextType, Series } from "./types";

// TMDb API Configuration
export const API_URL = "https://netstream.dhamiroshan730.workers.dev/";

export const API_BEARER_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhZjZkZDVhOWQwZjgzYmQ4M2QxZjIxNmQ2N2RlYWNmMyIsIm5iZiI6MTcxNTUxOTIyNy4wMTIsInN1YiI6IjY2NDBiZWZiMThhZDFlNzU4ODIwN2VmMyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ZPlxXSMmTnIvs-nuuwalmPbtPXW383jBxiAheNnAKWA";

export const API_HEADERS = {
  Authorization: `Bearer ${API_BEARER_TOKEN}`,
  accept: "application/json",
  "Accept-Encoding": "identity",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

// Default context value for initial creation and for cases where it's used outside a Provider.
// Ensure all properties from MovieContextType are present.
const MovieContext = createContext<MovieContextType | undefined>(undefined);

interface MovieContextProviderProps {
  children: React.ReactNode;
}

export const MovieContextProvider: React.FC<MovieContextProviderProps> = ({
  children,
}) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loadingMovies, setLoadingMovies] = useState<boolean>(true);
  const [loadingSeries, setLoadingSeries] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Remove useCallback, make fetchPopularMovies a regular function
  const fetchPopularMovies = useCallback(async (page: number = 1) => {
    // if (loadingMovies) return; // Prevent multiple fetches
    setLoadingMovies(true);
    setError(null); // Clear previous errors

    try {
      const response = await fetch(
        `${API_URL}movie/now_playing?language=en-US&page=${page}`,
        {
          headers: API_HEADERS,
        },
      );

      if (!response.ok) {
        // Handle HTTP errors (e.g., 401 Unauthorized, 404 Not Found)
        const errorData = await response.json();
        throw new Error(
          errorData.status_message || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();

      if (page === 1) {
        setMovies(data.results);
      } else {
        setMovies((prev) => [...prev, ...data.results]);
      }
      setLoadingMovies(false);
      setCurrentPage(data.page);
      setTotalPages(data.total_pages);
      setTotalResults(data.total_results);
      setHasMore(data.page < data.total_pages);
    } catch (err) {
      console.error("Failed to fetch movies:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
      setMovies([]); // Clear movies on error
      setHasMore(false);
    } finally {
      setLoadingMovies(false);
    }
  }, []);

  const fetchPopularSeries = useCallback(async (page: number = 1) => {
    setLoadingSeries(true);
    setError(null); // Clear previous errors

    try {
      const response = await fetch(
        `${API_URL}trending/tv/day?language=en-US&page=${page}`,
        {
          headers: API_HEADERS,
        },
      );

      if (!response.ok) {
        // Handle HTTP errors (e.g., 401 Unauthorized, 404 Not Found)
        const errorData = await response.json();
        throw new Error(
          errorData.status_message || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();
      setSeries(data.results);
      // Do NOT update currentPage, totalPages, or totalResults here
    } catch (err) {
      console.error("Failed to fetch series:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
      setSeries([]); // Clear movies on error
    } finally {
      setLoadingSeries(false);
    }
  }, []);

  // Fetch movies on initial component mount
  useEffect(() => {
    fetchPopularMovies(1);
    fetchPopularSeries(1);
  }, [fetchPopularMovies, fetchPopularSeries]); // Only run on mount

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo<
    MovieContextType & {
      hasMore: boolean;
      loadingMovies: boolean;
      loadingSeries: boolean;
    }
  >(
    () => ({
      movies,
      loading: loadingMovies || loadingSeries,
      loadingMovies,
      loadingSeries,
      error,
      currentPage,
      totalPages,
      totalResults,
      fetchPopularMovies,
      fetchPopularSeries,
      series,
      hasMore,
    }),
    [
      movies,
      loadingMovies,
      loadingSeries,
      error,
      currentPage,
      totalPages,
      totalResults,
      fetchPopularMovies,
      fetchPopularSeries,
      series,
      hasMore,
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
