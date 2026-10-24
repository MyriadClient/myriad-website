import { get } from "node:https";
import { site } from "@/lib/site";

export type Release = { version: string; url: string };

/**
 * The latest Myriad release, looked up from GitHub while `next build` runs. The site is a static export, so this
 * value is baked in; Myriad's release workflow redeploys the site so it stays current. Falls back to the version in
 * site.ts when GitHub can't be reached.
 *
 * Asked through Node's own https, not fetch: Next keeps fetch results of a static page in its cache for a year and
 * reuses them in later builds, so the button kept showing the release that was latest when the cache was made.
 */
export async function latestRelease(): Promise<Release> {
  const fallback: Release = { version: site.version, url: site.releases };
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "myriad-website-build",
    };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const data = JSON.parse(await getText("https://api.github.com/repos/MyriadClient/myriad-core/releases/latest", headers)) as {
      tag_name?: string;
      html_url?: string;
    };
    if (!data.tag_name) throw new Error("no tag_name in response");
    return { version: data.tag_name.replace(/^v/, ""), url: data.html_url ?? site.releases };
  } catch (e) {
    console.warn(`latest release lookup failed, using ${fallback.version}: ${e instanceof Error ? e.message : e}`);
    return fallback;
  }
}

/** The body of a GET, or a rejection for anything but 200. */
function getText(url: string, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = get(url, { headers, timeout: 10_000 }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk: string) => (body += chunk));
      res.on("end", () => resolve(body));
    });
    req.on("timeout", () => req.destroy(new Error("timed out")));
    req.on("error", reject);
  });
}
