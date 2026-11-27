"use client";

import { ThemeTabs } from "@/components/site/ThemeTabs";
import { useSiteTheme } from "@/lib/site-theme";

/** The footer's theme switch, so a theme picked on the home page can be changed from any page. */
export function FooterTheme() {
  return <ThemeTabs current={useSiteTheme()} compact />;
}
