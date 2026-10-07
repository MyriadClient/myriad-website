"use client";

import { motion, useReducedMotion } from "motion/react";

/*
 * Small one-shot illustrations for the feature list. Each plays once when scrolled into view
 * and then rests in its final state. With reduced motion they render the final state only.
 */

const ease = [0.22, 1, 0.36, 1] as const;
const once = { once: true, amount: 0.6 } as const;

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative h-24 w-full overflow-hidden rounded-lg border border-line bg-raised ${className}`}
    >
      {children}
    </div>
  );
}

/** Four windows: one opens, then splits Dwindle-style until a 2x2 grid stands. */
export function TilingVignette() {
  const reduce = useReducedMotion();
  const tiles = [
    { final: { left: "0%", top: "0%", width: "50%", height: "50%" }, steps: ["0% 0% 100% 100%", "0% 0% 50% 100%", "0% 0% 50% 100%", "0% 0% 50% 50%"] },
    { final: { left: "50%", top: "0%", width: "50%", height: "50%" }, steps: ["50% 0% 50% 100%", "50% 0% 50% 100%", "50% 0% 50% 50%", "50% 0% 50% 50%"] },
    { final: { left: "50%", top: "50%", width: "50%", height: "50%" }, steps: ["50% 50% 50% 50%", "50% 50% 50% 50%", "50% 50% 50% 50%", "50% 50% 50% 50%"] },
    { final: { left: "0%", top: "50%", width: "50%", height: "50%" }, steps: ["0% 50% 50% 50%", "0% 50% 50% 50%", "0% 50% 50% 50%", "0% 50% 50% 50%"] },
  ];
  const parse = (s: string) => {
    const [left, top, width, height] = s.split(" ");
    return { left, top, width, height };
  };
  return (
    <Frame className="p-1.5">
      <div className="relative h-full w-full">
        {tiles.map((t, i) => (
          <motion.div
            key={i}
            className="absolute p-[3px]"
            initial={reduce ? t.final : { ...parse(t.steps[0]), opacity: 0 }}
            whileInView={
              reduce
                ? t.final
                : {
                    left: t.steps.slice(i).map(parse).map((r) => r.left),
                    top: t.steps.slice(i).map(parse).map((r) => r.top),
                    width: t.steps.slice(i).map(parse).map((r) => r.width),
                    height: t.steps.slice(i).map(parse).map((r) => r.height),
                    opacity: 1,
                  }
            }
            viewport={once}
            transition={{ duration: 0.6 * (4 - i), delay: 0.3 + i * 0.6, ease }}
          >
            <div className={`h-full w-full rounded-[5px] border ${i === 3 ? "border-lavender" : "border-line-strong"} bg-bg`} />
          </motion.div>
        ))}
      </div>
    </Frame>
  );
}

/** The launcher: type four letters, one result lights up. */
export function LauncherVignette() {
  const reduce = useReducedMotion();
  const word = "kill";
  return (
    <Frame className="flex flex-col justify-center gap-2 px-5">
      <div className="flex h-8 items-center gap-2 rounded-md bg-bg px-3 font-mono text-sm text-ink">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-dim" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="11" cy="11" r="6" />
          <path d="M20 20l-4.5-4.5" />
        </svg>
        <span className="flex">
          {word.split("").map((c, i) => (
            <motion.span
              key={i}
              initial={reduce ? { opacity: 1 } : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={once}
              transition={{ duration: 0.01, delay: 0.5 + i * 0.14 }}
            >
              {c}
            </motion.span>
          ))}
        </span>
      </div>
      <motion.div
        className="flex h-8 items-center justify-between rounded-md border-l-2 border-lavender bg-lavender/15 px-3 text-sm text-ink"
        initial={reduce ? { opacity: 1 } : { opacity: 0, y: -4 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={once}
        transition={{ duration: 0.3, delay: 1.2, ease }}
      >
        <span>Kill Aura</span>
        <span className="text-xs text-dim">Combat · Enter toggles</span>
      </motion.div>
    </Frame>
  );
}

/** One window, re-coloured through the presets. */
export function ThemeVignette() {
  const reduce = useReducedMotion();
  const bgs = ["#1f2232", "#1a1b26", "#282828", "#0a1220", "#1f2232"];
  const accents = ["#9d97e3", "#7aa2f7", "#fabd2f", "#39ff14", "#9d97e3"];
  const radii = [6, 6, 4, 0, 6];
  return (
    <Frame className="flex items-center justify-center">
      <motion.div
        className="flex h-16 w-44 flex-col overflow-hidden border"
        initial={{ backgroundColor: bgs[0], borderColor: accents[0], borderRadius: radii[0] }}
        whileInView={reduce ? {} : { backgroundColor: bgs, borderColor: accents, borderRadius: radii }}
        viewport={once}
        transition={{ duration: 4, delay: 0.4, ease: "easeInOut", times: [0, 0.3, 0.55, 0.8, 1] }}
      >
        <div className="h-4 w-full bg-black/25" />
        <div className="flex flex-col gap-1.5 p-2">
          {[0.7, 0.45].map((w, i) => (
            <motion.div
              key={i}
              className="h-3 rounded-sm"
              style={{ width: `${w * 100}%` }}
              initial={{ backgroundColor: accents[0] }}
              whileInView={reduce ? {} : { backgroundColor: accents }}
              viewport={once}
              transition={{ duration: 4, delay: 0.4, ease: "easeInOut", times: [0, 0.3, 0.55, 0.8, 1] }}
            />
          ))}
        </div>
      </motion.div>
    </Frame>
  );
}

/** Packets landing on tick marks, in order, then the check. */
export function GrimVignette() {
  const reduce = useReducedMotion();
  const ticks = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <Frame className="flex items-center px-6">
      <div className="relative h-10 flex-1">
        <div className="absolute inset-x-0 top-1/2 h-px bg-line-strong" />
        {ticks.map((t) => (
          <div key={t} className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-line-strong" style={{ left: `${(t / 7) * 100}%` }} />
        ))}
        {[1, 3, 4, 6].map((t, i) => (
          <motion.div
            key={t}
            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint"
            style={{ left: `${(t / 7) * 100}%` }}
            initial={reduce ? { opacity: 1, y: "-50%" } : { opacity: 0, y: "-220%" }}
            whileInView={{ opacity: 1, y: "-50%" }}
            viewport={once}
            transition={{ type: "spring", stiffness: 380, damping: 26, delay: 0.4 + i * 0.35 }}
          />
        ))}
      </div>
      <svg viewBox="0 0 24 24" className="ml-5 h-6 w-6 text-mint" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <motion.path
          d="M4 12.5l5 5L20 7"
          initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={once}
          transition={{ duration: 0.45, delay: 2, ease }}
        />
      </svg>
    </Frame>
  );
}

/** The profiler: most modules cost nothing; one shows up. */
export function ProfilerVignette() {
  const reduce = useReducedMotion();
  const rows: [string, number][] = [
    ["ESP", 0.08],
    ["Nametags", 0.05],
    ["Kill Aura", 0.02],
    ["Scaffold", 0.0],
    ["Some addon", 0.62],
  ];
  return (
    <Frame className="flex flex-col justify-center gap-1.5 px-5">
      {rows.map(([name, v], i) => (
        <div key={name} className="flex items-center gap-3 text-[11px] leading-none text-dim">
          <span className="w-16 truncate">{name}</span>
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-bg">
            <motion.div
              className={`absolute inset-y-0 left-0 rounded-full ${v > 0.3 ? "bg-lavender" : "bg-mint/70"}`}
              style={{ width: `${Math.max(v * 100, 1)}%`, transformOrigin: "left" }}
              initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={once}
              transition={{ duration: 0.7, delay: 0.3 + i * 0.1, ease }}
            />
          </div>
        </div>
      ))}
    </Frame>
  );
}

/** Two squares interlock: the logo, drawn as an addon docking into the core. */
export function AddonVignette() {
  const reduce = useReducedMotion();
  // The sliding square starts outside the svg's box, so the in-view trigger sits on the svg itself.
  return (
    <Frame className="flex items-center justify-center">
      <motion.svg
        viewBox="0 0 256 200"
        className="h-20 w-auto"
        fill="none"
        strokeWidth="14"
        strokeLinejoin="round"
        initial={reduce ? "shown" : "hidden"}
        whileInView="shown"
        viewport={once}
      >
        <rect x="47" y="20" width="105" height="105" rx="22" className="stroke-mint" />
        <motion.rect
          y="77"
          width="105"
          height="105"
          rx="22"
          className="stroke-lavender"
          variants={{ hidden: { attrX: 200, opacity: 0 }, shown: { attrX: 104, opacity: 1 } }}
          transition={{ type: "spring", stiffness: 160, damping: 22, delay: 0.5 }}
        />
        {/* the mint square's bottom edge passes in front of the lavender one's left edge, as in the icon */}
        <motion.path
          d="M90 125 H118"
          className="stroke-mint"
          variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 } }}
          transition={{ duration: 0.2, delay: 1 }}
        />
      </motion.svg>
    </Frame>
  );
}
