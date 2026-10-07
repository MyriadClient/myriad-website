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

`.github/workflows/pages.yml` builds and publishes `out/` to GitHub Pages on every push. Two environment variables set
the canonical URL and the path the site is served under; both are in the workflow and can be put in `.env.local` for a
local build:

| Variable | Project page | Custom domain |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://fyzz-dev.github.io/myriad-website` | `https://your.domain` |
| `NEXT_PUBLIC_BASE_PATH` | `/myriad-website` | unset |

The sitemap, robots, canonical link, Open Graph tags, JSON-LD and the manifest all derive from these.

## Where things are

| Path | What |
|---|---|
| `src/lib/site.ts` | Name, description, version, links. Bump `version` with each Myriad release. |
| `src/lib/themes.ts` | The palettes the demo can wear: the three presets and the Neon Blueprint user theme. |
| `src/app/page.tsx` | The page: hero, features, themes, addons, install, keys. All copy lives here. |
| `src/app/opengraph-image.tsx` | The social card, drawn in code. |
