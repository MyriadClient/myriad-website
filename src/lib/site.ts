export const site = {
  name: "Myriad",
  title: "Myriad: an addon-first Minecraft utility client with a tiling menu",
  description:
    "Myriad is a free, open-source utility client for Minecraft 26.2 on Fabric. Its menu is a tiling window manager modelled on Hyprland, every module is an addon, and the stock modules pass Grim on 2b2t.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Fallback only: the build reads the latest release from GitHub (see release.ts). */
  version: "0.3.0",
  minecraft: "26.2",
  org: "https://github.com/MyriadClient",
  github: "https://github.com/MyriadClient/myriad-core",
  releases: "https://github.com/MyriadClient/myriad-core/releases/latest",
  essentials: "https://github.com/MyriadClient/myriad-essentials",
  essentialsReleases: "https://github.com/MyriadClient/myriad-essentials/releases/latest",
  boze: "https://github.com/MyriadClient/myriad-boze",
  omarchy: "https://github.com/MyriadClient/myriad-omarchy",
  template: "https://github.com/MyriadClient/myriad-addon-template",
  issues: "https://github.com/MyriadClient/myriad-core/issues",
  author: "Myriad",
  /** Myriad's web API (shared configs). */
  api: (process.env.NEXT_PUBLIC_API_URL ?? "https://api.myriadclient.dev").replace(/\/$/, ""),
} as const;
