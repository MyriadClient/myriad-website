"use client";

import { Fragment, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { logoFirst, logoSecond, logoStroke } from "@/lib/logo";
import { contentInset, type Rect } from "./layout";
import { TAGS, themeVars, type KitTheme, type TagId } from "./theme";
import "./kit.css";

/** A length in UI units. */
export const u = (n: number) => `calc(${n} * var(--u))`;

export type KitWindow = {
  id: string;
  rect: Rect;
  icon: string;
  title: string;
  subtitle?: string;
  focused?: boolean;
  /** Floating or full screen: drawn over the tiles, frosting what's under it. */
  floating?: boolean;
  fullscreen?: boolean;
  state?: "opening" | "open" | "closing";
  content: ReactNode;
  onClose?: () => void;
  onFloat?: () => void;
  onFocus?: () => void;
  /** A press on the title bar (dragging it moves or swaps the window), or anywhere in it (with the mod key). */
  onTitlePointerDown?: (e: React.PointerEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
};

/** A divider between tiles, to drag. */
export type KitSplitter = { key: string; rect: Rect; vertical: boolean; onPointerDown?: (e: React.PointerEvent) => void };

/**
 * The screen as core draws it with its own Plain background (the background effects are an addon's, not core's): the
 * out-of-world backdrop and the theme's tint, the windows, the bar, and anything over everything (launcher, toasts).
 * Each window is drawn whole, in core's order (Workspace.drawOrder: tiles, then floating, the full-screen one last),
 * and its background frosts whatever was drawn before it.
 */
export function Stage({
  theme,
  windows,
  bar,
  overlay,
  splitters,
  preview,
  aspect,
  className = "",
  style,
  label,
  screenRef,
}: {
  theme: KitTheme;
  windows: KitWindow[];
  bar: ReactNode;
  overlay?: ReactNode;
  splitters?: KitSplitter[];
  /** Where a dragged window would go: all of a tile (a swap) or half of it (a split). */
  preview?: { rect: Rect; half: boolean } | null;
  /** The screen's width over its height (16:9 unless given). */
  aspect?: number;
  className?: string;
  style?: CSSProperties;
  label?: string;
  screenRef?: React.Ref<HTMLDivElement>;
}) {
  const vars = { ...themeVars(theme), "--mk-inset": u(contentInset(theme.rounding)), ...(aspect ? { aspectRatio: String(aspect) } : {}), ...style } as CSSProperties;
  const tiles = windows.filter((w) => !w.floating && !w.fullscreen).length;
  const order = [...windows.filter((w) => !w.floating && !w.fullscreen), ...windows.filter((w) => w.floating && !w.fullscreen), ...windows.filter((w) => w.fullscreen)];
  return (
    <div className={`mk-stage ${className}`} style={vars} role={label ? "img" : undefined} aria-label={label}>
      <div className="mk-screen" ref={screenRef}>
        <div className="mk-layer mk-tint" />
        <div className="mk-layer">
          {order.map((w, i) => (
            <Fragment key={w.id}>
              {/* The dividers sit over the tiles, under anything floating (UiInput grabs a window under the cursor first). */}
              {i === tiles &&
                splitters?.map((sp) => (
                  <div key={sp.key} className="mk-splitter" data-vertical={sp.vertical || undefined} style={place(sp.rect)} onPointerDown={sp.onPointerDown} />
                ))}
              <WindowWhole w={w} />
            </Fragment>
          ))}
          {tiles === order.length &&
            splitters?.map((sp) => (
              <div key={sp.key} className="mk-splitter" data-vertical={sp.vertical || undefined} style={place(sp.rect)} onPointerDown={sp.onPointerDown} />
            ))}
          {preview && <div className="mk-drop" data-half={preview.half || undefined} style={place(preview.rect)} />}
        </div>
        {bar}
        {overlay}
      </div>
    </div>
  );
}

function place(r: Rect): CSSProperties {
  return { left: u(r.x), top: u(r.y), width: u(r.w), height: u(r.h) };
}

function WindowWhole({ w }: { w: KitWindow }) {
  const raised = w.floating || w.fullscreen || undefined;
  const style = { ...place(w.rect), ...(w.fullscreen ? { borderRadius: 0 } : {}) };
  return (
    <>
      <div className="mk-win-back" data-state={w.state} data-raised={raised} style={style} aria-hidden="true" />
      <div
        className="mk-win"
        data-win={w.id}
        data-state={w.state}
        data-focused={w.focused || undefined}
        data-raised={raised}
        style={style}
        onPointerDown={(e) => {
          w.onFocus?.();
          w.onPointerDown?.(e);
        }}
      >
        <div className="mk-title" onPointerDown={w.onTitlePointerDown}>
          <div className="mk-title-inner">
            <span className="mk-icon mk-title-icon">{w.icon}</span>
            <span className="mk-title-text">{w.title}</span>
            {w.subtitle && <span className="mk-title-sub">{w.subtitle}</span>}
            <span className="mk-title-buttons" onPointerDown={(e) => e.stopPropagation()}>
              <span className="mk-icon mk-title-button" onClick={w.onFloat} title={w.floating ? "Tile" : "Float"}>{w.floating ? "\uf2d2" : "\uf2d0"}</span>
              <span className="mk-icon mk-title-button" data-close onClick={w.onClose} title="Close">{"\uf00d"}</span>
            </span>
          </div>
        </div>
        <div className="mk-content">{w.content}</div>
      </div>
    </>
  );
}

/** The Myriad mark as the bar's launcher button. */
export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <svg viewBox="40 40 176 176" fill="none" className={className} onClick={onClick} aria-label="Launcher">
      <path d={logoFirst} stroke="currentColor" strokeWidth={logoStroke} strokeLinecap="round" />
      <path d={logoSecond} stroke="currentColor" strokeWidth={logoStroke} strokeLinecap="round" />
    </svg>
  );
}

/** CoreBarWidgets: launcher button, workspaces, layout name; the focused window's title; fps and the clock. */
export function Bar({
  active,
  occupied,
  layout,
  title,
  fps = 144,
  clock,
  onLogo,
  onWorkspace,
}: {
  active: number;
  occupied: number[];
  layout: "dwindle" | "columns";
  title: string;
  fps?: number;
  clock?: string;
  onLogo?: () => void;
  onWorkspace?: (ws: number) => void;
}) {
  const shown = [1, 2, 3, 4, ...[5, 6, 7, 8, 9].filter((w) => w === active || occupied.includes(w)), 0];
  return (
    <div className="mk-bar">
      <Logo className="mk-bar-logo" onClick={onLogo} />
      <div className="mk-ws">
        {shown.map((ws) => (
          <span
            key={ws}
            className="mk-ws-cell"
            data-ws={ws}
            data-active={ws === active || undefined}
            data-occupied={occupied.includes(ws) || undefined}
            data-hud={ws === 0 || undefined}
            data-layout={layout}
            onClick={() => onWorkspace?.(ws)}
          >
            <span className={ws === 0 ? "mk-icon" : undefined}>{ws === 0 ? "" : ws}</span>
          </span>
        ))}
      </div>
      <span className="mk-bar-layout">{layout === "columns" ? "Columns" : "Dwindle"}</span>
      <span className="mk-bar-title">{title}</span>
      <span className="mk-bar-right">
        <span className="mk-bar-fps">{fps} fps</span>
        <span className="mk-bar-clock">
          <span className="mk-icon">{""}</span>
          {clock ?? <Clock />}
        </span>
      </span>
    </div>
  );
}

function Clock() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tick = () => setNow(new Date().toTimeString().slice(0, 5));
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);
  return <>{now || "20:54"}</>;
}

/** A module card (CardEntry/ModuleEntry): click toggles, right-click or the chevron unfolds its settings. */
export function Card({
  name,
  tag,
  on,
  open,
  keybind,
  onToggle,
  onOpen,
  children,
  highlight,
  selected,
}: {
  name: string;
  tag: TagId;
  on?: boolean;
  open?: boolean;
  keybind?: string;
  onToggle?: () => void;
  onOpen?: () => void;
  children?: ReactNode;
  highlight?: boolean;
  selected?: boolean;
}) {
  return (
    <div
      className="mk-card"
      data-card={name}
      data-on={on || undefined}
      data-open={open || undefined}
      data-hint={highlight || undefined}
      data-selected={selected || undefined}
      style={{ ["--tag" as string]: TAGS[tag].color }}
    >
      <div
        className="mk-card-head"
        onClick={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          // The chevron's end of the row unfolds instead (CardEntry: the last 14 units).
          if (e.clientX > box.right - box.height * (14 / 16)) onOpen?.();
          else onToggle?.();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          onOpen?.();
        }}
      >
        <span className="mk-card-name">{name}</span>
        {keybind && <span className="mk-badge">{keybind}</span>}
        <span className="mk-icon mk-chevron">{open ? "" : ""}</span>
      </div>
      {children !== undefined && (
        <div className="mk-fold" data-open={open || undefined}>
          <div>
            <div className="mk-card-body">{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/** The top of an unfolded module card: its description, then the addon and tags as pills. */
export function Info({ description, addon, tags }: { description: string; addon: string; tags: string }) {
  return (
    <>
      <div className="mk-desc">{description}</div>
      <div className="mk-pills">
        <span className="mk-badge" data-tinted>
          <span className="mk-icon">{"\uf1e6"}</span> {addon}
        </span>
        <span className="mk-badge">{tags}</span>
      </div>
    </>
  );
}

/** A settings group (Collapsible): chevron and bold name, an indented body. */
export function Group({ name, open, onToggle, children }: { name: string; open?: boolean; onToggle?: () => void; children?: ReactNode }) {
  return (
    <div className="mk-group" data-open={open || undefined}>
      <div className="mk-group-head" onClick={onToggle}>
        <span className="mk-icon">{open ? "" : ""}</span>
        {name}
      </div>
      <div className="mk-fold" data-open={open || undefined}>
        <div>
          <div className="mk-group-body">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** A setting's row: its name (in the accent's direction once changed) and its editor. */
export function Row({ name, changed, children }: { name: string; changed?: boolean; children: ReactNode }) {
  return (
    <div className="mk-row" data-setting={name} data-changed={changed || undefined}>
      <span className="mk-row-name">{name}</span>
      <span className="mk-row-editor">{children}</span>
    </div>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange?: (v: boolean) => void }) {
  return <span className="mk-toggle" data-on={on || undefined} role="switch" aria-checked={on} onClick={() => onChange?.(!on)} />;
}

/** A slider: drag it, or click to set. Whole numbers between min and max. */
export function Slider({ value, min, max, text, onChange, hint }: { value: number; min: number; max: number; text?: string; onChange?: (v: number) => void; hint?: boolean }) {
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const set = (el: HTMLElement, x: number) => {
    const box = el.getBoundingClientRect();
    onChange?.(Math.round(min + Math.min(1, Math.max(0, (x - box.left) / box.width)) * (max - min)));
  };
  return (
    <span
      className="mk-slider"
      data-hint={hint || undefined}
      onPointerDown={(e) => {
        if (!onChange) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        set(e.currentTarget, e.clientX);
      }}
      onPointerMove={(e) => e.buttons && onChange && set(e.currentTarget, e.clientX)}
      style={{ cursor: onChange ? "ew-resize" : undefined }}
    >
      <i style={{ width: `${t * 100}%` }} />
      <span>{text ?? value}</span>
    </span>
  );
}

export function Field({ value, onClick, hint }: { value: string; onClick?: () => void; hint?: boolean }) {
  return (
    <span className="mk-field" onClick={onClick} data-hint={hint || undefined}>
      {value}
      <span className="mk-icon">{"\uf078"}</span>
    </span>
  );
}

/** A dropdown's open list, under its row. */
export function Options({ options, value, onPick }: { options: string[]; value: string; onPick: (v: string) => void }) {
  return (
    <div className="mk-options">
      {options.map((o) => (
        <div key={o} className="mk-option" data-picked={o === value || undefined} onClick={() => onPick(o)}>
          {o}
        </div>
      ))}
    </div>
  );
}

export function Swatch({ color }: { color: string }) {
  return <span className="mk-swatch" style={{ background: color }} />;
}

export function Keybind({ value, listening, onClick }: { value: string; listening?: boolean; onClick?: () => void }) {
  return (
    <span className="mk-keybind" data-listening={listening || undefined} onClick={onClick}>
      {listening ? "Press a key…" : value}
    </span>
  );
}

export function Quiet({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <span className="mk-quiet" onClick={onClick}>
      {children}
    </span>
  );
}

export type LauncherEntry = { icon: string; title: string; hint: string };

/** The launcher: search field, then up to 10 results, the selected one tinted. */
export function Launcher({
  open,
  query,
  entries,
  selected = 0,
  onClose,
  onPick,
  onAlt,
}: {
  open: boolean;
  query: string;
  entries: LauncherEntry[];
  selected?: number;
  onClose?: () => void;
  onPick?: (i: number) => void;
  /** A right click or Shift + click: the result's other action (a module's own settings window). */
  onAlt?: (i: number) => void;
}) {
  return (
    <div className="mk-scrim" data-closed={!open || undefined} onPointerDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="mk-launcher" data-launcher>
        <div className="mk-launcher-head">
          <span className="mk-icon">{""}</span>
          {query ? (
            <span>
              {query}
              <span className="mk-caret" />
            </span>
          ) : (
            <span className="mk-launcher-placeholder">{"Search…   @addon  #kind  #tag"}</span>
          )}
        </div>
        {entries.length > 0 && (
          <div className="mk-launcher-list">
            {entries.slice(0, 10).map((e, i) => (
              <div
                key={e.title}
                className="mk-launcher-row"
                data-entry={e.title}
                data-selected={i === selected || undefined}
                onClick={(ev) => (ev.shiftKey && onAlt ? onAlt(i) : onPick?.(i))}
                onContextMenu={(ev) => {
                  ev.preventDefault();
                  (onAlt ?? onPick)?.(i);
                }}
              >
                <span className="mk-icon">{e.icon}</span>
                <span className="mk-launcher-row-title">{e.title}</span>
                <span className="mk-launcher-row-hint">{e.hint}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Toast({ title, text, hidden }: { title: string; text: string; hidden?: boolean }) {
  return (
    <div className="mk-toast" data-hidden={hidden || undefined}>
      <b>{title}</b>
      <span>{text}</span>
    </div>
  );
}
