export const site = {
  name: "Myriad",
  title: "Myriad: a free, open-source Minecraft client",
  description:
    "A free, open-source Minecraft client for Fabric with a keyboard-first menu and themes you control. Every feature is an addon, and the stock modules pass Grim on 2b2t.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Fallback only: the build reads the latest release from GitHub (see release.ts). */
  version: "2.0.0",
  minecraft: "26.3",
  org: "https://github.com/MyriadClient",
  github: "https://github.com/MyriadClient/myriad-core",
  releases: "https://github.com/MyriadClient/myriad-core/releases/latest",
  essentials: "https://github.com/MyriadClient/myriad-essentials",
  essentialsReleases: "https://github.com/MyriadClient/myriad-essentials/releases/latest",
  omarchy: "https://github.com/MyriadClient/myriad-omarchy",
  template: "https://github.com/MyriadClient/myriad-addon-template",
  issues: "https://github.com/MyriadClient/myriad-core/issues",
  author: "Myriad",
  /** Myriad's web API (shared configs). */
  api: (process.env.NEXT_PUBLIC_API_URL ?? "https://api.myriadclient.dev").replace(/\/$/, ""),
} as const;
