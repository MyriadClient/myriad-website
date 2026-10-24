/** A shared config as Myriad clients publish it (ConfigShare, format 1: modules, control panels, wheels, a theme): what the viewer reads. */
export interface Share {
  format: number;
  title: string;
  description?: string;
  made?: { core?: string; minecraft?: string };
  addons?: { id: string; name: string; version: string }[];
  modules: ShareModule[];
  controlPanels?: { name: string; description?: string; members?: string[]; settings?: Record<string, Record<string, unknown>> }[];
  wheels?: ShareWheel[];
  theme?: { name?: string; view?: Look };
  look?: Look;
}

/** A wheel: its slots clockwise from the top, each what it runs and the name it shows in game. */
export interface ShareWheel {
  name: string;
  slots: { kind: "module" | "control" | "key_action" | "panel" | "command"; target: string; label?: string; name?: string }[];
}

export interface ShareModule {
  id: string;
  enabled: boolean;
  view?: {
    name: string;
    description?: string;
    addon?: string;
    addonName?: string;
    category?: { name: string; icon?: string; color?: string };
    groups?: { name: string; settings: SettingRow[] }[];
  };
}

export interface SettingRow {
  name: string;
  description?: string;
  kind: "toggle" | "number" | "choice" | "color" | "keybind" | "list" | "position" | "text";
  protected?: boolean;
  default?: boolean;
  shown?: string;
  value?: unknown;
  min?: number;
  max?: number;
  options?: string[];
  color?: string;
}

/** The sharer's theme colours (CSS #RRGGBBAA) and rounding. */
export interface Look {
  accent?: string;
  secondary?: string;
  window?: string;
  title?: string;
  surface?: string;
  text?: string;
  textDim?: string;
  border?: string;
  rounding?: number;
}

export const CODE = /myriad_[A-Za-z0-9]{6}/;

/** The share code in a page address (/config/myriad_JS3k4d) or its query (?code=…). */
export function codeFromLocation(location: Location): string | null {
  const fromPath = CODE.exec(location.pathname)?.[0];
  if (fromPath) return fromPath;
  return CODE.exec(new URLSearchParams(location.search).get("code") ?? "")?.[0] ?? null;
}

const HEX = /^#(?:[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

/** A colour from a share, only if it's plain hex: anything else could make the browser load something. */
export function safeColor(value: unknown): string | undefined {
  return typeof value === "string" && HEX.test(value) ? value : undefined;
}

/** A share's look with only hex colours and a sane rounding. */
export function safeLook(look: Look | undefined): Look {
  const out: Look = {};
  if (!look) return out;
  for (const key of ["accent", "secondary", "window", "title", "surface", "text", "textDim", "border"] as const) {
    const c = safeColor(look[key]);
    if (c) out[key] = c;
  }
  if (typeof look.rounding === "number" && Number.isFinite(look.rounding)) out.rounding = Math.min(20, Math.max(0, look.rounding));
  return out;
}
