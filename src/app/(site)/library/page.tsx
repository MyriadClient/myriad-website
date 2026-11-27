import Link from "next/link";
import type { Metadata } from "next";
import { LibraryList } from "@/components/LibraryList";
import { library } from "@/lib/library";

export const metadata: Metadata = {
  title: "Myriad Library",
  description: "Addons for Myriad, built from their source and checked. Install them in game with Browse.",
  alternates: { canonical: "/library/" },
};

export default function LibraryPage() {
  const { open, addons } = library();
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl">Myriad Library</h1>
          <p className="mt-3 text-lg text-dim">Addons built from their source and checked. Install them in game with Browse.</p>
        </div>
        <Link href="/docs/develop/library/" className="text-sm text-dim hover:text-ink">List your addon →</Link>
      </div>
      <div className="mt-10">
        {!open ? (
          <p className="rounded-lg border border-line bg-raised p-6 text-dim">
            The Library isn&rsquo;t open yet. Developers can read{" "}
            <Link className="text-ink underline underline-offset-4 hover:text-mint" href="/docs/develop/library">
              how listing works
            </Link>{" "}
            in the meantime.
          </p>
        ) : addons.length === 0 ? (
          <p className="rounded-lg border border-line bg-raised p-6 text-dim">No addons are listed yet.</p>
        ) : (
          <LibraryList addons={addons} />
        )}
      </div>
    </>
  );
}
