import Link from "next/link";
import type { Metadata } from "next";
import { Dither } from "@/components/fx/Dither";
import { Showcase } from "@/components/home/Showcase";
import { ThemePicker } from "@/components/home/ThemePicker";
import { LibraryCard } from "@/components/LibraryList";
import { library } from "@/lib/library";
import { latestRelease } from "@/lib/release";
import { site } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

/** Short answers to what people search for; shown on the page and given to search engines as an FAQ. */
const faq: [string, string][] = [
  ["Is Myriad free?", "Yes. Myriad and Essentials are free and open source, in the public domain under CC0. Nothing is sold."],
  ["Does it work on 2b2t?", "Yes. Essentials, the stock modules, is made for 2b2t: placing, breaking, rotating and inventory moves are timed to pass Grim by default."],
  ["Which Minecraft version does it support?", "Minecraft 26.3, on the Fabric loader with Fabric API."],
  ["Is it a mod or a client?", "Both: Myriad is a Fabric mod you put in your mods folder, a utility client with its own menu. Every feature comes from addons on its public API."],
  ["Is it safe?", "Its source is public on GitHub, and every release is built reproducibly and signed. Addons in the Myriad Library are built from their source and checked before they're listed."],
];

const features = [
  { icon: "", title: "Keyboard first", body: "Alt + Space opens anything. Windows tile themselves." },
  { icon: "", title: "Made for 2b2t", body: "Essentials passes Grim out of the box." },
  { icon: "", title: "Yours to theme", body: "Every colour, gap and effect. Modules follow." },
  { icon: "", title: "Addon-first", body: "The core ships no modules. Add what you want." },
];

export default async function Home() {
  const release = await latestRelease();
  const addons = library().addons.slice(0, 4);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: site.name,
    description: site.description,
    url: site.url,
    image: `${site.url}/opengraph-image`,
    applicationCategory: "GameApplication",
    applicationSubCategory: "Minecraft utility client",
    operatingSystem: "Windows, macOS, Linux",
    softwareVersion: release.version,
    softwareRequirements: `Minecraft ${site.minecraft}, Fabric Loader, Fabric API, Java 25`,
    license: "https://creativecommons.org/publicdomain/zero/1.0/",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    downloadUrl: release.url,
    codeRepository: site.github,
    author: { "@type": "Organization", name: site.author, url: site.org },
  };

  return (
    <main className="flex-1 overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero: one composition. The type on the left, the menu itself behind it on the right, bleeding off the edges and
          fading under the type, the smoke tying them together. */}
      <section className="hero relative isolate flex min-h-[calc(100svh-var(--header-h))] flex-col overflow-hidden">
        <div aria-hidden className="hero-smoke absolute inset-0 -z-20">
          <Dither unit="css" alpha={0.5} amount={0.75} scale={1.6} />
        </div>
        <div aria-hidden className="absolute inset-0 -z-20 bg-[radial-gradient(55%_60%_at_70%_45%,color-mix(in_srgb,var(--mint)_9%,transparent),transparent)]" />

        <div className="hero-stage">
          <Showcase swapped />
        </div>
        {/* The type's side stays dark enough to read over the menu's faded edge. */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 -z-10 hidden w-[55%] bg-[linear-gradient(90deg,var(--bg)_30%,transparent)] lg:block" />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 pb-10 pt-12 sm:px-6 lg:pb-24 lg:pt-16">
          <div className="max-w-[40rem] lg:max-w-[34rem] xl:max-w-[38rem]">
            <p className="text-sm text-dim">
              <span className="text-mint">Myriad {release.version}</span> · Minecraft utility client for Fabric {site.minecraft}
            </p>
            <h1 className="hero-title mt-5">
              Minecraft,
              <br />
              arranged.
            </h1>
            <p className="mt-6 max-w-md text-lg text-dim sm:text-xl">
              A free, open-source Minecraft client with a menu you drive from the keyboard. Every feature is an addon.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href={release.url} className="rounded-full bg-mint px-6 py-3 font-semibold text-bg transition-colors hover:bg-[color-mix(in_srgb,var(--mint)_80%,white)]">
                Download {release.version}
              </a>
              <Link href="/tutorial/" className="rounded-full border border-line-strong bg-bg/60 px-6 py-3 font-semibold text-ink backdrop-blur transition-colors hover:border-mint/60">
                Try the tutorial
              </Link>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto hidden w-full max-w-7xl items-center justify-between px-4 pb-6 text-sm text-dim sm:px-6 lg:flex">
          <p>
            Open source <span className="mx-2 text-line-strong">■</span> Addon-first <span className="mx-2 text-line-strong">■</span> Passes Grim on 2b2t
          </p>
          <a href="#features" className="flex items-center gap-3 hover:text-ink">
            Scroll <span className="block h-px w-24 bg-line-strong" />
          </a>
        </div>
      </section>

      <section aria-labelledby="features" id="features-section" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-16 sm:px-6">
        <h2 id="features" className="sr-only">Features</h2>
        <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <li key={f.title}>
              <span className="icon text-lg text-mint" aria-hidden="true">{f.icon}</span>
              <h3 className="mt-3 text-base">{f.title}</h3>
              <p className="mt-1 text-sm text-dim">{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="themes" className="mx-auto max-w-6xl px-4 pt-28 sm:px-6">
        <div className="text-center">
          <h2 id="themes" className="text-3xl sm:text-4xl">Pick a theme. Everything follows.</h2>
          <p className="mt-3 text-dim">Presets to start from, and every value yours to change.</p>
        </div>
        <div className="mt-10">
          <ThemePicker />
        </div>
      </section>

      <section aria-labelledby="library" className="relative mx-auto max-w-6xl px-4 pt-28 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="library" className="text-3xl sm:text-4xl">The Myriad Library</h2>
            <p className="mt-3 text-dim">Addons built from their source and checked. Install them in game with Browse.</p>
          </div>
          <Link href="/library/" className="text-sm font-semibold text-mint hover:underline">Browse the Library →</Link>
        </div>
        {addons.length > 0 && (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {addons.map((a) => (
              <li key={a.id}>
                <LibraryCard addon={a} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="faq" className="mx-auto max-w-3xl px-4 pt-28 sm:px-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
            }),
          }}
        />
        <h2 id="faq" className="text-3xl sm:text-4xl">Questions</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {faq.map(([q, a]) => (
            <details key={q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg">
                {q}
                <span className="icon text-sm text-dim transition-transform group-open:rotate-90" aria-hidden="true">{"\uf054"}</span>
              </summary>
              <p className="mt-2 text-dim">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="install" className="mx-auto max-w-6xl px-4 pb-28 pt-28 sm:px-6">
        <h2 id="install" className="text-3xl sm:text-4xl">Install</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          <Step n={1} title="Install Fabric">
            <a className="text-mint hover:underline" href="https://fabricmc.net/use/installer/">Fabric</a> for Minecraft {site.minecraft}, with{" "}
            <a className="text-mint hover:underline" href="https://modrinth.com/mod/fabric-api">Fabric API</a>.
          </Step>
          <Step n={2} title="Add Myriad">
            <a className="text-mint hover:underline" href={release.url}>Myriad</a> and{" "}
            <a className="text-mint hover:underline" href={site.essentialsReleases}>Essentials</a> go in your mods folder.
          </Step>
          <Step n={3} title="Press Alt + 1">
            In game, to open the menu. The <Link className="text-mint hover:underline" href="/tutorial/">tutorial</Link> shows the rest.
          </Step>
        </ol>
      </section>

      <div aria-hidden className="band-smoke relative h-40">
        <Dither unit="css" alpha={0.45} amount={0.7} scale={1.2} seed={210} />
      </div>
    </main>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-xl border border-line bg-raised/60 p-5">
      <span className="font-mono text-sm text-mint">0{n}</span>
      <h3 className="mt-2 text-lg">{title}</h3>
      <p className="mt-1.5 text-sm text-dim">{children}</p>
    </li>
  );
}
