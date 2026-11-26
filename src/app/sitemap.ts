import type { MetadataRoute } from "next";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { library } from "@/lib/library";
import { site } from "@/lib/site";

export const dynamic = "force-static";

/** Every docs page's address, from src/content (index.mdx is its folder's page). */
function docsRoutes(dir = join(process.cwd(), "src/content"), route = "/docs"): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...docsRoutes(join(dir, e.name), `${route}/${e.name}`));
    else if (e.name.endsWith(".mdx")) out.push(e.name === "index.mdx" ? route : `${route}/${e.name.slice(0, -4)}`);
  }
  return out;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/library/`, changeFrequency: "daily", priority: 0.8 },
    ...library().addons.map((a) => ({ url: `${site.url}/library/${a.id}/`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...docsRoutes().map((r) => ({ url: `${site.url}${r}/`, changeFrequency: "weekly" as const, priority: r.split("/").length <= 3 ? 0.8 : 0.6 })),
  ];
}
