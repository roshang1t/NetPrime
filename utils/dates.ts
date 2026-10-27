// TMDB dates are plain "YYYY-MM-DD" strings with no time zone. Compare and
// format them as local calendar dates: `new Date("2026-12-18")` would parse as
// UTC midnight and show the previous day west of Greenwich.

/** Today as "YYYY-MM-DD" in the device's time zone. */
export function todayString(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** True when the date is known and not in the future. */
export function isReleased(date?: string | null): boolean {
    return !!date && date <= todayString();
}

/** "2026-12-18" -> "18 Dec 2026" (in the device's locale). */
export function formatDate(date: string): string {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}
