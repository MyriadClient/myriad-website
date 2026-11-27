import type { Metadata } from "next";
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
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <ConfigViewer api={site.api} />
      </main>
    </>
  );
}
