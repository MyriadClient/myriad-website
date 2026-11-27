import Link from "next/link";
import { MyriadMark } from "@/components/MyriadMark";
import { site } from "@/lib/site";
import { FooterTheme } from "./FooterTheme";

const COLUMNS: { title: string; links: { href: string; label: string; plain?: boolean }[] }[] = [
  {
    title: "Myriad",
    links: [
      { href: site.releases, label: "Download", plain: true },
      { href: "/tutorial/", label: "Tutorial" },
      { href: "/library/", label: "Library" },
      { href: site.github, label: "Source", plain: true },
    ],
  },
  {
    title: "Docs",
    links: [
      { href: "/docs/use/", label: "Using Myriad" },
      { href: "/docs/develop/", label: "Writing addons" },
      { href: "/docs/develop/library/", label: "Listing an addon" },
      { href: "/api/", label: "API reference", plain: true },
    ],
  },
  {
    title: "More",
    links: [
      { href: site.issues, label: "Issues", plain: true },
      { href: "/llms.txt", label: "llms.txt", plain: true },
      { href: "/docs/privacy/", label: "Privacy" },
      { href: "/docs/cookies/", label: "Cookies" },
    ],
  },
];

/** The one footer, on every page. */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <MyriadMark size={22} /> Myriad
          </Link>
          <p className="mt-3 max-w-xs text-sm text-dim">
            Public domain under CC0. Not affiliated with Mojang or Microsoft.
          </p>
          <div className="mt-5">
            <FooterTheme />
          </div>
        </div>
        {COLUMNS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="text-sm font-semibold text-ink">{c.title}</h2>
            <ul className="mt-3 grid gap-2 text-sm">
              {c.links.map((l) => (
                <li key={l.href}>
                  {l.plain ? (
                    <a className="text-dim transition-colors hover:text-ink" href={l.href}>{l.label}</a>
                  ) : (
                    <Link className="text-dim transition-colors hover:text-ink" href={l.href}>{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  );
}
