// TMDb API Configuration (requests go through our Cloudflare Worker proxy)
export const API_URL = "https://netstream.dhamiroshan730.workers.dev/";

export const API_BEARER_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhZjZkZDVhOWQwZjgzYmQ4M2QxZjIxNmQ2N2RlYWNmMyIsIm5iZiI6MTcxNTUxOTIyNy4wMTIsInN1YiI6IjY2NDBiZWZiMThhZDFlNzU4ODIwN2VmMyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ZPlxXSMmTnIvs-nuuwalmPbtPXW383jBxiAheNnAKWA";

export const API_HEADERS = {
  Authorization: `Bearer ${API_BEARER_TOKEN}`,
  accept: "application/json",
  "Accept-Encoding": "identity",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

// fetch() in React Native never times out on its own, which would leave
// skeletons spinning forever on a dead connection.
const TIMEOUT_MS = 15000;

/** Non-2xx response. `statusCode` is TMDB's own error code when it sent one. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusCode?: number,
    message?: string,
  ) {
    super(message || `HTTP ${status}`);
    this.name = "ApiError";
  }
}

export class TimeoutError extends Error {
  constructor() {
    super("Request timed out");
    this.name = "TimeoutError";
  }
}

/**
 * GET a JSON URL with a timeout. Throws ApiError for HTTP errors, TimeoutError
 * when it takes too long, and passes through an AbortError if `signal` aborts.
 */
export async function fetchJson<T = any>(
  url: string,
  { headers, signal }: { headers?: Record<string, string>; signal?: AbortSignal } = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const forwardAbort = () => controller.abort();
  signal?.addEventListener("abort", forwardAbort);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiError(response.status, data?.status_code, data?.status_message);
    }
    return data as T;
  } catch (e) {
    // Aborted by our timer, not by the caller
    if (controller.signal.aborted && !signal?.aborted) throw new TimeoutError();
    throw e;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", forwardAbort);
  }
}

/** GET a TMDB path, e.g. tmdbGet("movie/550?language=en-US"). */
export function tmdbGet<T = any>(path: string, signal?: AbortSignal): Promise<T> {
  return fetchJson<T>(`${API_URL}${path}`, { headers: API_HEADERS, signal });
}

export function isAbortError(e: unknown): boolean {
  return e instanceof Error && e.name === "AbortError";
}
