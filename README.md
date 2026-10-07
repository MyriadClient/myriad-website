# Myriad website

The homepage for [Myriad](https://github.com/fyzz-dev/myriad): Next.js, Tailwind and [Motion](https://motion.dev),
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

Two ways, both fine for Coolify. With the Nixpacks build pack, `npm run build` then `npm start` serves `out/` with
`serve` on `$PORT`. With the Dockerfile build pack, nginx serves it on port 80. Either way set one build variable:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | the public URL, e.g. `https://myriad.example` |

The sitemap, robots, canonical link, Open Graph tags, JSON-LD and the manifest all derive from it. Serving under a
subpath instead of a domain root needs `NEXT_PUBLIC_BASE_PATH` too, e.g. `/myriad`.

```bash
docker build --build-arg NEXT_PUBLIC_SITE_URL=https://myriad.example -t myriad-website . && docker run -p 8080:80 myriad-website
```

## Where things are

| Path | What |
|---|---|
| `src/lib/site.ts` | Name, description, version, links. Bump `version` with each Myriad release. |
| `src/lib/themes.ts` | The palettes the demo can wear: the three presets and the Neon Blueprint user theme. |
| `src/app/page.tsx` | The page: hero, features, themes, addons, install, keys. All copy lives here. |
| `src/app/opengraph-image.tsx` | The social card, drawn in code. |

When adding a dependency, regenerate the lockfile from scratch (`rm -rf node_modules package-lock.json && npm install`)
rather than letting `npm install <pkg>` patch it. Patched lockfiles here have failed `npm ci` on other npm versions
because of the optional wasm packages Tailwind and Next pull in.
