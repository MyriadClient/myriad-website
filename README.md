# Myriad website

The homepage for [Myriad](https://github.com/MyriadClient/myriad-core): Next.js, Tailwind and [Motion](https://motion.dev),
exported as a static site.

There are no screenshots or videos. The hero is a hand-built motion graphic of the menu (`src/components/MenuDemo.tsx`),
driven by a timeline of scenes; the same component, with `play={false}`, is what the Themes section recolours. The
feature illustrations in `src/components/Vignettes.tsx` play once when scrolled into view. Everything honours
`prefers-reduced-motion` by rendering its final frame.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static site in out/
```

## Deploying

On Coolify, use the Dockerfile build pack: nginx serves `out/` on port 80 (set Ports Exposes to 80). The Railpack
build pack works too if you set `RAILPACK_NO_SPA=1`, so it runs `npm start` (`serve` on `$PORT`, with
`public/serve.json` for the `/config/<code>` rewrite) rather than serving the export itself, which would 404 shared
configs. Either way set one build variable:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | the public URL, e.g. `https://myriad.example` |

The sitemap, robots, canonical link, Open Graph tags, JSON-LD and the manifest all derive from it. Serving under a
subpath instead of a domain root needs `NEXT_PUBLIC_BASE_PATH` too, e.g. `/myriad`.

The download button shows the latest release at the time of the build. Myriad's release workflow calls the Coolify
deploy webhook (the `WEBSITE_DEPLOY_HOOK` secret on MyriadClient/myriad-core) so the site rebuilds after each tag.

```bash
docker build --build-arg NEXT_PUBLIC_SITE_URL=https://myriad.example -t myriad-website . && docker run -p 8080:80 myriad-website
```

## Where things are

| Path | What |
|---|---|
| `src/lib/site.ts` | Name, description, links, and a fallback version. |
| `src/lib/release.ts` | Looks up the latest Myriad release on GitHub during the build for the download button and JSON-LD. |
| `src/lib/themes.ts` | The palettes the demo can wear: the three presets and the Neon Blueprint user theme. |
| `src/app/page.tsx` | The page: hero, features, themes, addons, install, keys. All copy lives here. |
| `src/app/opengraph-image.tsx` | The social card, drawn in code. |

When adding a dependency, regenerate the lockfile from scratch (`rm -rf node_modules package-lock.json && npm install`)
rather than letting `npm install <pkg>` patch it. Patched lockfiles here have failed `npm ci` on other npm versions
because of the optional wasm packages Tailwind and Next pull in.

## Docs, shared configs and llms.txt

- **Docs** (`/docs`): [Nextra](https://nextra.site) 4 in its own root layout (`src/app/docs`), pages in
  `src/content` (MDX, ordered by each folder's `_meta.ts`): *Using Myriad* for players, *Developers* for addon
  authors. Search is [Pagefind](https://pagefind.app), indexed after `next build`. Nextra needs zod 4.1 (pinned with
  `overrides`; zod 4.6 rejects its layout's props).
- **For language models**: `scripts/llms.mjs` runs before every build and writes `public/llms.txt` (an index),
  `public/llms-full.txt` (every page) and each page as Markdown at its address plus `.md` (`/docs/develop/hooks.md`).
  These are generated: edit `src/content`.
- **Shared configs** (`/config/<code>`): one static page (`src/app/(site)/config`) that reads the code from the
  address and draws the share from Myriad's API (`NEXT_PUBLIC_API_URL`, default `https://api.myriadclient.dev`).
  nginx serves it for every `/config/myriad_XXXXXX`; with `next dev`, use `/config/?code=myriad_XXXXXX`.
