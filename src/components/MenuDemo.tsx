"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { themeVars, type MenuTheme } from "@/lib/themes";

/* ---------- Scene model ---------- */

type Rect = { x: number; y: number; w: number; h: number };
type WinId = "combat" | "render" | "movement" | "player" | "killaura";

type Scene = {
  windows: Partial<Record<WinId, Rect>>;
  focused: WinId | null;
  layout: "Dwindle" | "Columns";
  launcher: { text: string; result: boolean } | null;
  espOn: boolean;
  killAuraOn: boolean;
  hoverKillAura: boolean;
  title: string;
};

const FULL: Rect = { x: 0, y: 0, w: 100, h: 100 };
const L: Rect = { x: 0, y: 0, w: 50, h: 100 };
const R: Rect = { x: 50, y: 0, w: 50, h: 100 };
const RT: Rect = { x: 50, y: 0, w: 50, h: 50 };
const RB: Rect = { x: 50, y: 50, w: 50, h: 50 };
const LT: Rect = { x: 0, y: 0, w: 50, h: 50 };
const LB: Rect = { x: 0, y: 50, w: 50, h: 50 };
const LTT: Rect = { x: 0, y: 0, w: 50, h: 25 };
const LTB: Rect = { x: 0, y: 25, w: 50, h: 25 };
const COLUMNS: Partial<Record<WinId, Rect>> = {
  combat: { x: 0, y: 0, w: 25, h: 100 },
  render: { x: 25, y: 0, w: 25, h: 100 },
  movement: { x: 50, y: 0, w: 25, h: 100 },
  player: { x: 75, y: 0, w: 25, h: 100 },
};

const EMPTY: Scene = {
  windows: {},
  focused: null,
  layout: "Dwindle",
  launcher: null,
  espOn: false,
  killAuraOn: false,
  hoverKillAura: false,
  title: "",
};

const timeline: { at: number; scene: Scene }[] = [];
{
  let s = EMPTY;
  const at = (ms: number, patch: Partial<Scene>) => {
    s = { ...s, ...patch };
    timeline.push({ at: ms, scene: s });
  };
  at(0, {});
  at(600, { windows: { combat: FULL }, focused: "combat", title: "Combat · Essentials" });
  at(1500, { windows: { combat: L, render: R }, focused: "render", title: "Render · Essentials" });
  at(2400, {
    windows: { combat: L, render: RT, movement: RB },
    focused: "movement",
    title: "Movement · Essentials",
  });
  at(3200, { focused: "combat", title: "Combat · Essentials" });
  at(3600, {
    windows: { combat: LT, render: RT, movement: RB, player: LB },
    focused: "player",
    title: "Player · Essentials",
  });
  at(4800, { launcher: { text: "", result: false } });
  at(5100, { launcher: { text: "e", result: false } });
  at(5250, { launcher: { text: "es", result: false } });
  at(5400, { launcher: { text: "esp", result: true } });
  at(6300, { launcher: null, espOn: true, focused: "render", title: "Render · Essentials" });
  at(7200, { hoverKillAura: true, focused: "combat", title: "Combat · Essentials" });
  at(7600, {
    hoverKillAura: false,
    windows: { combat: LTT, killaura: LTB, render: RT, movement: RB, player: LB },
    focused: "killaura",
    title: "Kill Aura",
  });
  at(8500, { killAuraOn: true });
  at(9800, { windows: COLUMNS, layout: "Columns", focused: "combat", title: "Combat · Essentials" });
  at(11600, { windows: {}, focused: null, title: "" });
}
const LOOP_MS = 12400;
/** The frame shown when motion is reduced, and in the still version. */
const STILL = timeline.find((t) => t.at === 8500)!.scene;

/* ---------- Content ---------- */

const windowMeta: Record<WinId, { name: string; icon: "combat" | "render" | "movement" | "player"; addon?: string; rows: string[] }> = {
  combat: { name: "Combat", icon: "combat", addon: "Essentials", rows: ["Offhand", "Auto Armor", "Auto Disconnect", "Kill Aura"] },
  render: {
    name: "Render",
    icon: "render",
    addon: "Essentials",
    rows: ["ESP", "Blocks", "Storage", "Tracers", "Nametags", "No Render", "Tooltips", "Full Bright", "Free Look", "Freecam", "Zoom"],
  },
  movement: { name: "Movement", icon: "movement", addon: "Essentials", rows: ["Elytra Fly", "Elytra Tweaks", "Inventory Move", "Velocity"] },
  player: {
    name: "Player",
    icon: "player",
    addon: "Essentials",
    rows: ["Auto Eat", "Auto Tool", "Inventory Tweaks", "Middle Click", "Packet Mine", "Reach", "Stack Replenish", "Wall Interact", "X Carry"],
  },
  killaura: { name: "Kill Aura", icon: "combat", rows: [] },
};

const alwaysOn: Partial<Record<WinId, string[]>> = { render: ["Tracers", "Nametags"] };

/* ---------- Component ---------- */

export function MenuDemo({
  theme,
  play = true,
  className = "",
  label = "Animated illustration of the Myriad menu: category windows tiling as they open, the launcher toggling a module, a settings window splitting in, and the layout switching to Columns.",
}: {
  theme: MenuTheme;
  play?: boolean;
  className?: string;
  label?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const animate = play && !reduce;

  const [step, setStep] = useState(animate ? 0 : timeline.length - 1);
  const [loop, setLoop] = useState(0);
  const groupId = useId();

  useEffect(() => {
    if (!animate || !inView) return;
    // Step 0 sits at 0 ms, so the first timer resets the scene.
    const timers = timeline.map((t, i) => setTimeout(() => setStep(i), t.at));
    const restart = setTimeout(() => setLoop((n) => n + 1), LOOP_MS);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(restart);
    };
  }, [animate, inView, loop]);

  const scene = animate ? timeline[step].scene : STILL;
  const workspace = animate ? (loop % 4) + 1 : 1;

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      className={`menu relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-line-strong/70 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] ${className}`}
      style={{ ...themeVars(theme), background: "var(--m-desktop)" }}
    >
      <LayoutGroup id={groupId}>
        <Bar scene={scene} workspace={workspace} />
        <div className="absolute inset-x-0 bottom-0 top-[6.5cqw] p-[calc(var(--m-gap)/2)]">
          {/* a soft glow where the world would be */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 50% at 70% 100%, color-mix(in srgb, var(--m-secondary) 10%, transparent), transparent 70%)",
            }}
          />
          <AnimatePresence>
            {(Object.keys(scene.windows) as WinId[]).map((id) => (
              <Window
                key={id}
                id={id}
                rect={scene.windows[id]!}
                focused={scene.focused === id}
                scene={scene}
              />
            ))}
          </AnimatePresence>
          <AnimatePresence>{scene.launcher && <Launcher state={scene.launcher} />}</AnimatePresence>
        </div>
      </LayoutGroup>
    </div>
  );
}

/* ---------- Bar ---------- */

function Bar({ scene, workspace }: { scene: Scene; workspace: number }) {
  return (
    <div
      className="theme-color absolute inset-x-0 top-0 flex h-[6.5cqw] items-center justify-between px-[1.6cqw] text-[1.45cqw]"
      style={{ background: "var(--m-bar)", color: "var(--m-dim)" }}
    >
      <div className="flex items-center gap-[1.4cqw]">
        <Logo className="h-[2.2cqw] w-[2.2cqw]" />
        <div className="flex items-center gap-[0.4cqw]">
          {[1, 2, 3, 4].map((n) => (
            <span
              key={n}
              className="relative flex h-[2.8cqw] min-w-[2.8cqw] items-center justify-center rounded-[0.5cqw] px-[0.5cqw]"
              style={{ color: n === workspace ? "var(--m-bar)" : "var(--m-dim)" }}
            >
              {n === workspace && (
                <motion.span
                  layoutId="ws-pill"
                  className="absolute inset-0 rounded-[0.5cqw]"
                  style={{ background: "var(--m-accent)" }}
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <span className="relative font-medium">{n}</span>
            </span>
          ))}
        </div>
        <MonitorIcon className="h-[1.9cqw] w-[1.9cqw]" />
        <span>{scene.layout}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.span
          key={scene.title}
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -2 }}
          transition={{ duration: 0.18 }}
          className="absolute left-1/2 -translate-x-1/2 font-medium"
          style={{ color: "var(--m-text)" }}
        >
          {scene.title}
        </motion.span>
      </AnimatePresence>
      <div className="flex items-center gap-[1.4cqw]">
        <span>60 fps</span>
        <span className="flex items-center gap-[0.5cqw]">
          <ClockIcon className="h-[1.7cqw] w-[1.7cqw]" />
          <span style={{ color: "var(--m-text)" }}>20:54</span>
        </span>
      </div>
    </div>
  );
}

/* ---------- Window ---------- */

const ease = [0.22, 1, 0.36, 1] as const;

function Window({ id, rect, focused, scene }: { id: WinId; rect: Rect; focused: boolean; scene: Scene }) {
  const meta = windowMeta[id];
  const border = focused ? "var(--m-border-active)" : "var(--m-border-inactive)";
  const gradient = focused
    ? "linear-gradient(135deg, var(--m-border-active), var(--m-border-active-end))"
    : "linear-gradient(var(--m-border-inactive), var(--m-border-inactive))";
  return (
    <motion.div
      className="absolute p-[calc(var(--m-gap)/2)]"
      initial={{ left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.w}%`, height: `${rect.h}%`, opacity: 0, scale: 0.96 }}
      animate={{ left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.w}%`, height: `${rect.h}%`, opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.35, ease } }}
      transition={{ duration: 0.55, ease }}
    >
      <div
        className="theme-color relative flex h-full w-full flex-col overflow-hidden rounded-[var(--m-rounding)]"
        style={{
          background: gradient,
          padding: "0.18cqw",
          boxShadow: focused
            ? "0 1.2cqw 3cqw -1cqw rgba(0,0,0,0.6)"
            : "0 0.8cqw 2cqw -1cqw rgba(0,0,0,0.5)",
          borderColor: border,
        }}
      >
        <div
          className="theme-color flex h-full w-full flex-col overflow-hidden rounded-[calc(var(--m-rounding)-0.18cqw)]"
          style={{ background: "var(--m-window)" }}
        >
          <div
            className="theme-color flex h-[3.2cqw] shrink-0 items-center gap-[0.8cqw] px-[1.1cqw] text-[1.45cqw]"
            style={{ background: "var(--m-title)" }}
          >
            <CategoryIcon kind={meta.icon} className="h-[1.6cqw] w-[1.6cqw] shrink-0" style={{ color: "var(--m-dim)" }} />
            <span className="truncate font-medium" style={{ color: "var(--m-text)" }}>
              {meta.name}
            </span>
            {meta.addon && (
              <span className="truncate" style={{ color: "var(--m-dim)" }}>
                {meta.addon}
              </span>
            )}
            <span className="ml-auto flex shrink-0 items-center gap-[0.9cqw]" style={{ color: "var(--m-dim)" }}>
              <span className="block h-[1cqw] w-[1.3cqw] rounded-[0.15cqw] border-[0.15cqw] border-current" />
              <span className="text-[1.6cqw] leading-none">×</span>
            </span>
          </div>
          {id === "killaura" ? (
            <KillAuraSettings on={scene.killAuraOn} />
          ) : (
            <div className="flex flex-col gap-[0.55cqw] p-[0.9cqw]">
              {meta.rows.map((row) => {
                const on = (id === "render" && row === "ESP" && scene.espOn) || alwaysOn[id]?.includes(row);
                const hover = id === "combat" && row === "Kill Aura" && scene.hoverKillAura;
                return <Row key={row} label={row} on={!!on} hover={hover} />;
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Row({ label, on, hover }: { label: string; on: boolean; hover: boolean }) {
  return (
    <div
      className="theme-color relative flex h-[2.7cqw] shrink-0 items-center overflow-hidden rounded-[calc(var(--m-rounding)*0.6)] pl-[1cqw] pr-[0.9cqw] text-[1.35cqw]"
      style={{
        background: on
          ? "color-mix(in srgb, var(--m-accent) 32%, var(--m-surface))"
          : hover
            ? "var(--m-surface-hover)"
            : "var(--m-surface)",
        color: on ? "var(--m-text)" : "var(--m-dim)",
        transition: "background-color 0.35s ease, color 0.35s ease",
      }}
    >
      <motion.span
        className="absolute inset-y-0 left-0 w-[0.35cqw]"
        style={{ background: "var(--m-accent)" }}
        animate={{ scaleY: on ? 1 : 0 }}
        initial={false}
        transition={{ duration: 0.3, ease }}
      />
      <span className="truncate">{label}</span>
      <ChevronIcon className="ml-auto h-[1.3cqw] w-[1.3cqw] shrink-0 opacity-70" />
    </div>
  );
}

function KillAuraSettings({ on }: { on: boolean }) {
  return (
    <div className="flex flex-col gap-[0.7cqw] p-[1cqw] text-[1.35cqw]" style={{ color: "var(--m-dim)" }}>
      <div className="flex items-center justify-between">
        <span className="font-medium" style={{ color: "var(--m-text)" }}>
          {on ? "Enabled" : "Disabled"}
        </span>
        <Toggle on={on} />
      </div>
      <p className="truncate">Attacks targets in reach, facing them first.</p>
      <div className="mt-[0.3cqw] flex items-center gap-[0.6cqw]" style={{ color: "var(--m-text)" }}>
        <ChevronIcon className="h-[1.2cqw] w-[1.2cqw] rotate-90" />
        <span className="font-medium">General</span>
      </div>
      <SettingRow label="Weapon">
        <span className="flex items-center justify-between px-[0.8cqw]" style={{ color: "var(--m-text)" }}>
          Holding <ChevronIcon className="h-[1.2cqw] w-[1.2cqw] rotate-90" />
        </span>
      </SettingRow>
      <SettingRow label="Turn speed">
        <span className="flex items-center justify-end px-[0.8cqw]" style={{ color: "var(--m-text)" }}>
          0
        </span>
      </SettingRow>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-[1cqw] pl-[1.9cqw]">
      <span className="truncate">{label}</span>
      <span
        className="theme-color flex h-[2.4cqw] w-[45%] shrink-0 flex-col justify-center rounded-[calc(var(--m-rounding)*0.6)]"
        style={{ background: "var(--m-surface)" }}
      >
        {children}
      </span>
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className="theme-color flex h-[1.9cqw] w-[3.6cqw] items-center rounded-full px-[0.25cqw]"
      style={{
        background: on ? "var(--m-accent)" : "var(--m-surface-hover)",
        justifyContent: on ? "flex-end" : "flex-start",
        transition: "background-color 0.3s ease",
      }}
    >
      <motion.span
        layout
        className="block h-[1.4cqw] w-[1.4cqw] rounded-full"
        style={{ background: on ? "var(--m-window)" : "var(--m-text)" }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
      />
    </span>
  );
}

/* ---------- Launcher ---------- */

function Launcher({ state }: { state: { text: string; result: boolean } }) {
  return (
    <motion.div
      className="theme-color absolute left-1/2 top-[22%] w-[46%] -translate-x-1/2 overflow-hidden rounded-[var(--m-rounding)] p-[0.18cqw]"
      style={{ background: "linear-gradient(135deg, var(--m-border-active), var(--m-border-active-end))", boxShadow: "0 2cqw 5cqw -1cqw rgba(0,0,0,0.7)" }}
      initial={{ opacity: 0, scale: 0.96, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, ease }}
    >
      <div
        className="theme-color flex flex-col gap-[0.6cqw] rounded-[calc(var(--m-rounding)-0.18cqw)] p-[0.8cqw] text-[1.45cqw]"
        style={{ background: "var(--m-window)" }}
      >
        <div
          className="theme-color flex h-[3cqw] items-center gap-[0.8cqw] rounded-[calc(var(--m-rounding)*0.6)] px-[1cqw]"
          style={{ background: "var(--m-surface)", color: "var(--m-text)" }}
        >
          <SearchIcon className="h-[1.5cqw] w-[1.5cqw]" style={{ color: "var(--m-dim)" }} />
          <span>{state.text}</span>
          <motion.span
            className="-ml-[0.5cqw] block h-[1.7cqw] w-[0.12cqw]"
            style={{ background: "var(--m-text)" }}
            animate={{ opacity: [1, 1, 0, 0] }}
            transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
          />
        </div>
        <AnimatePresence>
          {state.result && (
            <motion.div
              className="theme-color flex h-[3cqw] items-center gap-[0.8cqw] rounded-[calc(var(--m-rounding)*0.6)] px-[1cqw]"
              style={{ background: "color-mix(in srgb, var(--m-accent) 32%, var(--m-surface))", color: "var(--m-text)" }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "3cqw" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease }}
            >
              <EyeIcon className="h-[1.5cqw] w-[1.5cqw]" style={{ color: "var(--m-accent)" }} />
              <span className="font-medium">ESP</span>
              <span className="ml-auto text-[1.25cqw]" style={{ color: "var(--m-dim)" }}>
                Render · off
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ---------- Icons ---------- */

type IconProps = { className?: string; style?: React.CSSProperties };

export function Logo({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth="18" className={className} style={{ color: "var(--m-accent, var(--mint))", ...style }} aria-hidden>
      <rect x="47" y="47" width="105" height="105" rx="22" />
      <rect x="104" y="104" width="105" height="105" rx="22" />
    </svg>
  );
}

function MonitorIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} style={style} aria-hidden>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

function ClockIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} style={style} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ChevronIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function SearchIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={className} style={style} aria-hidden>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.5-4.5" />
    </svg>
  );
}

function EyeIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} style={style} aria-hidden>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function CategoryIcon({ kind, className, style }: IconProps & { kind: "combat" | "render" | "movement" | "player" }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "combat":
      return (
        <svg viewBox="0 0 24 24" {...common} className={className} style={style} aria-hidden>
          <circle cx="12" cy="12" r="7" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      );
    case "render":
      return <EyeIcon className={className} style={style} />;
    case "movement":
      return (
        <svg viewBox="0 0 24 24" {...common} className={className} style={style} aria-hidden>
          <path d="M5 19l4-4M14 4c3 0 6 3 6 6l-6 6-4-4 4-8z" />
        </svg>
      );
    case "player":
      return (
        <svg viewBox="0 0 24 24" {...common} className={className} style={style} aria-hidden>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      );
  }
}
