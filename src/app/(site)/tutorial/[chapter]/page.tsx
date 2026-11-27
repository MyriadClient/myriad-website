import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CHAPTERS, CHEATS } from "@/components/tutorial/chapters";
import { Player } from "@/components/tutorial/Player";

export const dynamicParams = false;

export function generateStaticParams() {
  return [...CHAPTERS.map((c) => ({ chapter: c.slug })), { chapter: "cheat-sheet" }];
}

export async function generateMetadata({ params }: PageProps<"/tutorial/[chapter]">): Promise<Metadata> {
  const { chapter } = await params;
  if (chapter === "cheat-sheet") {
    return {
      title: "Keyboard shortcuts: Myriad cheat sheet",
      description: "Every default key of Myriad's menu: workspaces, the launcher, focus, swap, float, full screen, layouts and more.",
      alternates: { canonical: "/tutorial/cheat-sheet/" },
    };
  }
  const c = CHAPTERS.find((x) => x.slug === chapter);
  if (!c) return {};
  return {
    title: `${c.title} · Myriad tutorial`,
    description: `${c.summary} An interactive step of the Myriad tutorial: try it in your browser with the real keys.`,
    alternates: { canonical: `/tutorial/${c.slug}/` },
  };
}

export default async function ChapterPage({ params }: PageProps<"/tutorial/[chapter]">) {
  const { chapter } = await params;
  if (chapter === "cheat-sheet") {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-14 sm:px-6">
        <h1 className="text-4xl sm:text-5xl">Cheat sheet</h1>
        <p className="mt-3 text-dim">The mod key is Alt unless you change it. Every key can be changed in Keybinds.</p>
        <ul className="mt-8 grid gap-x-10 sm:grid-cols-2">
          {CHEATS.map(([key, what]) => (
            <li key={key} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 text-sm">
              <span className="text-dim">{what}</span>
              <kbd>{key.replace("mod", "Alt")}</kbd>
            </li>
          ))}
        </ul>
      </main>
    );
  }
  if (!CHAPTERS.some((c) => c.slug === chapter)) notFound();
  return (
    <main className="w-full flex-1 overflow-x-clip">
      <Player slug={chapter} />
    </main>
  );
}
