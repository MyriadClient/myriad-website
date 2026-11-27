"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import groups from "@/data/essentials-modules.json";
import { Bar, Card, Field, Group, Info, Launcher, Row, Slider, Stage, Toast, type KitWindow, type LauncherEntry } from "@/components/ui-kit/Kit";
import { columns, firstRunGrid } from "@/components/ui-kit/layout";
import { type KitTheme, type TagId } from "@/components/ui-kit/theme";
import { kitTheme, useSiteTheme } from "@/lib/site-theme";
import { score } from "@/components/tutorial/engine";

/*
 * The landing page's showcase: core's menu as a new install opens it, with Essentials' modules as the example (at UI
 * Scale 1.5 a workspace takes four group windows, so its first four groups, in Dwindle's first-run grid, in the order
 * Essentials registers them). It plays a short loop: a module turns on and unfolds, the launcher turns on another, the
 * layout switches to Columns and back. Clicking anything takes over: cards toggle and unfold, the logo opens the
 * launcher, the active workspace square switches the layout.
 */

type Group = { name: string; icon: string; modules: { name: string; tag: string; description: string; order: number }[] };
const GROUPS = (groups as Group[]).slice(0, 4);
const ALL = (groups as Group[])
  .flatMap((g) => g.modules.map((m) => ({ ...m, tag: m.tag as TagId, group: g.name })))
  .sort((a, b) => a.order - b.order);

type State = {
  opened: boolean;
  layout: "dwindle" | "columns";
  on: Set<string>;
  open: string | null;
  general: boolean;
  focused: string;
  launcher: { open: boolean; query: string };
  toast: string | null;
};

type Action =
  | { type: "open" }
  | { type: "toggle"; name: string }
  | { type: "unfold"; name: string | null }
  | { type: "general" }
  | { type: "focus"; group: string }
  | { type: "launcher"; open: boolean; query?: string }
  | { type: "layout"; layout?: "dwindle" | "columns" }
  | { type: "toast"; text: string | null }
  | { type: "reset" }
  | { type: "still" };

const initial: State = {
  opened: false,
  layout: "dwindle",
  on: new Set(["Auto Armor", "Velocity"]),
  open: null,
  general: true,
  focused: "Combat",
  launcher: { open: false, query: "" },
  toast: null,
};

function reduce(s: State, a: Action): State {
  switch (a.type) {
    case "open":
      return { ...s, opened: true };
    case "toggle": {
      const on = new Set(s.on);
      if (on.has(a.name)) on.delete(a.name);
      else on.add(a.name);
      return { ...s, on };
    }
    case "unfold":
      return { ...s, open: s.open === a.name ? null : a.name };
    case "general":
      return { ...s, general: !s.general };
    case "focus":
      return { ...s, focused: a.group };
    case "launcher":
      return { ...s, launcher: { open: a.open, query: a.query ?? (a.open ? s.launcher.query : "") } };
    case "layout":
      return { ...s, layout: a.layout ?? (s.layout === "dwindle" ? "columns" : "dwindle") };
    case "toast":
      return { ...s, toast: a.text };
    case "reset":
      return { ...initial, opened: true };
    case "still":
      // A frame worth looking at: Kill Aura on and unfolded.
      return { ...initial, opened: true, on: new Set([...initial.on, "Kill Aura"]), open: "Kill Aura" };
  }
}

/** The loop, as [ms from its start, action]. */
const SCRIPT: [number, Action][] = [
  [400, { type: "open" }],
  [1600, { type: "toggle", name: "Kill Aura" }],
  [2600, { type: "unfold", name: "Kill Aura" }],
  [4400, { type: "focus", group: "World" }],
  [4600, { type: "launcher", open: true, query: "" }],
  [5200, { type: "launcher", open: true, query: "s" }],
  [5400, { type: "launcher", open: true, query: "sc" }],
  [5600, { type: "launcher", open: true, query: "sca" }],
  [5800, { type: "launcher", open: true, query: "scaf" }],
  [6600, { type: "launcher", open: false }],
  [6650, { type: "toggle", name: "Scaffold" }],
  [7800, { type: "unfold", name: null }],
  [8200, { type: "layout", layout: "columns" }],
  [8200, { type: "toast", text: "Layout: Columns" }],
  [9700, { type: "toast", text: null }],
  [11400, { type: "layout", layout: "dwindle" }],
  [11400, { type: "toast", text: "Layout: Dwindle" }],
  [12900, { type: "toast", text: null }],
  [14200, { type: "reset" }],
];
const LOOP = 14600;

function tagName(tag: TagId) {
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

/**
 * @param swapped Combat and Movement swapped (Alt + Shift + →), and World and Player: the hero shows the menu's right
 *                side clear of its type, so the windows the loop works in sit on the right.
 */
export function Showcase({ theme, play = true, className = "", swapped = false }: { theme?: KitTheme; play?: boolean; className?: string; swapped?: boolean }) {
  const [s, dispatch] = useReducer(reduce, initial);
  // Without a theme of its own it wears the site's, as the whole menu wears the theme in game.
  const site = useSiteTheme();
  const [taken, setTaken] = useState(false);
  const host = useRef<HTMLDivElement>(null);

  // The loop plays while it's on screen, until someone clicks into it.
  useEffect(() => {
    if (taken) return;
    if (!play || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      dispatch({ type: "still" });
      return;
    }
    let timers: ReturnType<typeof setTimeout>[] = [];
    let visible = false;
    let running = false;
    const run = () => {
      if (running) return;
      running = true;
      const once = () => {
        timers = SCRIPT.map(([at, action]) => setTimeout(() => dispatch(action), at));
        timers.push(setTimeout(once, LOOP));
      };
      once();
    };
    const stop = () => {
      running = false;
      timers.forEach(clearTimeout);
      timers = [];
    };
    const seen = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) run();
      else stop();
    });
    if (host.current) seen.observe(host.current);
    return () => {
      stop();
      seen.disconnect();
    };
  }, [play, taken]);

  const take = () => setTaken(true);

  const rects = useMemo(() => (s.layout === "columns" ? columns(4) : firstRunGrid(4)), [s.layout]);

  const shown = swapped ? [GROUPS[1], GROUPS[0], GROUPS[3], GROUPS[2]] : GROUPS;
  const windows: KitWindow[] = shown.map((g, i) => ({
    id: g.name,
    rect: rects[i],
    icon: g.icon,
    title: g.name,
    subtitle: "Essentials",
    focused: s.focused === g.name,
    state: s.opened ? "open" : "opening",
    onFocus: () => dispatch({ type: "focus", group: g.name }),
    content: g.modules.map((m) => {
      const tag = m.tag as TagId;
      return (
        <Card
          key={m.name}
          name={m.name}
          tag={tag}
          on={s.on.has(m.name)}
          open={s.open === m.name}
          keybind={m.name === "Kill Aura" ? "R" : undefined}
          onToggle={() => {
            take();
            dispatch({ type: "toggle", name: m.name });
          }}
          onOpen={() => {
            take();
            dispatch({ type: "unfold", name: m.name });
          }}
        >
          {m.name === "Kill Aura" ? (
            <>
              <Info description={m.description} addon="Essentials" tags="Combat" />
              <Group name="General" open={s.general} onToggle={() => { take(); dispatch({ type: "general" }); }}>
                <Row name="Weapon"><Field value="Holding" /></Row>
                <Row name="Turn Speed"><Slider value={0} min={0} max={180} /></Row>
              </Group>
              <Group name="Targets" />
              <Group name="Render" />
              <Group name="Module" />
            </>
          ) : (
            <Info description={m.description} addon="Essentials" tags={tagName(tag)} />
          )}
        </Card>
      );
    }),
  }));

  // Launcher.refresh: with nothing typed, everything in order (modules first); typed, the fuzzy matches.
  const q = s.launcher.query;
  const ranked = q ? ALL.map((m) => ({ m, sc: score(m.name, q) + 3 })).filter((x) => x.sc >= 3).sort((a, b) => b.sc - a.sc).map((x) => x.m) : ALL;
  const found: LauncherEntry[] = ranked.map((m) => ({
    icon: s.on.has(m.name) ? "\uf205" : "\uf204",
    title: m.name,
    hint: `${m.group} · ${s.on.has(m.name) ? "on" : "off"}`,
  }));
  // Whatever's typed can also name something new; those always come last.
  const make: LauncherEntry[] = q
    ? [
        { icon: "\uf067", title: `New macro: ${q}`, hint: "A module that runs commands" },
        { icon: "\uf067", title: `New control panel: ${q}`, hint: "Switch modules together" },
        { icon: "\uf067", title: `New wheel: ${q}`, hint: "Pick from a ring while a key is held" },
      ]
    : [];
  const entries = [...found.slice(0, 10 - make.length), ...make];

  const focusedTitle = `${s.focused} · Essentials`;
  return (
    <div ref={host} className={className} onPointerDown={take}>
      <Stage
        theme={theme ?? kitTheme(site)}
        windows={windows}
        label="Myriad's menu over the game: four windows of Essentials modules"
        bar={
          <Bar
            active={1}
            occupied={[1, 2]}
            layout={s.layout}
            title={focusedTitle}
            onLogo={() => dispatch({ type: "launcher", open: !s.launcher.open })}
            onWorkspace={(ws) => ws === 1 && dispatch({ type: "layout" })}
          />
        }
        overlay={
          <>
            <Launcher
              open={s.launcher.open}
              query={q}
              entries={entries}
              onClose={() => dispatch({ type: "launcher", open: false })}
              onPick={(i) => {
                const e = entries[i];
                dispatch({ type: "launcher", open: false });
                if (e && ALL.some((m) => m.name === e.title)) dispatch({ type: "toggle", name: e.title });
              }}
            />
            <Toast title="Menu" text={s.toast ?? ""} hidden={!s.toast} />
          </>
        }
      />
    </div>
  );
}
