"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { Bar, Card, Field, Group, Info, Launcher, Options, Quiet, Row, Slider, Stage, Toast, Toggle, type KitWindow } from "@/components/ui-kit/Kit";
import { half, splitSide, SCREEN_H, type Rect, type Side, type Splitter } from "@/components/ui-kit/layout";
import { type TagId } from "@/components/ui-kit/theme";
import { kitTheme, setSiteTheme, useSiteTheme } from "@/lib/site-theme";
import { CHAPTERS, stateAt, type Step } from "./chapters";
import { groupOf, keyAction, launcherEntries, rectsOf, reduce, selectedModule, splittersOf, windowInfo, windowsOf, type Action, type MenuState, type Module } from "./engine";

type Mod = "Alt" | "Ctrl" | "Super";

const TAG_NAMES: Record<TagId, string> = { combat: "Combat", movement: "Movement", render: "Render", player: "Player", world: "World", automation: "Automation", misc: "Misc" };

/** Whether the menu had the keyboard when a chapter was left: the next chapter takes it straight back. */
let keepFocus = false;

// ---- which chapters are done, kept in this browser (a convenience: nothing needs it) ----------------------------------

const DONE_KEY = "myriad-tutorial-done";
const doneListeners = new Set<() => void>();
function readDone(): string {
  try {
    return localStorage.getItem(DONE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}
function markDone(slug: string) {
  const done = parseDone(readDone());
  if (done.includes(slug)) return;
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify([...done, slug]));
  } catch {
    return;
  }
  doneListeners.forEach((f) => f());
}
function parseDone(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function useDone(): string[] {
  const raw = useSyncExternalStore(
    (cb) => {
      doneListeners.add(cb);
      return () => doneListeners.delete(cb);
    },
    readDone,
    () => "[]",
  );
  return useMemo(() => parseDone(raw), [raw]);
}

function useWide(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(min-width: 1024px)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => true,
  );
}

// ---- dragging windows and dividers, as UiInput does --------------------------------------------------------------------

type Drag =
  | { kind: "move"; id: string; offX: number; offY: number; w: number; h: number }
  | { kind: "swap"; id: string }
  | { kind: "split"; sp: Splitter }
  | { kind: "edges"; edges: { sp: Splitter; start: number }[]; sx: number; sy: number }
  | { kind: "corner"; id: string; start: Rect; cx: number; cy: number; sx: number; sy: number };

type Preview = { rect: Rect; half: boolean; target: string; side: Side | null };

/** The tutorial: a chapter's steps over a working copy of the menu that takes the real keys and the mouse. */
export function Player({ slug }: { slug: string }) {
  const index = CHAPTERS.findIndex((c) => c.slug === slug);
  const chapter = CHAPTERS[index];
  const next = CHAPTERS[index + 1];
  const [step, setStep] = useState(0);
  const [s, dispatch] = useReducer(reduce, undefined, () => stateAt(chapter, 0));
  const [mod, setMod] = useState<Mod>("Alt");
  const [focused, setFocused] = useState(false);
  const [hiddenToast, setHiddenToast] = useState<number | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [dragging, setDragging] = useState(false);
  const [full, setFull] = useState(false);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const region = useRef<HTMLDivElement>(null);
  const latest = useRef(s);
  const moved = useRef(false);
  const wide = useWide();
  const done = useDone();
  const site = useSiteTheme();

  const current = chapter.steps[step];
  const finished = step >= chapter.steps.length;
  const stepDone = !!current && current.done(s);
  const toast = s.toast && s.toast.at !== hiddenToast ? s.toast.text : null;
  // The themes chapter shows its own theme as it goes; everywhere else the menu wears the site's.
  const theme = kitTheme(chapter.slug === "themes" ? s.theme : site);

  useEffect(() => {
    latest.current = s;
  }, [s]);

  // A theme picked in the menu themes the site too, as it themes everything in game.
  useEffect(() => {
    if (s.last.startsWith("theme-")) setSiteTheme(s.theme);
  }, [s.last, s.theme]);

  useEffect(() => {
    if (finished) markDone(slug);
  }, [finished, slug]);

  // Coming from another chapter with the keyboard in the menu (or straight here), the menu has it again.
  useEffect(() => {
    if (keepFocus || document.activeElement === document.body) stage.current?.focus({ preventScroll: true });
  }, []);

  const go = (n: number, state?: MenuState) => {
    clearTimeout(advance.current?.t);
    advance.current = null;
    setStep(n);
    if (state) dispatch({ type: "reset", state });
    stage.current?.focus({ preventScroll: true });
  };

  // Done, the next step follows almost at once, so what someone does next (a quick Enter after typing) counts for it.
  const advance = useRef<{ step: number; t: ReturnType<typeof setTimeout> } | null>(null);
  useEffect(() => {
    if (!stepDone || advance.current?.step === step) return;
    const t = setTimeout(() => setStep((n) => (n === step ? n + 1 : n)), 160);
    advance.current = { step, t };
  }, [stepDone, step]);
  useEffect(() => () => clearTimeout(advance.current?.t), []);

  useEffect(() => {
    if (!s.toast) return;
    const at = s.toast.at;
    const t = setTimeout(() => setHiddenToast(at), 1500);
    return () => clearTimeout(t);
  }, [s.toast]);

  // The stage fills the room it has: the screen's shape follows it (its height is always 360 units).
  useEffect(() => {
    const el = region.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setBox({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [wide]);
  const aspect = wide && box && box.h > 0 ? Math.min(2.4, Math.max(1.25, box.w / box.h)) : 16 / 10;
  const screenW = Math.round(SCREEN_H * aspect);
  useEffect(() => {
    if (screenW !== latest.current.screenW) dispatch({ type: "screen", w: screenW });
  }, [screenW]);
  const stageW = wide && box ? Math.min(box.w, box.h * aspect) : undefined;

  useEffect(() => {
    const onChange = () => {
      const on = document.fullscreenElement === root.current;
      setFull(on);
      // In full screen Chromium lets the page have keys the browser keeps otherwise (Alt + Tab, Esc).
      const kb = (navigator as Navigator & { keyboard?: { lock?: () => Promise<void>; unlock?: () => void } }).keyboard;
      if (on) kb?.lock?.().catch(() => {});
      else kb?.unlock?.();
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else root.current?.requestFullscreen().catch(() => {});
    stage.current?.focus({ preventScroll: true });
  };

  const show = () => current?.show.forEach((a, i) => setTimeout(() => dispatch(a), i * 450));
  const modHeld = (e: { altKey: boolean; ctrlKey: boolean; metaKey: boolean }) => (mod === "Alt" ? e.altKey : mod === "Ctrl" ? e.ctrlKey : e.metaKey);

  function onKey(e: React.KeyboardEvent) {
    const held = modHeld(e);
    const action = keyAction(s, { key: e.key, code: e.code, shift: e.shiftKey, ctrl: mod !== "Ctrl" && e.ctrlKey, mod: held });
    if (action || held || (s.open && e.key === "Escape")) e.preventDefault();
    if (action) dispatch(action);
  }

  // Pointer positions in UI units.
  const units = useCallback((e: { clientX: number; clientY: number }) => {
    const r = screen.current!.getBoundingClientRect();
    const u = r.height / SCREEN_H;
    return { x: (e.clientX - r.left) / u, y: (e.clientY - r.top) / u };
  }, []);

  const begin = (d: Drag, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    moved.current = false;
    setDragging(true);
    const start = { x: e.clientX, y: e.clientY };
    let over: Preview | null = null;
    const onMove = (ev: PointerEvent) => {
      if (Math.abs(ev.clientX - start.x) + Math.abs(ev.clientY - start.y) > 3) moved.current = true;
      const { x, y } = units(ev);
      const st = latest.current;
      switch (d.kind) {
        case "move":
          dispatch({ type: "place", id: d.id, rect: { x: x - d.offX, y: y - d.offY, w: d.w, h: d.h } });
          break;
        case "split": {
          const b = d.sp.box;
          dispatch({ type: "ratio", path: d.sp.path, r: d.sp.vertical ? (x - b.x) / b.w : (y - b.y) / b.h });
          break;
        }
        case "edges":
          for (const { sp, start: at } of d.edges) {
            const edge = at + (sp.vertical ? x - d.sx : y - d.sy);
            dispatch({ type: "ratio", path: sp.path, r: sp.vertical ? (edge - sp.box.x) / sp.box.w : (edge - sp.box.y) / sp.box.h });
          }
          break;
        case "corner": {
          const r = d.start;
          const dx = x - d.sx, dy = y - d.sy;
          const w = Math.max(80, r.w + dx * d.cx), h = Math.max(40, r.h + dy * d.cy);
          dispatch({ type: "place", id: d.id, rect: { x: d.cx < 0 ? r.x + r.w - w : r.x, y: d.cy < 0 ? r.y + r.h - h : r.y, w, h } });
          break;
        }
        case "swap": {
          // Over another tile: all of it (a swap) or the half by the edge it's near (a split).
          const ws = st.workspaces[st.active];
          const rects = rectsOf(st, st.active);
          let found: Preview | null = null;
          for (const id of windowsOf(st, st.active)) {
            if (id === d.id || ws.floating.includes(id)) continue;
            const r = rects.get(id)!;
            if (x < r.x || x > r.x + r.w || y < r.y || y > r.y + r.h) continue;
            const side = splitSide(r, x, y);
            found = { rect: side ? half(r, side) : r, half: !!side, target: id, side };
          }
          over = found;
          setPreview(found);
          break;
        }
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      setDragging(false);
      if (d.kind === "swap") {
        setPreview(null);
        if (over) dispatch({ type: "drop", id: d.id, target: over.target, side: over.side });
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  /** Grabbing a window by its title bar, or anywhere with the mod key: the left button moves it, the right resizes. */
  const grab = (id: string, e: React.PointerEvent) => {
    const st = latest.current;
    const ws = st.workspaces[st.active];
    if (ws.fullscreen === id) return;
    const r = rectsOf(st, st.active).get(id);
    if (!r) return;
    const { x, y } = units(e);
    const floating = ws.floating.includes(id);
    if (e.button === 0) {
      begin(floating ? { kind: "move", id, offX: x - r.x, offY: y - r.y, w: r.w, h: r.h } : { kind: "swap", id }, e);
    } else if (e.button === 2) {
      if (floating) {
        begin({ kind: "corner", id, start: r, cx: x < r.x + r.w / 2 ? -1 : 1, cy: y < r.y + r.h / 2 ? -1 : 1, sx: x, sy: y }, e);
        return;
      }
      // UiInput.beginTileResize: the dividers on the edges nearest the cursor.
      const edgeX = x < r.x + r.w / 2 ? r.x : r.x + r.w;
      const edgeY = y < r.y + r.h / 2 ? r.y : r.y + r.h;
      const reach = 3 + 8;
      let bx: { sp: Splitter; start: number; d: number } | null = null;
      let by: { sp: Splitter; start: number; d: number } | null = null;
      for (const sp of splittersOf(st)) {
        const b = sp.bounds;
        if (sp.vertical) {
          const c = b.x + b.w / 2, d = Math.abs(c - edgeX);
          if (b.y < r.y + r.h && b.y + b.h > r.y && d < reach && (!bx || d < bx.d)) bx = { sp, start: c, d };
        } else {
          const c = b.y + b.h / 2, d = Math.abs(c - edgeY);
          if (b.x < r.x + r.w && b.x + b.w > r.x && d < reach && (!by || d < by.d)) by = { sp, start: c, d };
        }
      }
      const edges = [bx, by].filter((v): v is NonNullable<typeof v> => !!v).map(({ sp, start }) => ({ sp, start }));
      if (edges.length) begin({ kind: "edges", edges, sx: x, sy: y }, e);
    }
  };

  const nav = <Stepper slug={slug} step={step} finished={finished} stepDone={stepDone} done={done} onStep={(n) => go(n, stateAt(chapter, n))} />;
  const settings = (
    <div className="flex flex-wrap items-center gap-2 text-sm text-dim">
      <label className="flex items-center gap-2 whitespace-nowrap">
        Mod key
        <select value={mod} onChange={(e) => setMod(e.target.value as Mod)} className="rounded-md border border-line-strong bg-raised px-2 py-1 text-ink">
          <option>Alt</option>
          <option>Ctrl</option>
          <option>Super</option>
        </select>
      </label>
      <button type="button" onClick={toggleFull} className="ml-auto flex items-center gap-2 whitespace-nowrap rounded-md border border-line-strong px-2.5 py-1 text-ink hover:border-mint/60">
        <span className="icon" aria-hidden="true">{full ? "" : ""}</span>
        {full ? "Exit" : "Full screen"}
      </button>
    </div>
  );

  const card = (
    <CoachCard
      chapterTitle={chapter.title}
      step={step}
      steps={chapter.steps}
      current={current}
      finished={finished}
      stepDone={stepDone}
      mod={mod}
      next={next}
      onShow={show}
      onBack={() => go(step - 1, stateAt(chapter, step - 1))}
      onNext={() => go(step + 1, current.show.reduce(reduce, s))}
      onAgain={() => go(0, stateAt(chapter, 0))}
    />
  );

  const menu = (
    <div
      ref={stage}
      tabIndex={0}
      onKeyDown={onKey}
      onFocus={() => {
        setFocused(true);
        keepFocus = true;
      }}
      onBlur={(e) => {
        setFocused(false);
        // Leaving for the chapter list (or the card) keeps the claim; leaving the tutorial gives it up.
        keepFocus = !!e.relatedTarget && !!root.current?.contains(e.relatedTarget as Node);
      }}
      onPointerDown={() => stage.current?.focus({ preventScroll: true })}
      onContextMenuCapture={(e) => {
        if (modHeld(e)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onClickCapture={(e) => {
        // The end of a drag isn't a click on what's under it.
        if (moved.current) {
          e.stopPropagation();
          moved.current = false;
        }
      }}
      className="relative outline-none"
      aria-label="Myriad's menu: click here, then use the keys"
    >
      <MenuView
        s={s}
        dispatch={dispatch}
        hint={current?.hint}
        toast={toast}
        theme={theme}
        aspect={aspect}
        screenRef={screen}
        preview={preview}
        dragging={dragging}
        onTitle={(id, e) => grab(id, e)}
        onWindow={(id, e) => modHeld(e) && grab(id, e)}
        onSplitter={(sp, e) => e.button === 0 && begin({ kind: "split", sp }, e)}
      />
      {!focused && !finished && (
        <div className="pointer-events-none absolute inset-x-0 top-[12%] flex justify-center">
          <span className="rounded-full border border-line bg-bg/80 px-3 py-1 text-xs text-dim backdrop-blur">Click the menu, then use the keys</span>
        </div>
      )}
      {wide && <CoachLine stage={stage} target={finished ? undefined : current?.target} s={s} />}
      {wide && <div className="tut-card-slot">{card}</div>}
    </div>
  );

  return (
    <div ref={root} className="tut" data-full={full || undefined}>
      {wide ? (
        <>
          <aside className="tut-side">
            <div className="flex-1 overflow-y-auto px-5 py-6">
              <Link href="/tutorial/" className="text-xs font-semibold uppercase tracking-wider text-dim hover:text-ink">
                Tutorial
              </Link>
              <div className="mt-4">{nav}</div>
            </div>
            <div className="border-t border-line px-5 py-3">{settings}</div>
          </aside>
          <div ref={region} className="tut-region">
            <div className="tut-stage" style={{ width: stageW }}>
              {menu}
            </div>
          </div>
        </>
      ) : (
        <div className="px-4 py-5">
          <details className="tut-picker">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border border-line bg-raised px-3 py-2 text-sm">
              <span>
                <span className="text-dim">Chapter {index + 1}: </span>
                {chapter.title}
              </span>
              <span className="icon text-dim" aria-hidden="true">{""}</span>
            </summary>
            <div className="mt-2 rounded-lg border border-line bg-raised p-4">{nav}</div>
          </details>
          <div ref={region} className="mt-4 overflow-hidden rounded-xl border border-line-strong">
            {menu}
          </div>
          <div className="mt-4">{card}</div>
          <div className="mt-4">{settings}</div>
          <p className="mt-3 text-sm text-dim">The tutorial is best with a keyboard: tap a key chip to do the step.</p>
        </div>
      )}
    </div>
  );
}

// ---- the chapter list: a stepper, the open chapter's steps under it --------------------------------------------------

function Stepper({ slug, step, finished, stepDone, done, onStep }: { slug: string; step: number; finished: boolean; stepDone: boolean; done: string[]; onStep: (n: number) => void }) {
  const at = CHAPTERS.findIndex((c) => c.slug === slug);
  return (
    <nav aria-label="Chapters">
      <ol className="tut-steps">
        {CHAPTERS.map((c, i) => {
          const isCurrent = i === at;
          const isDone = done.includes(c.slug) || (isCurrent && finished);
          // The rail is lit up to where you are.
          const lit = i < at || (isCurrent && finished);
          return (
            <li key={c.slug} data-lit={lit || undefined} data-current={isCurrent || undefined}>
              <Link href={`/tutorial/${c.slug}/`} aria-current={isCurrent ? "page" : undefined} className="tut-chapter">
                <span className="tut-node" data-state={isDone ? "done" : isCurrent ? "current" : "todo"} aria-hidden="true">
                  {isDone && <span className="icon">{""}</span>}
                </span>
                <span className="min-w-0 flex-1">{c.title}</span>
                {isCurrent && <span className="icon text-xs text-dim" aria-hidden="true">{""}</span>}
              </Link>
              {isCurrent && (
                <ol className="tut-substeps">
                  {c.steps.map((st, n) => {
                    const state = n < step || (n === step && stepDone) || finished ? "done" : n === step ? "current" : "todo";
                    return (
                      <li key={n} data-lit={n < step || finished || undefined}>
                        <button type="button" onClick={() => onStep(n)} className="tut-substep" data-state={state} aria-current={state === "current" ? "step" : undefined}>
                          <span className="tut-dot" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate">{label(st)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </li>
          );
        })}
        <li>
          <Link href="/tutorial/cheat-sheet/" className="tut-chapter">
            <span className="tut-node" data-state="sheet" aria-hidden="true">
              <span className="icon">{""}</span>
            </span>
            Cheat sheet
          </Link>
        </li>
      </ol>
    </nav>
  );
}

/** A step's name in the list: the first words of what it says. */
function label(st: Step): string {
  const first = st.text.split(/(?<=[.:])\s/)[0].replace(/[.:]$/, "");
  return first.length > 42 ? first.slice(0, 40).trimEnd() + "…" : first;
}

// ---- the instruction card, and its line to what it's about -------------------------------------------------------------

function CoachCard({
  chapterTitle,
  step,
  steps,
  current,
  finished,
  stepDone,
  mod,
  next,
  onShow,
  onBack,
  onNext,
  onAgain,
}: {
  chapterTitle: string;
  step: number;
  steps: Step[];
  current?: Step;
  finished: boolean;
  stepDone: boolean;
  mod: Mod;
  next?: { slug: string; title: string };
  onShow: () => void;
  onBack: () => void;
  onNext: () => void;
  onAgain: () => void;
}) {
  return (
    <div className="tut-card" data-coach-card aria-live="polite" onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between gap-4 text-xs text-dim">
        <h1 className="font-semibold text-ink">{chapterTitle}</h1>
        {!finished && (
          <span>
            {step + 1} / {steps.length}
          </span>
        )}
      </div>
      {finished || !current ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <p className="text-base">
            <span className="icon mr-2 text-mint">{""}</span>
            Chapter done.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onAgain} className="rounded-full border border-line-strong px-4 py-1.5 text-sm">
              Again
            </button>
            <Link href={next ? `/tutorial/${next.slug}/` : "/tutorial/cheat-sheet/"} className="rounded-full bg-mint px-4 py-1.5 text-sm font-semibold text-bg">
              {next ? `Next: ${next.title}` : "The cheat sheet"}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p key={step} className="tut-text mt-2 text-[0.95rem] leading-relaxed">
            {stepDone && <span className="icon mr-2 text-mint">{""}</span>}
            {current.text.replaceAll("Alt", mod)}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {current.keys?.map((combo, i) => (
                <button key={i} type="button" onClick={onShow} className="flex items-center gap-1" title="Do it for me">
                  {combo.map((k) => (
                    <kbd key={k}>{k === "mod" ? mod : k}</kbd>
                  ))}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 text-sm">
              <button type="button" disabled={step === 0} onClick={onBack} className="rounded-full border border-line-strong px-3.5 py-1 disabled:opacity-40">
                Back
              </button>
              <button type="button" onClick={onShow} className="rounded-full border border-line-strong px-3.5 py-1 hover:border-mint/60">
                Show me
              </button>
              <button type="button" onClick={onNext} className="rounded-full bg-mint px-3.5 py-1 font-semibold text-bg">
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** A line from the card to the step's target and a ring round the target, following it as windows move; the card
 *  goes to the top when the target is down where it sits. */
function CoachLine({ stage, target, s }: { stage: React.RefObject<HTMLDivElement | null>; target?: Step["target"]; s: MenuState }) {
  const selector = typeof target === "function" ? target(s) : (target ?? null);
  const [geo, setGeo] = useState<{ t: Rect; c: Rect; w: number; h: number; r: number } | null>(null);
  useEffect(() => {
    const host = stage.current;
    if (!host) return;
    let raf = 0;
    let last = "";
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = selector ? host.querySelector(selector) : null;
      const card = host.querySelector("[data-coach-card]");
      const hb = host.getBoundingClientRect();
      if (!el || !card) {
        if (last !== "none") {
          last = "none";
          setGeo(null);
          host.dataset.cardTop = "";
        }
        return;
      }
      const tb = el.getBoundingClientRect(), cb = card.getBoundingClientRect();
      const t = { x: tb.left - hb.left, y: tb.top - hb.top, w: tb.width, h: tb.height };
      const top = t.y + t.h / 2 > hb.height * 0.55;
      if ((host.dataset.cardTop === "1") !== top) host.dataset.cardTop = top ? "1" : "";
      const c = { x: cb.left - hb.left, y: cb.top - hb.top, w: cb.width, h: cb.height };
      // The ring follows the target's own corners.
      const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      const key = [t.x, t.y, t.w, t.h, c.x, c.y, c.w, c.h, r].map((v) => v.toFixed(1)).join();
      if (key !== last) {
        last = key;
        setGeo({ t, c, w: hb.width, h: hb.height, r });
      }
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [stage, selector]);

  if (!geo) return null;
  const { t, c } = geo;
  const pad = 3;
  const ring = { x: t.x - pad, y: t.y - pad, w: t.w + pad * 2, h: t.h + pad * 2 };
  const below = c.y > t.y + t.h / 2; // the card is under the target
  const p = { x: Math.min(Math.max(t.x + t.w / 2, c.x + 24), c.x + c.w - 24), y: below ? c.y : c.y + c.h };
  const q = { x: Math.min(Math.max(p.x, ring.x + 6), ring.x + ring.w - 6), y: below ? ring.y + ring.h : ring.y };
  // The card over the target itself: just the ring.
  const overlaps = below ? q.y > p.y - 6 : q.y < p.y + 6;
  const mid = (p.y + q.y) / 2;
  return (
    <svg className="tut-line" width={geo.w} height={geo.h} aria-hidden="true">
      <rect x={ring.x} y={ring.y} width={ring.w} height={ring.h} rx={Math.min(geo.r + pad, ring.h / 2)} className="tut-ring" />
      {!overlaps && (
        <>
          <path d={`M ${p.x} ${p.y} C ${p.x} ${mid}, ${q.x} ${mid}, ${q.x} ${q.y}`} className="tut-path" />
          <circle cx={q.x} cy={q.y} r={3.5} className="tut-end" />
          <circle cx={p.x} cy={p.y} r={2.5} className="tut-end" />
        </>
      )}
    </svg>
  );
}

// ---- the menu ----------------------------------------------------------------------------------------------------------

/** The menu as the state says: the bar and the active workspace's windows while it's open, the launcher over all. */
function MenuView({
  s,
  dispatch,
  hint,
  toast,
  theme,
  aspect,
  screenRef,
  preview,
  dragging,
  onTitle,
  onWindow,
  onSplitter,
}: {
  s: MenuState;
  dispatch: (a: Action) => void;
  hint?: { card?: string; setting?: string };
  toast: string | null;
  theme: ReturnType<typeof kitTheme>;
  aspect: number;
  screenRef: React.Ref<HTMLDivElement>;
  preview: Preview | null;
  dragging: boolean;
  onTitle: (id: string, e: React.PointerEvent) => void;
  onWindow: (id: string, e: React.PointerEvent) => void;
  onSplitter: (sp: Splitter, e: React.PointerEvent) => void;
}) {
  const ws = s.workspaces[s.active];
  const rects = rectsOf(s, s.active);
  const sel = selectedModule(s);
  const settings = <KillAuraSettings s={s} dispatch={dispatch} hint={hint} />;
  const windows: KitWindow[] = s.open
    ? windowsOf(s, s.active).map((id) => {
        const info = windowInfo(id);
        const g = groupOf(id);
        return {
          id,
          rect: rects.get(id)!,
          icon: info.icon,
          title: info.title,
          subtitle: info.subtitle,
          focused: ws.focused === id,
          floating: ws.floating.includes(id),
          fullscreen: ws.fullscreen === id,
          onFocus: () => dispatch({ type: "focus", id }),
          onClose: () => dispatch({ type: "closeWindow", id }),
          onFloat: () => {
            dispatch({ type: "focus", id });
            dispatch({ type: "float" });
          },
          onTitlePointerDown: (e) => onTitle(id, e),
          onPointerDown: (e) => onWindow(id, e),
          content: info.module ? (
            <ModuleWindow m={info.module} s={s} dispatch={dispatch} settings={info.module.name === "Kill Aura" ? settings : null} />
          ) : (
            g?.modules.map((m) => (
              <Card
                key={m.name}
                name={m.name}
                tag={m.tag}
                on={s.on.includes(m.name)}
                open={s.unfolded.includes(m.name)}
                selected={sel?.name === m.name}
                highlight={hint?.card === m.name}
                onToggle={() => dispatch({ type: "toggle", name: m.name })}
                onOpen={() => dispatch({ type: "unfold", name: m.name })}
              >
                <Info description={m.description} addon="Essentials" tags={TAG_NAMES[m.tag]} />
                {m.name === "Kill Aura" && settings}
              </Card>
            ))
          ),
        };
      })
    : [];
  const entries = launcherEntries(s);
  const info = ws.focused ? windowInfo(ws.focused) : null;
  const focusedTitle = info ? (info.subtitle ? `${info.title} · ${info.subtitle}` : info.title) : "";
  const occupied = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => windowsOf(s, n).length > 0);
  return (
    <Stage
      theme={theme}
      windows={windows}
      aspect={aspect}
      screenRef={screenRef}
      className={dragging ? "mk-dragging" : ""}
      splitters={s.open ? splittersOf(s).map((sp) => ({ key: sp.path || "root", rect: sp.bounds, vertical: sp.vertical, onPointerDown: (e) => onSplitter(sp, e) })) : []}
      preview={preview && { rect: preview.rect, half: preview.half }}
      label="Myriad's menu"
      bar={
        s.open ? (
          <Bar
            active={s.active}
            occupied={occupied}
            layout={ws.layout}
            title={focusedTitle}
            onLogo={() => dispatch({ type: "launcher", open: !s.launcher.open })}
            onWorkspace={(n) => (n === s.active ? dispatch({ type: "layout" }) : n > 0 && dispatch({ type: "workspace", n }))}
          />
        ) : null
      }
      overlay={
        <>
          {!s.open && (
            <div className="mk-game">
              <span className="mk-crosshair" />
              <span style={{ position: "absolute", bottom: "8%", opacity: 0.7 }}>Your game</span>
            </div>
          )}
          {s.open && windows.length === 0 && (
            <div className="mk-game" style={{ top: "4%" }}>
              <span style={{ textAlign: "center", lineHeight: 1.6 }}>
                Workspace {s.active} is empty
                <br />
                <span style={{ fontSize: "0.8em" }}>Alt+Space to open something · Alt+1-9 to switch</span>
              </span>
            </div>
          )}
          <Launcher
            open={s.launcher.open}
            query={s.launcher.query}
            entries={entries.slice(0, 10)}
            selected={s.launcher.selected}
            onClose={() => dispatch({ type: "launcher", open: false })}
            onPick={(i) => dispatch({ type: "pick", index: i })}
            onAlt={(i) => dispatch({ type: "pick", index: i, alt: true })}
          />
          <Toast title={toast?.startsWith("Applied") ? "Theme" : "Menu"} text={toast ?? ""} hidden={!toast} />
        </>
      }
    />
  );
}

function KillAuraSettings({ s, dispatch, hint }: { s: MenuState; dispatch: (a: Action) => void; hint?: { card?: string; setting?: string } }) {
  return (
    <>
      <Group name="General" open={s.general} onToggle={() => dispatch({ type: "general" })}>
        <Row name="Weapon" changed={s.settings.weapon !== "Holding"}>
          <Field value={s.settings.weapon} hint={hint?.setting === "Weapon"} onClick={() => dispatch({ type: "dropdown" })} />
        </Row>
        {s.dropdown && <Options options={["Holding", "Switch", "Anything"]} value={s.settings.weapon} onPick={(v) => dispatch({ type: "setting", key: "weapon", value: v })} />}
        <Row name="Turn Speed" changed={s.settings.turnSpeed !== 0}>
          <Slider value={s.settings.turnSpeed} min={0} max={180} hint={hint?.setting === "Turn Speed"} onChange={(v) => dispatch({ type: "setting", key: "turnSpeed", value: v })} />
        </Row>
      </Group>
      <Group name="Targets" />
      <Group name="Render" />
      <Group name="Module" />
    </>
  );
}

/** ModuleSettingsPanel: Enabled and its switch, the description, group and addon, the settings, Reset. */
function ModuleWindow({ m, s, dispatch, settings }: { m: Module; s: MenuState; dispatch: (a: Action) => void; settings: React.ReactNode }) {
  const on = s.on.includes(m.name);
  return (
    <>
      <div className="mk-module-head">
        <b>{on ? "Enabled" : "Disabled"}</b>
        <Toggle on={on} onChange={() => dispatch({ type: "toggle", name: m.name })} />
      </div>
      <div className="mk-desc">{m.description}</div>
      <div className="mk-desc">{m.group} · Essentials</div>
      {settings ?? <Group name="Module" />}
      <Quiet>{"  Reset to default"}</Quiet>
    </>
  );
}
