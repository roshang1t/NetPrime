import { tmdbGet } from "./api";
import { isReleased } from "./dates";
import { useMemo } from "react";
import { createMMKV, useMMKVString } from "react-native-mmkv";

// Watched episodes per show, stored only on this device:
// { "1396": ["1:1", "1:2"] } -> season:episode keys
const storage = createMMKV();
const WATCHED_KEY = "watchedEpisodes";

type WatchedMap = Record<string, string[]>;

export interface NextEpisode {
    season: number;
    episode: number;
    name?: string;
}

export const episodeKey = (season: number, episode: number) => `${season}:${episode}`;

function read(): WatchedMap {
    try {
        const content = storage.getString(WATCHED_KEY);
        return content ? JSON.parse(content) : {};
    } catch {
        return {};
    }
}

function setWatched(showId: string, season: number, episode: number, watched: boolean): void {
    const map = read();
    const key = episodeKey(season, episode);
    const keys = (map[showId] ?? []).filter((k) => k !== key);
    if (watched) keys.push(key);
    if (keys.length) {
        map[showId] = keys;
    } else {
        delete map[showId];
    }
    storage.set(WATCHED_KEY, JSON.stringify(map));
}

/** The player has no way to see playback progress, so starting an episode counts as watching it. */
export function markEpisodeWatched(showId: string, season: number, episode: number): void {
    setWatched(showId, season, episode, true);
}

export function toggleEpisodeWatched(showId: string, season: number, episode: number): void {
    const watched = read()[showId]?.includes(episodeKey(season, episode)) ?? false;
    setWatched(showId, season, episode, !watched);
}

export function clearWatchedEpisodes(): void {
    storage.remove(WATCHED_KEY);
}

/** Set of "season:episode" keys watched for this show; re-renders on change. */
export function useWatchedEpisodes(showId: string | null): Set<string> {
    const [content] = useMMKVString(WATCHED_KEY, storage);
    return useMemo(() => {
        if (!showId) return new Set<string>();
        try {
            const map: WatchedMap = content ? JSON.parse(content) : {};
            return new Set(map[showId] ?? []);
        } catch {
            return new Set<string>();
        }
    }, [content, showId]);
}

export function countWatchedInSeason(watched: Set<string>, season: number): number {
    let count = 0;
    watched.forEach((key) => {
        if (key.startsWith(`${season}:`)) count++;
    });
    return count;
}

/** The episode after this one if it has already aired, else null. */
export async function getNextEpisode(
    showId: string,
    season: number,
    episode: number,
): Promise<NextEpisode | null> {
    // Optional feature: any failure just means no Next button
    try {
        const seasonData = await tmdbGet(`tv/${showId}/season/${season}?language=en-US`);
        const next = seasonData.episodes?.find((e: any) => e.episode_number === episode + 1);
        if (next) {
            return isReleased(next.air_date) ? { season, episode: episode + 1, name: next.name } : null;
        }

        // Last episode of the season: move on to the next one (never out of Specials)
        if (season === 0) return null;
        const show = await tmdbGet(`tv/${showId}?language=en-US`);
        const nextSeason = show.seasons?.find(
            (s: any) => s.season_number === season + 1 && s.episode_count > 0,
        );
        return nextSeason && isReleased(nextSeason.air_date) ? { season: season + 1, episode: 1 } : null;
    } catch {
        return null;
    }
}
