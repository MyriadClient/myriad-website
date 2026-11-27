/*
 * The server half of the site's themes: each theme's page colours as CSS (html[data-theme=…]), and the script that
 * puts the saved theme on <html> before the first paint, so a themed page never flashes Myriad's colours first.
 */
import { themes, type KitTheme } from "@/components/ui-kit/theme";

function vars(t: KitTheme): string {
  const v: Record<string, string> = {
    "--bg": t.page.bg,
    "--bg-raised": t.page.raised,
    "--bg-top": t.page.top,
    "--line": t.page.line,
    "--line-strong": t.page.lineStrong,
    "--surface": t.surface,
    "--surface-hover": t.surfaceHover,
    "--text": t.text,
    "--text-dim": t.dim,
    "--mint": t.accent,
    "--mint-deep": t.secondary,
    "--red": t.red,
  };
  return Object.entries(v).map(([k, x]) => `${k}:${x}`).join(";");
}

export const themeCss = themes
  .filter((t) => t.id !== "myriad")
  .map((t) => `html[data-theme="${t.id}"]{${vars(t)}}`)
  .join("\n");

const ids = JSON.stringify(themes.map((t) => t.id).filter((id) => id !== "myriad"));
export const themeScript = `try{var t=localStorage.getItem("myriad-theme");if(${ids}.indexOf(t)>=0)document.documentElement.dataset.theme=t}catch(e){}`;
