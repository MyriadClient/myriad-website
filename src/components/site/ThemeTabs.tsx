"use client";

import { themes } from "@/components/ui-kit/theme";
import { setSiteTheme } from "@/lib/site-theme";

/** The client's theme presets as a row of pills; picking one themes the whole site. */
export function ThemeTabs({ current, compact = false }: { current: string; compact?: boolean }) {
  return (
    <div role="radiogroup" aria-label="Theme" className={`flex flex-wrap gap-2 ${compact ? "" : "justify-center"}`}>
      {themes.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={t.id === current}
          onClick={() => setSiteTheme(t.id)}
          className={`flex items-center gap-2 rounded-full border transition-colors ${compact ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm"} ${
            t.id === current ? "border-mint/60 bg-surface text-ink" : "border-line text-dim hover:text-ink"
          }`}
        >
          <span className="flex -space-x-1" aria-hidden="true">
            {[t.accent, t.secondary, t.text].map((c, j) => (
              <span key={j} className="h-3 w-3 rounded-full ring-2 ring-bg" style={{ background: c }} />
            ))}
          </span>
          {t.name}
        </button>
      ))}
    </div>
  );
}
