// TMDB sign-in redirects back to netprime://tmdb-auth. WebBrowser.openAuthSessionAsync
// consumes that link, so keep the router from navigating to a non-existent route.
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  if (path.includes("tmdb-auth")) return initial ? "/" : "";
  return path;
}
