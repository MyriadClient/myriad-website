import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** One release of a listed addon, as the Library signed it. */
export type LibraryRelease = {
  version: string;
  sha256: string;
  url: string;
  size: number;
  minecraft: string | null;
  commit: string | null;
  added: string | null;
  yanked: boolean;
};

/** A listed addon: what's shown about it (its developer's words, cleaned) and its releases, newest first. */
export type LibraryAddon = {
  id: string;
  name: string;
  description: string;
  author: string;
  repo: string | null;
  badge: "verified" | "reviewed";
  updated: string | null;
  icon: boolean;
  versions: LibraryRelease[];
  /** What it adds and what's new in its newest release, as its build read them (absent before the Library had them). */
  modules?: { name: string; description: string; tag: string }[];
  changelog?: { version: string; text: string } | null;
};

export type Library = { open: boolean; addons: LibraryAddon[] };

/**
 * The Library as scripts/library.mjs read it from Myriad's API before this build (and checked it). The site is a
 * static export, so this is baked in; the API redeploys the site when the Library changes.
 */
export function library(): Library {
  const file = join(process.cwd(), ".library/library.json");
  if (!existsSync(file)) return { open: false, addons: [] };
  return JSON.parse(readFileSync(file, "utf8")) as Library;
}

export const badgeText = {
  verified: { label: "Verified", detail: "Built from its public source and checked by Myriad" },
  reviewed: { label: "Reviewed", detail: "Closed source, reviewed by Myriad" },
} as const;

/** The newest release that isn't withdrawn. */
export function latest(a: LibraryAddon): LibraryRelease | undefined {
  return a.versions.find((v) => !v.yanked);
}

export function size(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function day(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";
}
