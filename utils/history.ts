import RNFS from "react-native-fs";

const HISTORY_FILE = `${RNFS.DocumentDirectoryPath}/watchHistory.json`;

export async function getWatchHistory(): Promise<any[]> {
    try {
        const exists = await RNFS.exists(HISTORY_FILE);
        if (!exists) return [];
        const content = await RNFS.readFile(HISTORY_FILE, "utf8");
        return JSON.parse(content || "[]");
    } catch (e) {
        return [];
    }
}

export async function addToWatchHistory(item: any): Promise<void> {
    try {
        const list = await getWatchHistory();
        // avoid duplicates by id if present
        const key = item.id ?? JSON.stringify(item);
        const filtered = list.filter((i) => (i.id ?? JSON.stringify(i)) !== key);
        filtered.unshift(item);
        await RNFS.writeFile(HISTORY_FILE, JSON.stringify(filtered.slice(0, 200)), "utf8");
    } catch (e) {
        // ignore
    }
}

export async function clearWatchHistory(): Promise<void> {
    try {
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
