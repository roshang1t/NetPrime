import { useMemo } from "react";
import { createMMKV, useMMKVString } from "react-native-mmkv";
import {
    getRemoteRatings,
    getTmdbSession,
    MediaType,
    setRemoteRating,
    TmdbError,
} from "./tmdbAccount";

// Ratings use TMDB's 0.5-10 scale and always live on the device, like My List.
// When signed in to TMDB they are mirrored to the account's ratings.
const storage = createMMKV();
const RATINGS_KEY = "ratings"; // { "movie:550": 8 }
const PENDING_KEY = "ratingsPending"; // { "movie:550": 8 | null } not yet confirmed by TMDB

type RatingMap = Record<string, number>;

const ratingKey = (type: MediaType, id: number) => `${type}:${id}`;

function parseKey(key: string): { type: MediaType; id: number } {
    const [type, id] = key.split(":");
    return { type: type as MediaType, id: Number(id) };
}

function read<T>(key: string): Record<string, T> {
    try {
        const content = storage.getString(key);
        return content ? JSON.parse(content) : {};
    } catch {
        return {};
    }
}

function write(key: string, map: object): void {
    storage.set(key, JSON.stringify(map));
}

/** The user's rating for this title (0.5-10), or undefined. Re-renders on change. */
export function useRating(type: MediaType, id: number): number | undefined {
    const [content] = useMMKVString(RATINGS_KEY, storage);
    return useMemo(() => {
        try {
            const map: RatingMap = content ? JSON.parse(content) : {};
            return map[ratingKey(type, id)];
        } catch {
            return undefined;
        }
    }, [content, type, id]);
}

/** Sets (0.5-10) or clears (null) the rating. */
export function setRating(type: MediaType, id: number, value: number | null): void {
    const key = ratingKey(type, id);
    const map = read<number>(RATINGS_KEY);
    if (value === null) {
        delete map[key];
    } else {
        map[key] = value;
    }
    write(RATINGS_KEY, map);
    void queueRemote(key, value);
}

async function queueRemote(key: string, value: number | null): Promise<void> {
    if (!(await getTmdbSession())) return;
    write(PENDING_KEY, { ...read<number | null>(PENDING_KEY), [key]: value });
    void flushPending();
}

let flushing: Promise<boolean> | null = null;

function flushPending(): Promise<boolean> {
    flushing ??= runFlush().finally(() => {
        flushing = null;
    });
    return flushing;
}

async function runFlush(): Promise<boolean> {
    const session = await getTmdbSession();
    if (!session) return false;
    while (true) {
        const [entry] = Object.entries(read<number | null>(PENDING_KEY));
        if (!entry) return true;
        const [key, value] = entry;
        const { type, id } = parseKey(key);
        try {
            await setRemoteRating(session, type, id, value);
        } catch (e) {
            // Same policy as My List: drop requests TMDB will never accept, keep the rest for later
            const permanent =
                e instanceof TmdbError &&
                e.status >= 400 &&
                e.status < 500 &&
                e.status !== 401 &&
                e.status !== 429;
            if (!permanent) return false;
        }
        const pending = read<number | null>(PENDING_KEY);
        // Keep it if the user changed the rating again while the request was in flight
        if (pending[key] === value) {
            delete pending[key];
            write(PENDING_KEY, pending);
        }
    }
}

/** Push local changes, then pull the account's ratings. False when signed out or offline. */
export async function syncRatings(): Promise<boolean> {
    const session = await getTmdbSession();
    if (!session) return false;
    if (!(await flushPending())) return false;

    let movies: any[];
    let shows: any[];
    try {
        [movies, shows] = await Promise.all([
            getRemoteRatings(session, "movie"),
            getRemoteRatings(session, "tv"),
        ]);
    } catch {
        return false;
    }

    const map: RatingMap = {};
    for (const m of movies) map[ratingKey("movie", m.id)] = m.rating;
    for (const s of shows) map[ratingKey("tv", s.id)] = s.rating;

    // Re-apply anything changed while the pull was in flight
    for (const [key, value] of Object.entries(read<number | null>(PENDING_KEY))) {
        if (value === null) {
            delete map[key];
        } else {
            map[key] = value;
        }
    }

    write(RATINGS_KEY, map);
    return true;
}

/** First sync after signing in: uploads ratings made on this device before signing in. */
export async function connectRatings(): Promise<boolean> {
    write(PENDING_KEY, { ...read<number>(RATINGS_KEY) });
    return syncRatings();
}

export function clearPendingRatings(): void {
    storage.remove(PENDING_KEY);
}
