import {
  ContinueWatchingRow,
  HomeHero,
  HomeTopBar,
  MyListRow,
  TmdbRow,
} from "@/components/homeRows";
import MovieList from "@/components/movieList";
import PopularList from "@/components/popularList";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useTheme } from "@/constants/theme";
import { useCountryName } from "@/utils/countries";
import { useRegion } from "@/utils/region";
import { useNavigation, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default React.memo(function HomePage() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const navigation = useNavigation();
  const router = useRouter();
  const region = useRegion();
  const countryName = useCountryName(region);
  // Regional "popular" rows only include titles already out
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: theme.background, flex: 1 }}>
      <StatusBar style={colorScheme === "light" ? "dark" : "light"} />
      <PopularList
        ListHeaderComponent={
          <>
            <HomeTopBar />
            <HomeHero />
            <ContinueWatchingRow />
            <MyListRow />
            <SectionHeader title="Trending Shows" onSeeAll={() => router.push("/trendingShows")} />
            <MovieList />
            {/* TMDB's trending endpoints are worldwide only, so regional rows use
                titles made in the country, sorted by popularity. The vote floor
                keeps out obscure titles with no ratings. */}
            <TmdbRow
              title={`Top Shows from ${countryName}`}
              type="tv"
              path={`discover/tv?language=en-US&sort_by=popularity.desc&with_origin_country=${region}&first_air_date.lte=${today}&vote_count.gte=10`}
            />
            <TmdbRow
              title={`Top Movies from ${countryName}`}
              type="movie"
              path={`discover/movie?language=en-US&sort_by=popularity.desc&with_origin_country=${region}&primary_release_date.lte=${today}&vote_count.gte=20`}
            />
            <TmdbRow
              title={`Coming Soon in ${countryName}`}
              type="movie"
              path={`movie/upcoming?language=en-US&region=${region}`}
            />
            <SectionHeader title={`Now Playing in ${countryName}`} />
          </>
        }
      />
    </SafeAreaView>
  );
});
