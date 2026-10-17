import { MenuDemo, Logo } from "@/components/MenuDemo";
import { ThemesShowcase } from "@/components/Themes";
import {
  AddonVignette,
  GrimVignette,
  LauncherVignette,
  ProfilerVignette,
  ThemeVignette,
  TilingVignette,
} from "@/components/Vignettes";
import { latestRelease } from "@/lib/release";
import { site } from "@/lib/site";
import { themes } from "@/lib/themes";

const features = [
  {
    title: "Workspaces and layouts",
    body: "Nine workspaces, each tiling its windows with Dwindle, Columns or Master. Lay out a combat workspace and a base workspace, merge windows, float the ones you want on top.",
    art: <TilingVignette />,
  },
  {
    title: "A launcher instead of a menu tree",
    body: "Alt+Space fuzzy-searches modules, panels, themes, profiles and workspaces. Enter toggles, Shift+Enter opens settings. You rarely need the mouse.",
    art: <LauncherVignette />,
  },
  {
    title: "Themes that modules follow",
    body: "Gaps, borders, rounding, blur, shadows, animation curves, fonts and every colour. A palette that ESP, tracers and the HUD read from, so the whole client matches.",
    art: <ThemeVignette />,
  },
  {
    title: "Made for 2b2t",
    body: "The stock modules pass Grim by default. Placing, breaking, rotating and inventory services are timed and ordered for it, and switch to faster behaviour on servers that don't check.",
    art: <GrimVignette />,
  },
  {
    title: "Cheap by design",
    body: "A module costs nothing until it does something. The built-in profiler shows milliseconds per second for every module, service and listener, so a slow addon is a glance away.",
    art: <ProfilerVignette />,
  },
  {
    title: "Addon-first",
    body: "The core ships no modules. Essentials, the stock set, is an addon like any other. One API, a template, a reference addon, and a compatibility promise across releases.",
    art: <AddonVignette />,
  },
];

const addons = [
  {
    name: "Myriad Essentials",
    body: "The stock modules: Offhand, Kill Aura, Elytra Fly, Packet Mine, Scaffold, ESP, Nametags and the rest, with the HUD elements. Versioned on its own; remove it and Myriad boots with an empty module list.",
    href: site.essentials,
    icon: "essentials",
  },
  {
    name: "Myriad Boze",
    body: "Every module of the Boze client in Myriad's menu, with Boze installed alongside. Settings, keybinds and on/off state stay in sync both ways. Boze keeps its config; Myriad is a second front end.",
    href: site.boze,
    icon: "boze",
  },
  {
    name: "Myriad Omarchy",
    body: "A theme that follows your Omarchy system theme. Switch themes on the desktop and the menu follows.",
    href: site.omarchy,
    icon: "omarchy",
  },
  {
    name: "Addon template",
    body: "A repository to start your own from, with the build, a module, a setting and a test already wired to the public API.",
    href: site.template,
    icon: "template",
  },
];

const shortcuts: [string, string][] = [
  ["mod+1..9", "Open the menu on a workspace, or switch to it"],
  ["mod+Space", "Launcher, in game too"],
  ["mod+Return", "Console"],
  ["mod+W", "Close window"],
  ["mod+T", "Toggle floating"],
  ["mod+F", "Full screen"],
  ["mod+L", "Cycle layout: Dwindle, Columns, Master"],
  ["mod+Shift+1..9", "Move window to workspace"],
  ["mod+S", "Toggle the HUD workspace"],
  ["mod+Arrows", "Focus in that direction"],
  ["mod+Shift+Arrows", "Swap in that direction"],
  ["mod+LMB drag", "Move or swap a window"],
];

export default async function Home() {
  const release = await latestRelease();
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
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/80 backdrop-blur">
        <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5 text-ink">
            <Logo className="h-6 w-6" style={{ color: "var(--mint)" }} />
            <span className="font-display text-lg font-semibold">Myriad</span>
          </a>
          <ul className="hidden items-center gap-6 text-sm text-dim md:flex">
            <li><a className="hover:text-ink" href="#features">Features</a></li>
            <li><a className="hover:text-ink" href="#themes">Themes</a></li>
            <li><a className="hover:text-ink" href="#addons">Addons</a></li>
            <li><a className="hover:text-ink" href="#install">Install</a></li>
            <li><a className="hover:text-ink" href="#keys">Keys</a></li>
          </ul>
          <a
            href={site.github}
            className="rounded-md border border-line-strong px-3 py-1.5 text-sm text-ink transition-colors hover:border-mint hover:text-mint"
          >
            GitHub
          </a>
        </nav>
      </header>

      <main id="top" className="flex-1 overflow-x-clip">
        {/* Hero */}
        <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 -top-14 -z-10 h-[34rem] w-screen -translate-x-1/2"
            style={{ background: "radial-gradient(ellipse 55% 60% at 35% 0%, rgba(127,216,174,0.12), transparent 70%)" }}
          />
          <div className="max-w-3xl">
            <h1 className="text-[2.6rem] font-semibold leading-[1.02] sm:text-6xl">
              A Minecraft client built like a desktop, not a click-GUI.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-dim">
              Myriad&rsquo;s menu is a tiling window manager modelled on Hyprland: workspaces, layouts and a
              launcher, all reachable from the keyboard. The core ships no modules. Every feature is an addon on a
              public API, so the client is whatever you put next to it.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={release.url}
                className="rounded-md bg-mint px-5 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-[#9fe0bf]"
              >
                Download {release.version}
              </a>
              <a
                href={site.github}
                className="rounded-md border border-line-strong px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink"
              >
                Read the source
              </a>
              <p className="basis-full text-sm text-dim sm:basis-auto sm:pl-2">
                Free and open source, for Fabric on Minecraft {site.minecraft}.
              </p>
            </div>
          </div>
          <div className="mt-14">
            <MenuDemo theme={themes[0]} />
            <p className="mt-3 text-center text-sm text-dim">
              Windows open and tile themselves. The launcher toggles a module. Settings split in beside the list.
              One key switches the layout.
            </p>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <h2 className="max-w-xl text-3xl font-semibold sm:text-4xl">
            Everything a window manager taught us, inside the game.
          </h2>
          <ul className="mt-12 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <li key={f.title} className="flex flex-col gap-4">
                {f.art}
                <h3 className="text-xl font-semibold">{f.title}</h3>
                <p className="text-[15px] leading-relaxed text-dim">{f.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Themes */}
        <section id="themes" className="border-y border-line/70 bg-raised/40">
          <div className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
            <h2 className="max-w-xl text-3xl font-semibold sm:text-4xl">Pick a theme, and the whole client follows.</h2>
            <div className="mt-12">
              <ThemesShowcase />
            </div>
          </div>
        </section>

        {/* Addons */}
        <section id="addons" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div>
              <h2 className="text-3xl font-semibold sm:text-4xl">Official addons</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-dim">
                Addons share the standard categories, so modules from different authors sit in the same windows.
                An addon built today keeps working on the next release: the API is versioned and tested for it.
              </p>
            </div>
            <dl className="divide-y divide-line border-y border-line">
              {addons.map((a) => (
                <div key={a.name} className="grid gap-2 py-5 sm:grid-cols-[13rem_1fr] sm:gap-6">
                  <dt>
                    <a
                      href={a.href}
                      className="flex items-center gap-3 font-medium text-ink underline-offset-4 hover:text-mint hover:underline"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer */}
                      <img
                        src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/addons/${a.icon}.png`}
                        alt=""
                        width={28}
                        height={28}
                        className="h-7 w-7 shrink-0 rounded-md"
                      />
                      {a.name}
                    </a>
                  </dt>
                  <dd className="text-[15px] leading-relaxed text-dim">{a.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Install */}
        <section id="install" className="border-y border-line/70 bg-raised/40">
          <div className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <h2 className="text-3xl font-semibold sm:text-4xl">Install in three steps</h2>
              <ol className="flex flex-col gap-6 text-[15px] leading-relaxed">
                <li className="flex gap-5">
                  <span className="mt-0.5 font-mono text-sm text-mint">1</span>
                  <p className="text-dim">
                    Install{" "}
                    <a className="text-ink underline underline-offset-4 hover:text-mint" href="https://fabricmc.net/use/">
                      Fabric Loader
                    </a>{" "}
                    for Minecraft {site.minecraft}, and{" "}
                    <a className="text-ink underline underline-offset-4 hover:text-mint" href="https://modrinth.com/mod/fabric-api">
                      Fabric API
                    </a>
                    . Java 25 or newer.
                  </p>
                </li>
                <li className="flex gap-5">
                  <span className="mt-0.5 font-mono text-sm text-mint">2</span>
                  <p className="text-dim">
                    Put the{" "}
                    <a className="text-ink underline underline-offset-4 hover:text-mint" href={site.releases}>
                      Myriad jar
                    </a>{" "}
                    in your <code className="font-mono text-ink">mods/</code> folder, with the{" "}
                    <a className="text-ink underline underline-offset-4 hover:text-mint" href={site.essentialsReleases}>
                      Essentials jar
                    </a>{" "}
                    and any other addons.
                  </p>
                </li>
                <li className="flex gap-5">
                  <span className="mt-0.5 font-mono text-sm text-mint">3</span>
                  <p className="text-dim">
                    In game or on the title screen, press <kbd>Alt+1</kbd> to open the menu, or <kbd>Alt+Space</kbd> for the
                    launcher. The keys are also under Myriad in Minecraft&rsquo;s Controls.
                  </p>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Keys */}
        <section id="keys" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div>
              <h2 className="text-3xl font-semibold sm:text-4xl">Keys you already know</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-dim">
                Default shortcuts follow Omarchy&rsquo;s tiling bindings. The mod key stands in for Super and
                defaults to Alt. Change it in Theme, under Preferences, or in Minecraft&rsquo;s Controls. The first
                two work in game without the menu open.
              </p>
            </div>
            <ul className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              {shortcuts.map(([key, action]) => (
                <li key={key} className="flex items-baseline justify-between gap-4 border-b border-line py-2">
                  <span className="text-dim">{action}</span>
                  <kbd>{key}</kbd>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-line/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-dim sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-center gap-2.5">
            <Logo className="h-5 w-5" style={{ color: "var(--mint)" }} />
            <span>Myriad is public domain under CC0. Not affiliated with Mojang or Microsoft.</span>
          </p>
          <ul className="flex flex-wrap gap-5">
            <li><a className="hover:text-ink" href={site.org}>GitHub</a></li>
            <li><a className="hover:text-ink" href={site.github}>Source</a></li>
            <li><a className="hover:text-ink" href={site.releases}>Releases</a></li>
            <li><a className="hover:text-ink" href={site.issues}>Issues</a></li>
            <li><a className="hover:text-ink" href={site.template}>Write an addon</a></li>
          </ul>
        </div>
      </footer>
    </>
  );
}
