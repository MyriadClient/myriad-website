export type MenuTheme = {
  id: string;
  name: string;
  /** What the background behind the menu tints to. */
  desktop: string;
  bar: string;
  window: string;
  title: string;
  surface: string;
  surfaceHover: string;
  text: string;
  dim: string;
  accent: string;
  secondary: string;
  activeBorder: string;
  activeBorderEnd: string;
  inactiveBorder: string;
  /** In cqw units. */
  rounding: number;
  gap: number;
  mono: boolean;
};

export const themes: MenuTheme[] = [
  {
    id: "myriad",
    name: "Myriad",
    desktop: "#1b1e2c",
    bar: "#13151f",
    window: "#1f2232",
    title: "#1a1d2b",
    surface: "#272b3d",
    surfaceHover: "#30354a",
    text: "#dfe2ee",
    dim: "#7d8299",
    accent: "#9d97e3",
    secondary: "#86d4ad",
    activeBorder: "#9d97e3",
    activeBorderEnd: "#9d97e3",
    inactiveBorder: "#2c3043",
    rounding: 0.9,
    gap: 0.9,
    mono: false,
  },
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    desktop: "#16161e",
    bar: "#101017",
    window: "#1a1b26",
    title: "#16161e",
    surface: "#24283b",
    surfaceHover: "#2c3150",
    text: "#c0caf5",
    dim: "#565f89",
    accent: "#7aa2f7",
    secondary: "#bb9af7",
    activeBorder: "#7aa2f7",
    activeBorderEnd: "#bb9af7",
    inactiveBorder: "#292e42",
    rounding: 0.9,
    gap: 0.9,
    mono: false,
  },
  {
    id: "gruvbox",
    name: "Gruvbox",
    desktop: "#1d2021",
    bar: "#171a1b",
    window: "#282828",
    title: "#1f2122",
    surface: "#3c3836",
    surfaceHover: "#504945",
    text: "#ebdbb2",
    dim: "#928374",
    accent: "#fabd2f",
    secondary: "#b8bb26",
    activeBorder: "#fabd2f",
    activeBorderEnd: "#fe8019",
    inactiveBorder: "#3c3836",
    rounding: 0.6,
    gap: 0.9,
    mono: false,
  },
  {
    id: "neon-blueprint",
    name: "Neon Blueprint",
    desktop: "#040810",
    bar: "#060b14",
    window: "#0a1220",
    title: "#0b1522",
    surface: "#0f1e2e",
    surfaceHover: "#173049",
    text: "#d8fbff",
    dim: "#6c8fa3",
    accent: "#39ff14",
    secondary: "#ff2bd6",
    activeBorder: "#ff2bd6",
    activeBorderEnd: "#00e5ff",
    inactiveBorder: "#1f3a4d",
    rounding: 0,
    gap: 1.6,
    mono: true,
  },
];

export function themeVars(t: MenuTheme): React.CSSProperties {
  return {
    "--m-desktop": t.desktop,
    "--m-bar": t.bar,
    "--m-window": t.window,
    "--m-title": t.title,
    "--m-surface": t.surface,
    "--m-surface-hover": t.surfaceHover,
    "--m-text": t.text,
    "--m-dim": t.dim,
    "--m-accent": t.accent,
    "--m-secondary": t.secondary,
    "--m-border-active": t.activeBorder,
    "--m-border-active-end": t.activeBorderEnd,
    "--m-border-inactive": t.inactiveBorder,
    "--m-rounding": `${t.rounding}cqw`,
    "--m-gap": `${t.gap}cqw`,
    "--m-font": t.mono ? "var(--font-mono)" : "var(--font-sans)",
  } as React.CSSProperties;
}
