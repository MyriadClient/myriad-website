"use client";

import { ThemeTabs } from "@/components/site/ThemeTabs";
import { useSiteTheme } from "@/lib/site-theme";
import { Showcase } from "./Showcase";

/** The theme presets as tabs over a still copy of the menu. Picking one themes the whole site, as it would the game. */
export function ThemePicker() {
  const current = useSiteTheme();
  return (
    <div>
      <ThemeTabs current={current} />
      <div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-xl border border-line shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)]">
        <Showcase play={false} />
      </div>
    </div>
  );
}
