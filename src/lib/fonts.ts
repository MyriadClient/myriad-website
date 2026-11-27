import localFont from "next/font/local";

/*
 * The client's own fonts, subset for the web by scripts/fonts.sh from core's assets/myriad/font: Noto Sans (regular and
 * semibold) for text, JetBrains Mono Nerd Font for code, digits and the menu's icons. Using the game's files is what
 * makes the site and the UI copies on it read as the client.
 */
const ui = localFont({
  src: [
    { path: "../fonts/ui-regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ui-semibold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-ui",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const mono = localFont({
  src: "../fonts/mono.woff2",
  variable: "--font-mono-nf",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

/** The CSS variables for both, for the root element. */
export const fontClasses = `${ui.variable} ${mono.variable}`;
