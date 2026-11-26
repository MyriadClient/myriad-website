import Link from "next/link";
import type { Metadata } from "next";
import { LibraryList } from "@/components/LibraryList";
import { library } from "@/lib/library";

export const metadata: Metadata = {
  title: "Myriad Library",
  description: "Addons for Myriad that Myriad has checked: built from their public source, or reviewed by Myriad. Install them from Browse in the Addons window.",
  alternates: { canonical: "/library/" },
};

export default function LibraryPage() {
  const { open, addons } = library();
  return (
    <>
      <div className="max-w-3xl">
        <h1 className="text-4xl font-semibold sm:text-5xl">Myriad Library</h1>
        <p className="mt-4 text-lg leading-relaxed text-dim">
          Addons Myriad has checked. <strong className="font-medium text-ink">Verified</strong> addons are built from
          their public source and match it byte for byte; <strong className="font-medium text-ink">Reviewed</strong>{" "}
          addons are closed source and were looked over by Myriad&rsquo;s maintainer. Each release is signed by its
          developer and by the Library.
        </p>
        <p className="mt-3 leading-relaxed text-dim">
          Install them in game: open <strong className="font-medium text-ink">Addons</strong> from the launcher and press{" "}
          <strong className="font-medium text-ink">Browse</strong>. Myriad checks every signature itself before installing
          anything.
        </p>
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
