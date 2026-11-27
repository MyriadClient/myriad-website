"use client";

/*
 * The site wears the client's themes: picking one in the theme picker (or the footer, or the tutorial's launcher)
 * recolours every page, the way a theme recolours the whole menu in game. Myriad is the default. The choice is kept in
 * this browser only (localStorage), a convenience: nothing breaks without it.
 */
import { useSyncExternalStore } from "react";
import { themes, type KitTheme } from "@/components/ui-kit/theme";

export const DEFAULT_THEME = "myriad";
const KEY = "myriad-theme";
const EVENT = "myriad-theme";

export function kitTheme(id: string): KitTheme {
  return themes.find((t) => t.id === id) ?? themes[0];
}

function read(): string {
  const id = document.documentElement.dataset.theme;
  return id && themes.some((t) => t.id === id) ? id : DEFAULT_THEME;
}

export function setSiteTheme(id: string) {
  if (!themes.some((t) => t.id === id) || id === read()) return;
  if (id === DEFAULT_THEME) delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = id;
  try {
    if (id === DEFAULT_THEME) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, id);
  } catch {
    // Storage blocked: the theme lasts until the page is left.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

/** The site's theme id; "myriad" while rendering on the server and hydrating. */
export function useSiteTheme(): string {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_THEME);
}
