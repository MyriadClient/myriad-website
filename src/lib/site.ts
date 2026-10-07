export const site = {
  name: "Myriad",
  title: "Myriad: an addon-first Minecraft utility client with a tiling menu",
  description:
    "Myriad is a free, open-source utility client for Minecraft 26.2 on Fabric. Its menu is a tiling window manager modelled on Hyprland, every module is an addon, and the stock modules pass Grim on 2b2t.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  version: "0.1.1",
  minecraft: "26.2",
  github: "https://github.com/fyzz-dev/myriad",
  releases: "https://github.com/fyzz-dev/myriad/releases/latest",
  essentials: "https://github.com/fyzz-dev/myriad-essentials",
  essentialsReleases: "https://github.com/fyzz-dev/myriad-essentials/releases/latest",
  boze: "https://github.com/fyzz-dev/myriad-boze",
  omarchy: "https://github.com/fyzz-dev/myriad-omarchy",
  template: "https://github.com/fyzz-dev/myriad-addon-template",
  issues: "https://github.com/fyzz-dev/myriad/issues",
  author: "fyzz",
} as const;
