"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { MenuDemo } from "@/components/MenuDemo";
import { themes } from "@/lib/themes";

export function ThemesShowcase() {
  const [active, setActive] = useState(themes[0]);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,2fr)] lg:items-start">
      <div className="flex flex-col gap-2" role="tablist" aria-label="Theme presets">
        {themes.map((t) => {
          const selected = t.id === active.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(t)}
              className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-raised"
              style={{ color: selected ? "var(--text)" : "var(--text-dim)" }}
            >
              {selected && (
                <motion.span
                  layoutId="theme-pill"
                  className="absolute inset-0 rounded-lg border border-line-strong bg-raised"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <span className="relative flex items-center gap-1">
                <span className="h-4 w-4 rounded-sm border border-white/10" style={{ background: t.window }} />
                <span className="h-4 w-4 rounded-sm" style={{ background: t.accent }} />
                <span className="h-4 w-4 rounded-sm" style={{ background: t.secondary }} />
              </span>
              <span className="relative font-medium">{t.name}</span>
              <span className="relative ml-auto text-xs text-dim">
                {t.id === "neon-blueprint" ? "user theme" : "preset"}
              </span>
            </button>
          );
        })}
        <p className="mt-3 px-3 text-sm leading-relaxed text-dim">
          Every colour, gap and curve is a setting. Edit a preset and it saves on top; make your own and
          it is one JSON file you can hand to a friend.
        </p>
      </div>
      <MenuDemo
        theme={active}
        play={false}
        label={`The Myriad menu in the ${active.name} theme.`}
      />
    </div>
  );
}
