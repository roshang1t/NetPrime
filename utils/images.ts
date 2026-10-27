import { Image } from "expo-image";

// Single size for grid/row posters: sharp on 3x screens at ~120pt wide
const POSTER_SIZE = "w342";

export function posterUrl(path: string): string {
    return `https://image.tmdb.org/t/p/${POSTER_SIZE}${path}`;
}

/** Titles worth showing in a list: they have artwork and aren't adult. */
export function withPoster<T extends { poster_path?: string | null; adult?: boolean }>(items: T[]): T[] {
    return items.filter((i) => !!i.poster_path && !i.adult);
}

/** Download posters ahead of time so they're cached before they scroll into view. */
export function prefetchPosters(items: { poster_path?: string | null }[]): void {
    const urls = items.flatMap((i) => (i.poster_path ? [posterUrl(i.poster_path)] : []));
    if (urls.length) void Image.prefetch(urls, "memory-disk").catch(() => {});
}
