import { I18nManager } from "react-native";
import { createMMKV, useMMKVString } from "react-native-mmkv";

// Region (ISO 3166-1, e.g. "IN") used for Now Playing, Upcoming, regional rows
// and streaming-service filters. Unset means "follow the device's region".
const storage = createMMKV();
const REGION_KEY = "region";

/** Region from the device locale (e.g. "en_IN" -> "IN"), or "US" if it has none. */
export function getDeviceRegion(): string {
    const locale = I18nManager.getConstants().localeIdentifier ?? "";
    return locale.match(/[-_]([A-Z]{2})(?:[-_@#]|$)/)?.[1] ?? "US";
}

/** Re-renders when the region changes. */
export function useRegion(): string {
    const [code] = useMMKVString(REGION_KEY, storage);
    return code ?? getDeviceRegion();
}

/** True when the user hasn't picked a region and the device's is used. */
export function useIsDeviceRegion(): boolean {
    const [code] = useMMKVString(REGION_KEY, storage);
    return code === undefined;
}

/** Pass null to go back to following the device region. */
export function setRegion(code: string | null): void {
    if (code === null) {
        storage.remove(REGION_KEY);
    } else {
        storage.set(REGION_KEY, code);
    }
}

/** "IN" -> 🇮🇳 (regional indicator symbols) */
export function flagEmoji(code: string): string {
    return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
}
