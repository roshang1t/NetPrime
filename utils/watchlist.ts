import { useMemo } from "react";
import { createMMKV, useMMKVString } from "react-native-mmkv";
import {
    getRemoteWatchlist,
    getTmdbSession,
    MediaType,
    setRemoteWatchlist,
    TmdbError,
} from "./tmdbAccount";

// My List always lives on the device. Signing in to TMDB is optional and only
// mirrors it to the user's TMDB watchlist so it survives reinstalls and devices.
const storage = createMMKV();
const WATCHLIST_KEY = "watchlist";
const PENDING_KEY = "watchlistPending";

export interface WatchlistItem {
    id: number;
    type: MediaType;
    title: string;
    poster_path?: string | null;
}

// A local change TMDB hasn't confirmed yet (offline, or app closed mid-request)
interface PendingOp {
    item: WatchlistItem;
    watchlist: boolean;
}

const sameItem = (a: { id: number; type: MediaType }, b: { id: number; type: MediaType }) =>
    a.id === b.id && a.type === b.type;

function read<T>(key: string): T[] {
    try {
        const content = storage.getString(key);
        return content ? JSON.parse(content) : [];
    } catch {
        return [];
    }
}

function write<T>(key: string, list: T[]): void {
    storage.set(key, JSON.stringify(list));
}

function parse(content: string | undefined): WatchlistItem[] {
    try {
        return content ? JSON.parse(content) : [];
    } catch {
        return [];
    }
}

export function getWatchlist(): WatchlistItem[] {
    return read<WatchlistItem>(WATCHLIST_KEY);
}

/** Re-renders whenever My List changes, from any screen. */
export function useWatchlist(): WatchlistItem[] {
    const [content] = useMMKVString(WATCHLIST_KEY, storage);
    return useMemo(() => parse(content), [content]);
}

export function useIsInWatchlist(id: number, type: MediaType): boolean {
    const list = useWatchlist();
    return list.some((i) => sameItem(i, { id, type }));
}

/** Adds or removes the title. Returns true if it is now in My List. */
export function toggleWatchlist(item: WatchlistItem): boolean {
    const list = getWatchlist();
    const exists = list.some((i) => sameItem(i, item));
    write(WATCHLIST_KEY, exists ? list.filter((i) => !sameItem(i, item)) : [item, ...list]);
    void queueRemote({ item, watchlist: !exists });
    return !exists;
}

export function removeFromWatchlist(item: WatchlistItem): void {
    write(WATCHLIST_KEY, getWatchlist().filter((i) => !sameItem(i, item)));
    void queueRemote({ item, watchlist: false });
}

async function queueRemote(op: PendingOp): Promise<void> {
    if (!(await getTmdbSession())) return;
    // Only the latest change per title matters
    const pending = read<PendingOp>(PENDING_KEY).filter((p) => !sameItem(p.item, op.item));
    write(PENDING_KEY, [...pending, op]);
    void flushPending();
}

let flushing: Promise<boolean> | null = null;

/** Sends queued changes to TMDB in order. Resolves false if any are still pending. */
export function flushPending(): Promise<boolean> {
    flushing ??= runFlush().finally(() => {
        flushing = null;
    });
    return flushing;
}

async function runFlush(): Promise<boolean> {
    const session = await getTmdbSession();
    if (!session) return false;
    while (true) {
        const [op] = read<PendingOp>(PENDING_KEY);
        if (!op) return true;
        try {
            await setRemoteWatchlist(session, op.item.type, op.item.id, op.watchlist);
        } catch (e) {
            // A 4xx TMDB will never accept (e.g. unknown id) would block the queue forever, so drop it.
            // Offline, rate limits, server errors and expired sessions stay queued for the next sync.
            const permanent =
                e instanceof TmdbError &&
                e.status >= 400 &&
                e.status < 500 &&
                e.status !== 401 &&
                e.status !== 429;
            if (!permanent) return false;
        }
        write(
            PENDING_KEY,
            read<PendingOp>(PENDING_KEY).filter(
                (p) => !(sameItem(p.item, op.item) && p.watchlist === op.watchlist),
            ),
        );
    }
}

/**
 * Two-way sync with the TMDB watchlist: push local changes, then pull TMDB's
 * list (which may include titles added on the TMDB website or another device).
 * Resolves false when not signed in or offline; My List is left untouched then.
 */
export async function syncWatchlist(): Promise<boolean> {
    const session = await getTmdbSession();
    if (!session) return false;
    if (!(await flushPending())) return false;

    let movies: any[];
    let shows: any[];
    try {
        [movies, shows] = await Promise.all([
            getRemoteWatchlist(session, "movie"),
            getRemoteWatchlist(session, "tv"),
        ]);
    } catch {
        return false;
    }

    const remote: WatchlistItem[] = [
        ...movies.map((m) => ({ id: m.id, type: "movie" as const, title: m.title, poster_path: m.poster_path })),
        ...shows.map((s) => ({ id: s.id, type: "tv" as const, title: s.name, poster_path: s.poster_path })),
    ];
    const local = getWatchlist();
    // Titles new from TMDB go first, the rest keep the order they had on this device
    let merged = [
        ...remote.filter((r) => !local.some((l) => sameItem(l, r))),
        ...local.filter((l) => remote.some((r) => sameItem(l, r))),
    ];

    // Re-apply anything toggled while the pull was in flight
    for (const op of read<PendingOp>(PENDING_KEY)) {
        merged = merged.filter((i) => !sameItem(i, op.item));
        if (op.watchlist) merged.unshift(op.item);
    }

    write(WATCHLIST_KEY, merged);
    return true;
}

/** First sync after signing in: keeps everything saved on this device by uploading it to TMDB. */
export async function connectWatchlist(): Promise<boolean> {
    // Oldest first, so TMDB's "date added" order matches this device
    write(
        PENDING_KEY,
        getWatchlist().reverse().map((item) => ({ item, watchlist: true })),
    );
    return syncWatchlist();
}

/** Call on sign out. My List itself stays on the device. */
export function clearPendingSync(): void {
    storage.remove(PENDING_KEY);
}
