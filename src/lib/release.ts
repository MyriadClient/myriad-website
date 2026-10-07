import { site } from "@/lib/site";

export type Release = { version: string; url: string };

/**
 * The latest Myriad release, looked up from GitHub while `next build` runs. The site is a static export, so this
 * value is baked in; Myriad's release workflow redeploys the site so it stays current. Falls back to the version in
 * site.ts when GitHub can't be reached.
 */
export async function latestRelease(): Promise<Release> {
  const fallback: Release = { version: site.version, url: site.releases };
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "myriad-website-build",
    };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch("https://api.github.com/repos/fyzz-dev/myriad/releases/latest", { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { tag_name?: string; html_url?: string };
    if (!data.tag_name) throw new Error("no tag_name in response");
    return { version: data.tag_name.replace(/^v/, ""), url: data.html_url ?? site.releases };
  } catch (e) {
    console.warn(`latest release lookup failed, using ${fallback.version}: ${e instanceof Error ? e.message : e}`);
    return fallback;
  }
}
