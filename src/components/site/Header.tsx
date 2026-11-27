"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { MyriadMark } from "@/components/MyriadMark";
import { site } from "@/lib/site";

/** The site's sections, in the header and its drawer. `/api/` is the javadoc's own static pages, so a plain link. */
export const NAV = [
  { href: "/library/", label: "Library" },
  { href: "/tutorial/", label: "Tutorial" },
  { href: "/docs/", label: "Docs" },
  { href: "/api/", label: "API", plain: true },
] as const;

function active(path: string, href: string) {
  return path === href || path.startsWith(href) || path + "/" === href;
}

/**
 * The one header, on every page: logo, sections, GitHub and Download; a menu button and a full-height drawer below
 * `md`. Pages can hand the drawer extra content (the docs put their page list there) and a search button.
 */
export function Header({ drawer, search }: { drawer?: ReactNode; search?: ReactNode }) {
  const path = usePathname() ?? "/";
  // Open for the page it was opened on: navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === path;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => setOpenOn((typeof v === "function" ? v(open) : v) ? path : null);
  const panel = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  // The drawer is the header's sibling, not its child: the header's backdrop-filter would make it the drawer's
  // containing block and clip it to the header's height.
  // Closes on navigation, on Esc, and gives focus back to the button; the page behind doesn't scroll while it's open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenOn(null);
        button.current?.focus();
      } else if (e.key === "Tab" && panel.current) {
        const items = [...panel.current.querySelectorAll<HTMLElement>("a, button, input")];
        if (items.length === 0) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/75 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-[var(--header-h)] max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight" aria-label="Myriad home">
          <MyriadMark size={24} />
          <span className="text-[1.05rem]">Myriad</span>
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1 text-sm">
            {NAV.map((n) => {
              const on = active(path, n.href);
              const cls = `rounded-md px-3 py-1.5 transition-colors ${on ? "text-ink" : "text-dim hover:text-ink"}`;
              return (
                <li key={n.href}>
                  {"plain" in n ? (
                    <a className={cls} href={n.href}>{n.label}</a>
                  ) : (
                    <Link className={cls} href={n.href} aria-current={on ? "page" : undefined}>{n.label}</Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {search}
          <a href={site.github} className="hidden rounded-md p-2 text-dim transition-colors hover:text-ink sm:block" aria-label="Myriad on GitHub">
            <GitHubIcon />
          </a>
          <a
            href={site.releases}
            className="hidden rounded-md bg-mint px-3.5 py-1.5 text-sm font-semibold text-bg transition-colors hover:bg-[color-mix(in_srgb,var(--mint)_80%,white)] sm:block"
          >
            Download
          </a>
          <button
            ref={button}
            type="button"
            className="-mr-2 rounded-md p-2 text-dim hover:text-ink md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="site-drawer"
            onClick={() => setOpen((o) => !o)}
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

    </header>
    {open && (
      <div
        ref={panel}
        id="site-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="fixed inset-x-0 bottom-0 top-[var(--header-h)] z-40 overflow-y-auto border-t border-line bg-bg px-4 pb-10 pt-4 md:hidden"
      >
        <ul className="grid gap-1 text-lg">
          {NAV.map((n) => {
            const on = active(path, n.href);
            const cls = `block rounded-lg px-3 py-2.5 ${on ? "bg-surface text-ink" : "text-dim"}`;
            return (
              <li key={n.href}>
                {"plain" in n ? <a className={cls} href={n.href}>{n.label}</a> : <Link className={cls} href={n.href}>{n.label}</Link>}
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex gap-2">
          <a href={site.releases} className="flex-1 rounded-lg bg-mint px-4 py-2.5 text-center font-semibold text-bg">Download</a>
          <a href={site.github} className="flex items-center gap-2 rounded-lg border border-line-strong px-4 py-2.5 text-ink">
            <GitHubIcon /> GitHub
          </a>
        </div>
        {drawer && <div className="mt-6 border-t border-line pt-4">{drawer}</div>}
      </div>
    )}
    </>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}

export function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}
