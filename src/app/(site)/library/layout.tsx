import Link from "next/link";
import { Logo } from "@/components/MenuDemo";

export default function LibraryLayout({ children }: LayoutProps<"/library">) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/80 backdrop-blur">
        <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 text-ink">
            <Logo className="h-6 w-6" style={{ color: "var(--mint)" }} />
            <span className="font-display text-lg font-semibold">Myriad</span>
          </Link>
          <ul className="flex items-center gap-6 text-sm text-dim">
            <li><Link className="hover:text-ink" href="/library/">Library</Link></li>
            <li><Link className="hover:text-ink" href="/docs/develop/library">List an addon</Link></li>
            <li><Link className="hover:text-ink" href="/docs">Docs</Link></li>
          </ul>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">{children}</main>
      <footer className="border-t border-line/70">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-5 px-4 py-8 text-sm text-dim sm:px-6">
          <Link className="hover:text-ink" href="/docs/use/addons#the-myriad-library">About the Library</Link>
          <a className="hover:text-ink" href="https://github.com/MyriadClient/myriad-core/issues">Report an addon</a>
          <Link className="hover:text-ink" href="/docs/privacy">Privacy</Link>
        </div>
      </footer>
    </>
  );
}
