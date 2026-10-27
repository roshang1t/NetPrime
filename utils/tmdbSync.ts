import { clearPendingRatings, connectRatings, syncRatings } from "./ratings";
import { clearPendingSync, connectWatchlist, syncWatchlist } from "./watchlist";

// Everything mirrored to the TMDB account: My List and ratings.
// All of these are no-ops (resolving false) when not signed in.

export async function syncWithTmdb(): Promise<boolean> {
    const [list, ratings] = await Promise.all([syncWatchlist(), syncRatings()]);
    return list && ratings;
}

/** First sync after signing in: keeps what was saved on this device. */
export async function connectTmdbSync(): Promise<boolean> {
    const [list, ratings] = await Promise.all([connectWatchlist(), connectRatings()]);
    return list && ratings;
}

/** Call on sign out. Local data stays on the device. */
export function clearTmdbPending(): void {
    clearPendingSync();
    clearPendingRatings();
}
