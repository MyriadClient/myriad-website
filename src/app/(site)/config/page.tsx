import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/MenuDemo";
import { ConfigViewer } from "@/components/ConfigViewer";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shared config",
  description: "A Myriad config someone shared: its modules, settings, control panels and theme, as they look in the menu.",
  robots: { index: false, follow: true },
};

/**
 * One page for every share: nginx serves it for /config/<code> (and `next dev` for /config/?code=<code>), and the
 * viewer reads the code from the address and fetches the share from Myriad's API.
 */
export default function ConfigPage() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/80 backdrop-blur">
        <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 text-ink">
            <Logo className="h-6 w-6" style={{ color: "var(--mint)" }} />
            <span className="font-display text-lg font-semibold">Myriad</span>
          </Link>
          <ul className="flex items-center gap-6 text-sm text-dim">
            <li><Link className="hover:text-ink" href="/docs/use/sharing">About sharing</Link></li>
            <li><Link className="hover:text-ink" href="/docs">Docs</Link></li>
          </ul>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <ConfigViewer api={site.api} />
      </main>
    </>
  );
}
