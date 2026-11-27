import Link from "next/link";
import type { Metadata } from "next";
import { CHAPTERS } from "@/components/tutorial/chapters";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tutorial: learn Myriad's menu",
  description:
    "An interactive tutorial for Myriad, the free Minecraft client: open the menu, turn modules on, use the launcher, tile windows and switch themes, step by step in your browser.",
  alternates: { canonical: "/tutorial/" },
};

/** The tutorial's front page: what it is, then its chapters. */
export default function TutorialPage() {
  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Learn Myriad's menu",
    description: metadata.description,
    tool: [{ "@type": "HowToTool", name: `Myriad for Minecraft ${site.minecraft}` }],
    step: CHAPTERS.map((c, i) => ({ "@type": "HowToStep", position: i + 1, name: c.title, text: c.summary, url: `${site.url}/tutorial/${c.slug}/` })),
  };
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-14 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />
      <h1 className="text-4xl sm:text-6xl">Learn the menu</h1>
      <p className="mt-4 max-w-xl text-lg text-dim">
        A working copy of Myriad&rsquo;s menu, in your browser. Press the real keys, or let it show you. Jump to any chapter.
      </p>
      <Link href={`/tutorial/${CHAPTERS[0].slug}/`} className="mt-8 inline-block rounded-full bg-mint px-6 py-3 font-semibold text-bg">
        Start
      </Link>
      <ol className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CHAPTERS.map((c, i) => (
          <li key={c.slug}>
            <Link href={`/tutorial/${c.slug}/`} className="block h-full rounded-xl border border-line bg-raised/60 p-5 transition-colors hover:border-mint/50">
              <span className="font-mono text-sm text-mint">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="mt-2 text-lg">{c.title}</h2>
              <p className="mt-1 text-sm text-dim">{c.summary}</p>
            </Link>
          </li>
        ))}
        <li>
          <Link href="/tutorial/cheat-sheet/" className="block h-full rounded-xl border border-line bg-raised/60 p-5 transition-colors hover:border-mint/50">
            <span className="font-mono text-sm text-mint">{String(CHAPTERS.length + 1).padStart(2, "0")}</span>
            <h2 className="mt-2 text-lg">Cheat sheet</h2>
            <p className="mt-1 text-sm text-dim">Every default key on one page.</p>
          </Link>
        </li>
      </ol>
    </main>
  );
}
