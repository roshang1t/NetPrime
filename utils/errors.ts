import { ApiError, TimeoutError } from "./api";

export type ErrorKind = "offline" | "timeout" | "unavailable" | "notFound" | "rateLimited" | "server" | "unknown";

export interface FriendlyError {
  kind: ErrorKind;
  title: string;
  message: string;
}

const MESSAGES: Record<ErrorKind, Omit<FriendlyError, "kind">> = {
  offline: {
    title: "No connection",
    message: "Check your internet and try again. If it keeps happening, switching DNS (e.g. 1.1.1.1) usually helps.",
  },
  timeout: {
    title: "Taking too long",
    message: "The server didn't respond in time. Try again.",
  },
  unavailable: {
    title: "Service unavailable",
    message: "We can't reach the movie database right now. Please try again later.",
  },
  notFound: {
    title: "Not available",
    message: "This title couldn't be found. It may have been removed.",
  },
  rateLimited: {
    title: "Too many requests",
    message: "Please wait a moment and try again.",
  },
  server: {
    title: "Something went wrong on our end",
    message: "Try again in a moment.",
  },
  unknown: {
    title: "Something went wrong",
    message: "Please try again.",
  },
};

function kindOf(error: unknown): ErrorKind {
  if (error instanceof TimeoutError) return "timeout";
  // Duck-typed so TmdbError from the account module maps the same way
  const status = (error as ApiError | undefined)?.status;
  if (typeof status === "number") {
    if (status === 401 || status === 403) return "unavailable";
    if (status === 404) return "notFound";
    if (status === 429) return "rateLimited";
    if (status >= 500) return "server";
    return "unknown";
  }
  // React Native's fetch rejects with "Network request failed" when offline or blocked
  if (error instanceof TypeError && /network|fetch/i.test(error.message)) return "offline";
  return "unknown";
}

/** User-facing title and message for any thrown value. Never exposes raw server text. */
export function describeError(error: unknown): FriendlyError {
  const kind = kindOf(error);
  return { kind, ...MESSAGES[kind] };
}
