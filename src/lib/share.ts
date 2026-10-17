/** A shared config as Myriad clients publish it (ConfigShare, format 1): what the viewer reads. */
export interface Share {
  format: number;
  title: string;
  description?: string;
  made?: { core?: string; minecraft?: string };
  addons?: { id: string; name: string; version: string }[];
  modules: ShareModule[];
  controlPanels?: { name: string; description?: string; members?: string[]; settings?: Record<string, Record<string, unknown>> }[];
  theme?: { name?: string; view?: Look };
  look?: Look;
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
