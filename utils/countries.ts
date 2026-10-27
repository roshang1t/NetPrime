import { useEffect, useMemo } from "react";
import { createMMKV, useMMKVString } from "react-native-mmkv";
import { tmdbGet } from "./api";

// TMDB's country list, fetched once and cached on the device
const storage = createMMKV();
const COUNTRIES_KEY = "countries";

export interface Country {
    code: string;
    name: string;
}

let loading: Promise<unknown> | null = null;

/** Fetches and caches the list. Resolves with the error if it failed, else null. */
export function loadCountries(): Promise<unknown> {
    loading ??= tmdbGet<{ iso_3166_1: string; english_name: string }[]>(
        "configuration/countries?language=en-US",
    )
        .then((data) => {
            const countries: Country[] = data
                .map((c) => ({ code: c.iso_3166_1, name: c.english_name }))
                .sort((a, b) => a.name.localeCompare(b.name));
            storage.set(COUNTRIES_KEY, JSON.stringify(countries));
            return null;
        })
        .catch((e) => e)
        .finally(() => {
            loading = null;
        });
    return loading;
}

export function useCountries(): Country[] {
    const [content] = useMMKVString(COUNTRIES_KEY, storage);
    useEffect(() => {
        if (!content) void loadCountries();
    }, [content]);
    return useMemo(() => {
        try {
            return content ? JSON.parse(content) : [];
        } catch {
            return [];
        }
    }, [content]);
}

/** "IN" -> "India"; falls back to the code until the list has loaded. */
export function useCountryName(code: string): string {
    const countries = useCountries();
    return countries.find((c) => c.code === code)?.name ?? code;
}
