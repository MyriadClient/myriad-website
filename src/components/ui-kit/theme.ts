/*
 * The client's themes, as the UI copies on the site draw them. "Myriad" is ThemeSettings' own defaults; the presets are
 * CoreThemes' palettes put through ThemePalette.apply, ported here, so every colour is computed the way the game
 * computes it.
 */

export type KitTheme = {
  id: string;
  name: string;
  accent: string;
  secondary: string;
  borderFrom: string;
  borderTo: string;
  inactiveBorder: string;
  window: string;
  title: string;
  surface: string;
  surfaceHover: string;
  text: string;
  dim: string;
  bar: string;
  tint: string;
  /** Behind the UI out of a world: UiPainter's fixed gradient, the same for every theme (the tint goes over it). */
  backdropTop: string;
  backdropBottom: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  rounding: number;
  /** The site's own colours in this theme (the page around the UI copies): ground, raised panels, lines. */
  page: { bg: string; raised: string; top: string; line: string; lineStrong: string };
};

type Argb = number;

const a = (c: Argb) => (c >>> 24) & 255;
const r = (c: Argb) => (c >>> 16) & 255;
const g = (c: Argb) => (c >>> 8) & 255;
const b = (c: Argb) => c & 255;
const argb = (A: number, R: number, G: number, B: number): Argb => ((A & 255) << 24 | (R & 255) << 16 | (G & 255) << 8 | (B & 255)) >>> 0;

/** ColorUtil.withAlpha */
const withAlpha = (c: Argb, alpha: number) => argb(alpha, r(c), g(c), b(c));
/** ColorUtil.lerp: each channel, alpha included. */
const lerp = (x: Argb, y: Argb, t: number) =>
  argb(
    Math.round(a(x) + (a(y) - a(x)) * t),
    Math.round(r(x) + (r(y) - r(x)) * t),
    Math.round(g(x) + (g(y) - g(x)) * t),
    Math.round(b(x) + (b(y) - b(x)) * t),
  );

/** An ARGB int as CSS. */
export function css(c: Argb): string {
  const alpha = a(c) / 255;
  return alpha >= 1 ? `rgb(${r(c)} ${g(c)} ${b(c)})` : `rgb(${r(c)} ${g(c)} ${b(c)} / ${alpha.toFixed(3)})`;
}

/** ThemeSettings' defaults: the "Myriad" theme every new install starts with. */
export const myriad: KitTheme = {
  id: "myriad",
  name: "Myriad",
  accent: css(0xff7fd8ae),
  secondary: css(0xff4fa884),
  borderFrom: css(0xff7fd8ae),
  borderTo: css(0xff4fa884),
  inactiveBorder: css(0x60303633),
  window: css(0xd8131514),
  title: css(0x400c0c0c),
  surface: css(0x60252a27),
  surfaceHover: css(0x90343a37),
  text: css(0xffe9eeeb),
  dim: css(0xff8c9690),
  bar: css(0xe00c0c0c),
  tint: css(0x700c0c0c),
  backdropTop: "#0c0c0c",
  backdropBottom: "#151816",
  red: "#f38ba8",
  green: "#a6e3a1",
  yellow: "#f9e2af",
  blue: "#89b4fa",
  magenta: "#cba6f7",
  cyan: "#94e2d5",
  rounding: 4,
  page: { bg: "#0c0c0c", raised: "#131514", top: "#151816", line: "#222624", lineStrong: "#303633" },
};

/** ThemePalette.of(background, foreground, selection, accent, secondary, red, green, yellow, blue, magenta, cyan).apply */
function palette(id: string, name: string, p: Argb[]): KitTheme {
  const [bg, fg, sel, accent, secondary, red, green, yellow, blue, magenta, cyan] = p;
  return {
    id,
    name,
    accent: css(accent),
    secondary: css(secondary),
    borderFrom: css(accent),
    borderTo: css(secondary),
    inactiveBorder: css(withAlpha(sel, 0xa0)),
    window: css(withAlpha(bg, 0xe0)),
    title: css(withAlpha(lerp(bg, 0xff000000, 0.3), 0x70)),
    surface: css(withAlpha(lerp(bg, sel, 0.7), 0x90)),
    surfaceHover: css(withAlpha(lerp(sel, fg, 0.12), 0xc0)),
    text: css(fg),
    dim: css(lerp(fg, bg, 0.4)),
    bar: css(withAlpha(bg, 0xea)),
    tint: css(withAlpha(bg, 0x80)),
    backdropTop: "#0c0c0c",
    backdropBottom: "#151816",
    red: css(red),
    green: css(green),
    yellow: css(yellow),
    blue: css(blue),
    magenta: css(magenta),
    cyan: css(cyan),
    rounding: 4,
    // The same steps from ground towards text as Myriad's own page colours take.
    page: { bg: css(bg), raised: css(lerp(bg, fg, 0.03)), top: css(lerp(bg, fg, 0.045)), line: css(lerp(bg, fg, 0.1)), lineStrong: css(lerp(bg, fg, 0.163)) },
  };
}

/** CoreThemes' presets. */
export const themes: KitTheme[] = [
  myriad,
  palette("tokyo_night", "Tokyo Night", [0xff1a1b26, 0xffc0caf5, 0xff33467c, 0xff7aa2f7, 0xffbb9af7, 0xfff7768e, 0xff9ece6a, 0xffe0af68, 0xff7aa2f7, 0xffbb9af7, 0xff7dcfff]),
  palette("gruvbox", "Gruvbox", [0xff282828, 0xffebdbb2, 0xff504945, 0xfffabd2f, 0xfffe8019, 0xfffb4934, 0xffb8bb26, 0xfffabd2f, 0xff83a598, 0xffd3869b, 0xff8ec07c]),
  palette("catppuccin_mocha", "Catppuccin Mocha", [0xff1e1e2e, 0xffcdd6f4, 0xff45475a, 0xff89b4fa, 0xffcba6f7, 0xfff38ba8, 0xffa6e3a1, 0xfff9e2af, 0xff89b4fa, 0xffcba6f7, 0xff94e2d5]),
];

/** The theme's colours as the kit's CSS variables. */
export function themeVars(t: KitTheme): Record<string, string> {
  return {
    "--k-accent": t.accent,
    "--k-secondary": t.secondary,
    "--k-border-from": t.borderFrom,
    "--k-border-to": t.borderTo,
    "--k-border-off": t.inactiveBorder,
    "--k-window": t.window,
    "--k-title": t.title,
    "--k-surface": t.surface,
    "--k-surface-hover": t.surfaceHover,
    "--k-text": t.text,
    "--k-dim": t.dim,
    "--k-bar": t.bar,
    "--k-tint": t.tint,
    "--k-backdrop-top": t.backdropTop,
    "--k-backdrop-bottom": t.backdropBottom,
    "--k-red": t.red,
    "--k-green": t.green,
    "--k-yellow": t.yellow,
    "--k-blue": t.blue,
    "--k-magenta": t.magenta,
    "--k-cyan": t.cyan,
    "--k-rounding": String(t.rounding),
  };
}

/** Tags.DEFAULTS, with the palette colour each takes (Tags.java) and its icon. */
export const TAGS = {
  combat: { name: "Combat", icon: "", color: "var(--k-red)" },
  movement: { name: "Movement", icon: "", color: "var(--k-blue)" },
  render: { name: "Render", icon: "", color: "var(--k-magenta)" },
  player: { name: "Player", icon: "", color: "var(--k-green)" },
  world: { name: "World", icon: "", color: "var(--k-yellow)" },
  automation: { name: "Automation", icon: "", color: "var(--k-secondary)" },
  misc: { name: "Misc", icon: "", color: "var(--k-cyan)" },
} as const;

export type TagId = keyof typeof TAGS;
export const TAG_ORDER: TagId[] = ["combat", "movement", "render", "player", "world", "automation", "misc"];
