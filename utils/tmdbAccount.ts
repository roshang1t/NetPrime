import { API_HEADERS, API_URL } from "@/contexts/movieContext/movieContext";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";

// The session id grants write access to the user's TMDB account, so it lives
// in the OS keystore (expo-secure-store), never in MMKV, and is never logged.
const SESSION_KEY = "tmdbSession";
const REDIRECT_URL = "netprime://tmdb-auth";
const MAX_PAGES = 25;

export type MediaType = "movie" | "tv";

export interface TmdbSession {
    sessionId: string;
    accountId: number;
    username: string;
}

export class TmdbError extends Error {
    constructor(
        public status: number,
        public statusCode?: number,
        message?: string,
    ) {
        super(message || `HTTP error! status: ${status}`);
    }
}

let cachedSession: TmdbSession | null | undefined;

async function tmdbFetch(path: string, init: RequestInit = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: { ...API_HEADERS, "content-type": "application/json" },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
        throw new TmdbError(response.status, data.status_code, data.status_message);
    }
    return data;
}

async function accountFetch(session: TmdbSession, path: string, init?: RequestInit) {
    const separator = path.includes("?") ? "&" : "?";
    try {
        return await tmdbFetch(
            `${path}${separator}session_id=${encodeURIComponent(session.sessionId)}`,
            init,
        );
    } catch (e) {
        // status_code 3: session revoked on TMDB (e.g. from account settings), forget it here too
        if (e instanceof TmdbError && e.statusCode === 3) {
            await saveSession(null);
        }
        throw e;
    }
}

async function saveSession(session: TmdbSession | null): Promise<void> {
    cachedSession = session;
    if (session) {
        await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    } else {
        await SecureStore.deleteItemAsync(SESSION_KEY);
    }
}

export async function getTmdbSession(): Promise<TmdbSession | null> {
    if (cachedSession !== undefined) return cachedSession;
    try {
        const content = await SecureStore.getItemAsync(SESSION_KEY);
        cachedSession = content ? JSON.parse(content) : null;
    } catch {
        cachedSession = null;
    }
    return cachedSession ?? null;
}

/**
 * Sign in on themoviedb.org in the system browser. The password is typed on
 * TMDB's own page, never in this app. Resolves null if the user didn't approve.
 */
export async function loginWithTmdb(): Promise<TmdbSession | null> {
    const { request_token } = await tmdbFetch("authentication/token/new");

    await WebBrowser.openAuthSessionAsync(
        `https://www.themoviedb.org/authenticate/${encodeURIComponent(request_token)}?redirect_to=${encodeURIComponent(REDIRECT_URL)}`,
        REDIRECT_URL,
    );

    // Ignore the browser result and the redirect contents: the token we created
    // only turns into a session if the user approved it on TMDB. This also
    // covers the user closing the tab by hand after approving.
    let sessionId: string;
    try {
        ({ session_id: sessionId } = await tmdbFetch("authentication/session/new", {
            method: "POST",
            body: JSON.stringify({ request_token }),
        }));
    } catch (e) {
        // status_code 17: token not approved (cancelled or closed early)
        if (e instanceof TmdbError && e.statusCode === 17) return null;
        throw e;
    }

    const session: TmdbSession = { sessionId, accountId: 0, username: "" };
    const account = await accountFetch(session, "account");
    session.accountId = account.id;
    session.username = account.username;
    await saveSession(session);
    return session;
}

export async function logoutTmdb(): Promise<void> {
    const session = await getTmdbSession();
    await saveSession(null);
    if (!session) return;
    // Also revoke it on TMDB; the local copy is already gone if this fails
    await tmdbFetch("authentication/session", {
        method: "DELETE",
        body: JSON.stringify({ session_id: session.sessionId }),
    }).catch(() => { });
}

export async function setRemoteWatchlist(
    session: TmdbSession,
    type: MediaType,
    id: number,
    watchlist: boolean,
): Promise<void> {
    await accountFetch(session, `account/${session.accountId}/watchlist`, {
        method: "POST",
        body: JSON.stringify({ media_type: type, media_id: id, watchlist }),
    });
}

async function getAllPages(session: TmdbSession, path: string): Promise<any[]> {
    const results: any[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
        const data = await accountFetch(session, `${path}&page=${page}`);
        results.push(...(data.results ?? []));
        if (page >= (data.total_pages ?? 1)) break;
    }
    return results;
}

export async function getRemoteWatchlist(session: TmdbSession, type: MediaType): Promise<any[]> {
    const path = type === "movie" ? "movies" : "tv";
    return getAllPages(
        session,
        `account/${session.accountId}/watchlist/${path}?language=en-US&sort_by=created_at.desc`,
    );
}

/** value is TMDB's 0.5-10 scale; null removes the rating. */
export async function setRemoteRating(
    session: TmdbSession,
    type: MediaType,
    id: number,
    value: number | null,
): Promise<void> {
    await accountFetch(
        session,
        `${type}/${id}/rating`,
        value === null
            ? { method: "DELETE" }
            : { method: "POST", body: JSON.stringify({ value }) },
    );
}

/** Rated titles, each with a `rating` field. */
export async function getRemoteRatings(session: TmdbSession, type: MediaType): Promise<any[]> {
    const path = type === "movie" ? "movies" : "tv";
    return getAllPages(session, `account/${session.accountId}/rated/${path}?language=en-US`);
}
