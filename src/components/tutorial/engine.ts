/*
 * A small copy of Myriad's menu for the tutorial: workspaces, group windows tiled by Dwindle or Columns, focus, swap,
 * floating, full screen, the launcher, modules and their settings, themes. Keys do what core's default binds do
 * (UiBinds, the mod key held): whatever someone presses works as in game, and each tutorial step just waits for the
 * state it teaches.
 */
import groups from "@/data/essentials-modules.json";
import {
  dwindleAdd,
  dwindleInsertBeside,
  dwindleLayout,
  dwindleRemove,
  dwindleResize,
  dwindleSetRatio,
  dwindleSwap,
  dwindleToggle,
  columns,
  firstRunTree,
  leaves,
  workArea,
  type DNode,
  type Rect,
  type Side,
  type Splitter,
} from "@/components/ui-kit/layout";
import { TAGS, themes, type TagId } from "@/components/ui-kit/theme";

const TAG_ICONS = Object.fromEntries(Object.entries(TAGS).map(([k, v]) => [k, v.icon])) as Record<TagId, string>;

export type Module = { name: string; tag: TagId; description: string; group: string; order: number };
export type Group = { name: string; icon: string; modules: Module[] };

type RawGroup = { name: string; icon: string; modules: { name: string; tag: string; description: string; order: number }[] };
export const GROUPS: Group[] = (groups as RawGroup[]).map((g) => ({
  name: g.name,
  icon: g.icon,
  modules: g.modules.map((m) => ({ ...m, tag: m.tag as TagId, group: g.name })),
}));
export const MODULES: Module[] = GROUPS.flatMap((g) => g.modules).sort((a, b) => a.order - b.order);

export type Workspace = { layout: "dwindle" | "columns"; tree: DNode | null; floating: string[]; focused: string | null; fullscreen: string | null };

export type Settings = { weapon: string; turnSpeed: number; showTarget: boolean };

export type MenuState = {
  /** The screen's width in units (its height is always 360): the stage fills the page, so this follows its shape. */
  screenW: number;
  open: boolean;
  active: number;
  previous: number;
  workspaces: Record<number, Workspace>;
  floatRects: Record<string, Rect>;
  on: string[];
  unfolded: string[];
  general: boolean;
  dropdown: boolean;
  settings: Settings;
  launcher: { open: boolean; query: string; selected: number };
  selection: Record<string, number>;
  keyboard: boolean;
  theme: string;
  toast: { text: string; at: number } | null;
  /** What happened last, for steps that wait for a way of doing something ("toggled by keyboard"). */
  last: string;
  history: string[];
};

/** At UI Scale 1.5 a workspace takes four group windows; the rest go to the next (GroupPlacement). */
export function initialState(): MenuState {
  const names = GROUPS.map((g) => g.name);
  const ws = (ids: string[]): Workspace => ({ layout: "dwindle", tree: firstRunTree(ids), floating: [], focused: ids[0] ?? null, fullscreen: null });
  const workspaces: Record<number, Workspace> = {};
  for (let i = 1; i <= 9; i++) workspaces[i] = ws([]);
  workspaces[1] = ws(names.slice(0, 4));
  workspaces[2] = ws(names.slice(4));
  return {
    screenW: 640,
    open: false,
    active: 1,
    previous: 1,
    workspaces,
    floatRects: {},
    on: ["Auto Armor"],
    unfolded: [],
    general: true,
    dropdown: false,
    settings: { weapon: "Holding", turnSpeed: 0, showTarget: true },
    launcher: { open: false, query: "", selected: 0 },
    selection: {},
    keyboard: false,
    theme: "myriad",
    toast: null,
    last: "",
    history: [],
  };
}

const areaOf = (s: MenuState) => workArea(s.screenW);

/** Each window's rect on a workspace: tiled by its layout, floating ones where they float, full screen over all. */
export function rectsOf(s: MenuState, n: number): Map<string, Rect> {
  const ws = s.workspaces[n];
  const tiled = leaves(ws.tree);
  const area = areaOf(s);
  const out =
    ws.layout === "columns"
      ? new Map(tiled.map((id, i) => [id, columns(tiled.length, area)[i]] as const))
      : dwindleLayout(ws.tree, area).rects;
  for (const id of ws.floating) out.set(id, s.floatRects[id] ?? centred(area));
  if (ws.fullscreen) out.set(ws.fullscreen, area);
  return out;
}

/** The dividers between the active workspace's tiles, to drag (Dwindle only; none under a full-screen window). */
export function splittersOf(s: MenuState): Splitter[] {
  const ws = s.workspaces[s.active];
  if (ws.layout !== "dwindle" || ws.fullscreen) return [];
  return dwindleLayout(ws.tree, areaOf(s)).splitters;
}

function centred(a: Rect): Rect {
  return { x: a.x + a.w * 0.25, y: a.y + a.h * 0.15, w: a.w * 0.5, h: a.h * 0.7 };
}

/** A module's own settings window (Shift+Enter on it in the launcher), next to the group windows. */
export const MODULE_WINDOW = "module:";

/** What a window shows in its title bar: a group window, or one module's settings. */
export function windowInfo(id: string): { title: string; icon: string; subtitle?: string; module?: Module } {
  if (id.startsWith(MODULE_WINDOW)) {
    const m = MODULES.find((x) => x.name === id.slice(MODULE_WINDOW.length));
    return { title: m?.name ?? id, icon: m ? TAG_ICONS[m.tag] : "", module: m };
  }
  const g = groupOf(id);
  return { title: g?.name ?? id, icon: g?.icon ?? "", subtitle: "Essentials" };
}

export function windowsOf(s: MenuState, n: number): string[] {
  const ws = s.workspaces[n];
  return [...leaves(ws.tree), ...ws.floating];
}

export function workspaceOf(s: MenuState, id: string): number | null {
  for (let i = 1; i <= 9; i++) if (windowsOf(s, i).includes(id)) return i;
  return null;
}

export function groupOf(name: string) {
  return GROUPS.find((g) => g.name === name);
}

// ---- the launcher ---------------------------------------------------------------------------------------------------

export type Entry = { icon: string; title: string; hint: string; run: Action; alt?: Action };

/** FuzzyMatch.score, ported: exact, prefix, word prefix, initials, substring, then letters in order (each either right
 *  after the last or at a word's start); -1 when it doesn't match. Higher is better. */
export function score(text: string, query: string): number {
  const q = query.toLowerCase().trim().replace(/\s+/g, " ");
  if (!q) return 0;
  const t = text.toLowerCase().trim();
  const compact = (x: string) => x.replace(/[^\p{L}\p{N}]/gu, "");
  const cq = q.replace(/ /g, ""), ct = compact(t);
  if (ct === cq) return 10_000;
  if (t.startsWith(q) || ct.startsWith(cq)) return 9_000 - t.length;
  const words = t.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  for (let i = 0; i < words.length; i++) if (words[i].startsWith(q)) return 8_000 - i * 50 - t.length;
  if (cq.length >= 2 && words.map((w) => w[0]).join("").startsWith(cq)) return 7_000 - t.length;
  const idx = ct.indexOf(cq);
  if (idx >= 0) return 6_000 - idx * 10 - t.length;
  if (cq.length < 2) return -1;
  const wordStart = (i: number) => i === 0 || !/[\p{L}\p{N}]/u.test(t[i - 1]);
  let sc = 0, pos = -1;
  for (const c of cq) {
    let found = -1;
    if (pos >= 0 && pos + 1 < t.length && t[pos + 1] === c) {
      found = pos + 1;
      sc += 15;
    } else {
      for (let i = pos + 1; i < t.length; i++) {
        if (t[i] === c && wordStart(i)) {
          found = i;
          sc += 10;
          break;
        }
      }
    }
    if (found < 0) return -1;
    pos = found;
  }
  return 1_000 + sc - t.length;
}

/** Launcher.score: the title, or the part after "Kind: " (5 less); modules a little ahead on ties. */
function entryScore(title: string, module: boolean, q: string) {
  let sc = score(title, q);
  const colon = title.indexOf(": ");
  if (colon > 0) sc = Math.max(sc, score(title.slice(colon + 2), q) - 5);
  return sc < 0 ? sc : sc + (module ? 3 : 0);
}

/** Launcher.refresh: modules, then group windows, panels, themes; `@addon` and `#tag` filter; "New …" last. */
export function launcherEntries(s: MenuState): Entry[] {
  const words = s.launcher.query.trim().split(/\s+/).filter(Boolean);
  const tags = words.filter((w) => w.startsWith("#") && w.length > 1).map((w) => w.slice(1).toLowerCase().replace(/s$/, ""));
  const addons = words.filter((w) => w.startsWith("@") && w.length > 1).map((w) => w.slice(1).toLowerCase());
  const text = words.filter((w) => !w.startsWith("#") && !w.startsWith("@")).join(" ");
  const passes = (tag: string | null, addon: string) =>
    tags.every((t) => tag !== null && tag.startsWith(t)) && addons.every((a) => addon.toLowerCase().includes(a));

  const all: (Entry & { tag: string | null; addon: string })[] = [
    ...MODULES.map((m) => ({
      icon: s.on.includes(m.name) ? "" : "",
      title: m.name,
      hint: `${m.group} · ${s.on.includes(m.name) ? "on" : "off"}`,
      run: { type: "toggle", name: m.name, how: "launcher" } as Action,
      alt: { type: "openModule", name: m.name } as Action,
      tag: m.tag as string,
      addon: "Essentials",
    })),
    ...GROUPS.map((g) => ({ icon: g.icon, title: g.name, hint: `${g.modules.length} modules`, run: { type: "openGroup", name: g.name } as Action, tag: null, addon: "Essentials" })),
    ...themes.map((t) => ({ icon: "", title: `Theme: ${t.name}`, hint: "Apply theme", run: { type: "theme", id: t.id } as Action, tag: null, addon: "Myriad" })),
  ];
  const filtered = all.filter((e) => passes(e.tag, e.addon));
  if (!text) return filtered.slice(0, 40);
  const found = filtered
    .map((e) => ({ e, sc: entryScore(e.title, e.run.type === "toggle", text) }))
    .filter((x) => x.sc >= 0)
    .sort((a, b) => b.sc - a.sc)
    .map((x) => x.e);
  const make: Entry[] = [
    { icon: "", title: `New macro: ${text}`, hint: "A module that runs commands", run: { type: "noop" } },
    { icon: "", title: `New control panel: ${text}`, hint: "Switch modules together", run: { type: "noop" } },
    { icon: "", title: `New wheel: ${text}`, hint: "Pick from a ring while a key is held", run: { type: "noop" } },
  ];
  return [...found.slice(0, 37), ...make];
}

// ---- actions ----------------------------------------------------------------------------------------------------------

export type Dir = "left" | "right" | "up" | "down";

export type Action =
  | { type: "noop" }
  | { type: "open"; workspace?: number }
  | { type: "close" }
  | { type: "workspace"; n: number }
  | { type: "cycle"; dir: 1 | -1 }
  | { type: "former" }
  | { type: "move"; n: number }
  | { type: "focus"; id: string }
  | { type: "focusDir"; dir: Dir }
  | { type: "swapDir"; dir: Dir }
  | { type: "float" }
  | { type: "fullscreen" }
  | { type: "closeWindow"; id?: string }
  | { type: "split" }
  | { type: "resize"; amount: number }
  | { type: "layout" }
  | { type: "openGroup"; name: string }
  | { type: "toggle"; name: string; how?: string }
  | { type: "unfold"; name: string; how?: string }
  | { type: "general" }
  | { type: "dropdown" }
  | { type: "setting"; key: keyof Settings; value: string | number | boolean }
  | { type: "launcher"; open: boolean }
  | { type: "type"; query: string }
  | { type: "select"; delta: number }
  | { type: "run"; alt?: boolean }
  | { type: "pick"; index: number; alt?: boolean }
  | { type: "nav"; delta: number }
  | { type: "theme"; id: string }
  | { type: "openModule"; name: string }
  | { type: "screen"; w: number }
  | { type: "ratio"; path: string; r: number }
  | { type: "drop"; id: string; target: string; side: Side | null }
  | { type: "place"; id: string; rect: Rect }
  | { type: "reset"; state?: MenuState };

function withWs(s: MenuState, n: number, f: (ws: Workspace) => Workspace): MenuState {
  return { ...s, workspaces: { ...s.workspaces, [n]: f(s.workspaces[n]) } };
}

function neighbour(s: MenuState, dir: Dir): string | null {
  const ws = s.workspaces[s.active];
  if (!ws.focused) return null;
  const rects = rectsOf(s, s.active);
  const a = rects.get(ws.focused);
  if (!a) return null;
  let best: string | null = null, score = Infinity;
  for (const [id, b] of rects) {
    if (id === ws.focused) continue;
    const dx = b.x + b.w / 2 - (a.x + a.w / 2), dy = b.y + b.h / 2 - (a.y + a.h / 2);
    const ok =
      dir === "left" ? dx < -1 && Math.abs(dy) < Math.abs(dx) * 2
      : dir === "right" ? dx > 1 && Math.abs(dy) < Math.abs(dx) * 2
      : dir === "up" ? dy < -1 && Math.abs(dx) < Math.abs(dy) * 2
      : dy > 1 && Math.abs(dx) < Math.abs(dy) * 2;
    if (ok && dx * dx + dy * dy < score) {
      score = dx * dx + dy * dy;
      best = id;
    }
  }
  return best;
}

function toast(s: MenuState, text: string): MenuState {
  return { ...s, toast: { text, at: Date.now() } };
}

function note(s: MenuState, what: string): MenuState {
  return { ...s, last: what, history: [...s.history.slice(-30), what] };
}

export function reduce(s: MenuState, a: Action): MenuState {
  const ws = s.workspaces[s.active];
  const focused = ws.focused;
  switch (a.type) {
    case "noop":
      return s;
    case "reset":
      return { ...(a.state ?? initialState()), screenW: s.screenW };
    case "screen":
      return a.w === s.screenW ? s : { ...s, screenW: a.w };
    case "ratio":
      return note(withWs(s, s.active, (w) => ({ ...w, tree: dwindleSetRatio(w.tree, a.path, a.r) })), "resize-drag");
    case "drop": {
      // WindowManager on release: near the middle of another tile the two swap, near an edge it splits that side.
      if (a.id === a.target || ws.floating.includes(a.id) || ws.floating.includes(a.target)) return s;
      const tree = a.side ? dwindleInsertBeside(ws.tree, a.id, a.target, a.side) : dwindleSwap(ws.tree, a.id, a.target);
      return note(withWs(s, s.active, (w) => ({ ...w, tree, focused: a.id })), a.side ? "drop-split" : "drop-swap");
    }
    case "place":
      return note({ ...s, floatRects: { ...s.floatRects, [a.id]: a.rect } }, "float-move");
    case "openModule": {
      const id = MODULE_WINDOW + a.name;
      const at = workspaceOf(s, id);
      const shown = { ...s, open: true, launcher: { ...s.launcher, open: false } };
      if (at !== null) return note({ ...withWs(shown, at, (w) => ({ ...w, focused: id })), active: at, previous: s.active }, "openModule");
      return note(withWs(shown, s.active, (w) => ({ ...w, tree: dwindleAdd(w.tree, id, w.focused ?? undefined, areaOf(s)), focused: id })), "openModule");
    }
    case "open":
      return note({ ...s, open: true, previous: s.active, active: a.workspace ?? s.active }, "open");
    case "close":
      if (s.launcher.open) return note({ ...s, launcher: { ...s.launcher, open: false } }, "launcher-close");
      return note({ ...s, open: false, dropdown: false }, "close");
    case "workspace":
      if (!s.open) return note({ ...s, open: true, previous: s.active, active: a.n }, "open");
      if (a.n === s.active) return note({ ...s, open: false }, "close");
      return note({ ...s, previous: s.active, active: a.n }, `workspace-${a.n}`);
    case "cycle":
      return note({ ...s, previous: s.active, active: ((s.active - 1 + a.dir + 9) % 9) + 1 }, "cycle");
    case "former":
      return note({ ...s, previous: s.active, active: s.previous }, "former");
    case "move": {
      if (!focused || a.n === s.active) return s;
      let next = withWs(s, s.active, (w) => ({
        ...w,
        tree: dwindleRemove(w.tree, focused),
        floating: w.floating.filter((f) => f !== focused),
        fullscreen: w.fullscreen === focused ? null : w.fullscreen,
        focused: windowsOf(s, s.active).find((x) => x !== focused) ?? null,
      }));
      next = withWs(next, a.n, (w) => ({ ...w, tree: dwindleAdd(w.tree, focused, w.focused ?? undefined, areaOf(s)), focused }));
      return note(next, `move-${a.n}`);
    }
    case "focus":
      return withWs(s, s.active, (w) => ({ ...w, focused: a.id }));
    case "focusDir": {
      const to = neighbour(s, a.dir);
      return to ? note(withWs(s, s.active, (w) => ({ ...w, focused: to })), `focus-${a.dir}`) : s;
    }
    case "swapDir": {
      const to = neighbour(s, a.dir);
      if (!focused || !to || ws.floating.includes(focused) || ws.floating.includes(to)) return s;
      return note(withWs(s, s.active, (w) => ({ ...w, tree: dwindleSwap(w.tree, focused, to) })), `swap-${a.dir}`);
    }
    case "float": {
      if (!focused) return s;
      if (ws.floating.includes(focused)) {
        return note(withWs(s, s.active, (w) => ({ ...w, floating: w.floating.filter((f) => f !== focused), tree: dwindleAdd(w.tree, focused, undefined, areaOf(s)) })), "tile");
      }
      const at = rectsOf(s, s.active).get(focused);
      const rect = at ? { x: at.x + 20, y: at.y + 14, w: Math.max(170, at.w * 0.8), h: Math.max(120, at.h * 0.8) } : centred(areaOf(s));
      return note(
        { ...withWs(s, s.active, (w) => ({ ...w, tree: dwindleRemove(w.tree, focused), floating: [...w.floating, focused] })), floatRects: { ...s.floatRects, [focused]: rect } },
        "float",
      );
    }
    case "fullscreen":
      if (!focused) return s;
      return note(withWs(s, s.active, (w) => ({ ...w, fullscreen: w.fullscreen === focused ? null : focused })), ws.fullscreen === focused ? "unfullscreen" : "fullscreen");
    case "closeWindow": {
      const id = a.id ?? focused;
      if (!id) return s;
      const n = workspaceOf(s, id) ?? s.active;
      return note(
        withWs(s, n, (w) => {
          const rest = windowsOf(s, n).filter((x) => x !== id);
          return { ...w, tree: dwindleRemove(w.tree, id), floating: w.floating.filter((f) => f !== id), fullscreen: w.fullscreen === id ? null : w.fullscreen, focused: w.focused === id ? rest[0] ?? null : w.focused };
        }),
        "closeWindow",
      );
    }
    case "split":
      return focused ? note(withWs(s, s.active, (w) => ({ ...w, tree: dwindleToggle(w.tree, focused) })), "split") : s;
    case "resize": {
      if (!focused) return s;
      if (ws.floating.includes(focused)) {
        // UiBinds.resizeFocused: a floating window grows about its middle.
        const r = s.floatRects[focused] ?? centred(areaOf(s));
        const d = a.amount * 400;
        return note({ ...s, floatRects: { ...s.floatRects, [focused]: { x: r.x - d / 2, y: r.y - d / 2, w: Math.max(80, r.w + d), h: Math.max(40, r.h + d) } } }, "resize");
      }
      return note(withWs(s, s.active, (w) => ({ ...w, tree: dwindleResize(w.tree, focused, a.amount) })), "resize");
    }
    case "layout": {
      const layout = ws.layout === "dwindle" ? "columns" : "dwindle";
      return note(toast(withWs(s, s.active, (w) => ({ ...w, layout })), `Layout: ${layout === "columns" ? "Columns" : "Dwindle"}`), `layout-${layout}`);
    }
    case "openGroup": {
      const at = workspaceOf(s, a.name);
      if (at !== null) return note({ ...withWs(s, at, (w) => ({ ...w, focused: a.name })), active: at, previous: s.active, open: true, launcher: { ...s.launcher, open: false } }, "openGroup");
      return note(
        { ...withWs(s, s.active, (w) => ({ ...w, tree: dwindleAdd(w.tree, a.name, w.focused ?? undefined, areaOf(s)), focused: a.name })), open: true, launcher: { ...s.launcher, open: false } },
        "openGroup",
      );
    }
    case "toggle": {
      const on = s.on.includes(a.name) ? s.on.filter((n) => n !== a.name) : [...s.on, a.name];
      return note({ ...s, on }, `toggle-${a.how ?? "click"}`);
    }
    case "unfold": {
      const open = s.unfolded.includes(a.name);
      return note({ ...s, unfolded: open ? s.unfolded.filter((n) => n !== a.name) : [...s.unfolded, a.name], dropdown: false }, open ? `fold-${a.how ?? "click"}` : `unfold-${a.how ?? "click"}`);
    }
    case "general":
      return { ...s, general: !s.general };
    case "dropdown":
      return { ...s, dropdown: !s.dropdown };
    case "setting":
      return note({ ...s, settings: { ...s.settings, [a.key]: a.value }, dropdown: false }, `setting-${a.key}`);
    case "launcher":
      // In game the launcher opens on its own, over the game; the menu stays closed.
      return note({ ...s, launcher: { open: a.open, query: a.open ? "" : s.launcher.query, selected: 0 } }, a.open ? "launcher-open" : "launcher-close");
    case "type":
      return { ...s, launcher: { ...s.launcher, query: a.query, selected: 0 } };
    case "select": {
      const n = Math.max(1, Math.min(10, launcherEntries(s).length));
      return { ...s, launcher: { ...s.launcher, selected: (s.launcher.selected + a.delta + n) % n } };
    }
    case "run":
    case "pick": {
      const entries = launcherEntries(s);
      const e = entries[a.type === "pick" ? a.index : s.launcher.selected];
      const closed = { ...s, launcher: { ...s.launcher, open: false } };
      if (!e) return closed;
      const act = a.alt && e.alt ? e.alt : e.run;
      return note(reduce(closed, act), a.alt ? "launcher-alt" : a.type === "run" ? "launcher-run" : "launcher-pick");
    }
    case "nav": {
      if (!focused) return s;
      const g = groupOf(focused);
      if (!g) return s;
      const i = Math.max(0, Math.min(g.modules.length - 1, (s.selection[focused] ?? -1) + a.delta));
      return note({ ...s, keyboard: true, selection: { ...s.selection, [focused]: i } }, "nav");
    }
    case "theme":
      return note({ ...s, theme: a.id, toast: { text: `Applied ${themes.find((t) => t.id === a.id)?.name ?? a.id}`, at: Date.now() } }, `theme-${a.id}`);
  }
}

/** The module under the keyboard selection in the focused window, if any. */
export function selectedModule(s: MenuState): Module | null {
  const f = s.workspaces[s.active].focused;
  const g = f ? groupOf(f) : null;
  const i = f ? s.selection[f] : undefined;
  return g && i !== undefined && s.keyboard ? g.modules[i] ?? null : null;
}

/**
 * A key press, as core reads it: the mod key (Alt by default) with a number, arrows, Space and the rest runs a bind
 * (UiBinds); the launcher takes typing, Enter, Esc and Ctrl+J/K; inside a window J/K/O/H and Enter work the selection.
 */
export function keyAction(s: MenuState, e: { key: string; code: string; shift: boolean; ctrl: boolean; mod: boolean }): Action | null {
  const k = e.key;
  if (s.launcher.open) {
    if (k === "Escape") return { type: "launcher", open: false };
    if (k === "Enter") return { type: "run", alt: e.shift };
    if (k === "ArrowDown" || (e.ctrl && k.toLowerCase() === "j")) return { type: "select", delta: 1 };
    if (k === "ArrowUp" || (e.ctrl && k.toLowerCase() === "k")) return { type: "select", delta: -1 };
    if (e.mod && e.code === "Space") return { type: "launcher", open: false };
    if (k === "Backspace") return { type: "type", query: s.launcher.query.slice(0, -1) };
    if (k.length === 1 && !e.ctrl && !e.mod) return { type: "type", query: s.launcher.query + k };
    return null;
  }
  if (e.mod) {
    const digit = /^Digit([1-9])$/.exec(e.code);
    if (digit) return e.shift ? { type: "move", n: Number(digit[1]) } : { type: "workspace", n: Number(digit[1]) };
    if (!s.open) return e.code === "Space" ? { type: "launcher", open: true } : null;
    const dir = ({ ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" } as Record<string, Dir>)[k];
    if (dir) return e.shift ? { type: "swapDir", dir } : { type: "focusDir", dir };
    switch (e.code) {
      case "Space":
        return { type: "launcher", open: true };
      case "KeyW":
        return { type: "closeWindow" };
      case "KeyT":
        return { type: "float" };
      case "KeyF":
        return { type: "fullscreen" };
      case "KeyJ":
        return { type: "split" };
      case "KeyL":
        return { type: "layout" };
      case "Minus":
        return { type: "resize", amount: -0.05 };
      case "Equal":
        return { type: "resize", amount: 0.05 };
      case "Tab":
        return e.ctrl ? { type: "former" } : { type: "cycle", dir: e.shift ? -1 : 1 };
    }
    return null;
  }
  if (!s.open) return null;
  if (k === "Escape") return { type: "close" };
  const sel = selectedModule(s);
  if (k === "j" || k === "ArrowDown") return { type: "nav", delta: 1 };
  if (k === "k" || k === "ArrowUp") return { type: "nav", delta: -1 };
  if (sel && (k === "Enter" || k === " ")) return { type: "toggle", name: sel.name, how: "keyboard" };
  if (sel && (k === "o" || k === "l" || k === "ArrowRight") && !s.unfolded.includes(sel.name)) return { type: "unfold", name: sel.name, how: "keyboard" };
  if (sel && (k === "h" || k === "ArrowLeft") && s.unfolded.includes(sel.name)) return { type: "unfold", name: sel.name, how: "keyboard" };
  return null;
}
