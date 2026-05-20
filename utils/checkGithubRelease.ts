export async function checkGithubRelease(
    owner: string,
    repo: string,
    currentVersion: string
): Promise<{
    isNewer: boolean;
    latestVersion?: string;
    htmlUrl?: string;
    body?: string;
}> {
    try {
        const res = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
            {
                headers: { accept: "application/vnd.github.v3+json" },
            }
        );
        if (!res.ok) return { isNewer: false };
        const json = await res.json();
        const latestTag: string = (json.tag_name || json.name || "").toString();
        const htmlUrl: string | undefined = json.html_url;
        const body: string | undefined = json.body;

        const normalize = (v: string) => v.replace(/^v/i, "").split(".").map(n => parseInt(n || "0", 10));
        const a = normalize(latestTag);
        const b = normalize(currentVersion);
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
            const av = a[i] || 0;
            const bv = b[i] || 0;
            if (av > bv) return { isNewer: true, latestVersion: latestTag, htmlUrl, body };
            if (av < bv) return { isNewer: false, latestVersion: latestTag, htmlUrl, body };
        }
        return { isNewer: false, latestVersion: latestTag, htmlUrl, body };
    } catch {
        return { isNewer: false };
    }
}
