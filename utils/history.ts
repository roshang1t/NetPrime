import { useMemo } from "react";
import RNFS from "react-native-fs";
import { createMMKV, useMMKVString } from "react-native-mmkv";
import { clearWatchedEpisodes } from "./episodes";

const storage = createMMKV();
const HISTORY_KEY = "watchHistory";
const HISTORY_FILE = `${RNFS.DocumentDirectoryPath}/watchHistory.json`;
// Ids removed from the Continue Watching row. History itself keeps them; watching
// the title again brings it back to the row.
const HIDDEN_KEY = "continueWatchingHidden";

function readHidden(): string[] {
    try {
        const content = storage.getString(HIDDEN_KEY);
        return content ? JSON.parse(content) : [];
    } catch {
        return [];
    }
}

export async function getWatchHistory(): Promise<any[]> {
    try {
        const content = storage.getString(HISTORY_KEY);
        if (content) {
            return JSON.parse(content);
        }

        // Fallback/migration from old file-based storage
        const exists = await RNFS.exists(HISTORY_FILE);
        if (exists) {
            const oldContent = await RNFS.readFile(HISTORY_FILE, "utf8");
            const parsed = JSON.parse(oldContent || "[]");
            storage.set(HISTORY_KEY, JSON.stringify(parsed));
            // Optional: delete old file after migration
            await RNFS.unlink(HISTORY_FILE).catch(() => {});
            return parsed;
        }

        return [];
    } catch (e) {
        return [];
    }
}

/** Re-renders whenever watch history changes, e.g. for the Continue Watching row. */
export function useWatchHistory(): any[] {
    const [content] = useMMKVString(HISTORY_KEY, storage);
    return useMemo(() => {
        try {
            return content ? JSON.parse(content) : [];
        } catch {
            return [];
        }
    }, [content]);
}

/** Watch history minus anything removed from the Continue Watching row. */
export function useContinueWatching(): any[] {
    const history = useWatchHistory();
    const [hiddenContent] = useMMKVString(HIDDEN_KEY, storage);
    return useMemo(() => {
        let hidden: string[] = [];
        try {
            hidden = hiddenContent ? JSON.parse(hiddenContent) : [];
        } catch {
            // treat unreadable data as nothing hidden
        }
        const hiddenIds = new Set(hidden);
        return history.filter((i) => !hiddenIds.has(String(i.id)));
    }, [history, hiddenContent]);
}

export function hideFromContinueWatching(id: string | number): void {
    const hidden = readHidden().filter((h) => h !== String(id));
    hidden.push(String(id));
    storage.set(HIDDEN_KEY, JSON.stringify(hidden.slice(-200)));
}

export async function addToWatchHistory(item: any): Promise<void> {
    try {
        if (item.id !== undefined && item.id !== null) {
            // Watching it again puts it back in Continue Watching
            const hidden = readHidden();
            if (hidden.includes(String(item.id))) {
                storage.set(HIDDEN_KEY, JSON.stringify(hidden.filter((h) => h !== String(item.id))));
            }
        }
        const list = await getWatchHistory();
        // avoid duplicates by id if present
        const key = item.id ?? JSON.stringify(item);
        const filtered = list.filter((i) => (i.id ?? JSON.stringify(i)) !== key);
        filtered.unshift(item);
        storage.set(HISTORY_KEY, JSON.stringify(filtered.slice(0, 200)));
    } catch (e) {
        // ignore
    }
}

export async function clearWatchHistory(): Promise<void> {
    try {
        storage.remove(HISTORY_KEY);
        storage.remove(HIDDEN_KEY);
        clearWatchedEpisodes();
        const exists = await RNFS.exists(HISTORY_FILE);
        if (exists) await RNFS.unlink(HISTORY_FILE);
    } catch (e) {
        // ignore
    }
}

export async function clearAppCache(): Promise<void> {
    try {
        // remove watch history
        await clearWatchHistory();
        // attempt remove cache dir contents
        const cacheDir = RNFS.CachesDirectoryPath;
        const items = await RNFS.readDir(cacheDir);
        await Promise.all(items.map((it) => RNFS.unlink(it.path).catch(() => { })));
    } catch (e) {
        // ignore
    }
}
