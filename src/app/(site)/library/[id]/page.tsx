import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddonIcon, Badge } from "@/components/LibraryList";
import { badgeText, day, latest, library, size } from "@/lib/library";

export const dynamicParams = false;

/** One page per listed addon. With none listed yet, one placeholder page so the export has a route to build. */
export function generateStaticParams() {
  const addons = library().addons;
  return addons.length > 0 ? addons.map((a) => ({ id: a.id })) : [{ id: "_" }];
}

function find(id: string) {
  return library().addons.find((a) => a.id === id);
}

export async function generateMetadata({ params }: PageProps<"/library/[id]">): Promise<Metadata> {
  const a = find((await params).id);
  if (!a) return { title: "Myriad Library", robots: { index: false } };
  return {
    title: `${a.name} · Myriad Library`,
    description: a.description || `${a.name}, an addon for Myriad in the Myriad Library.`,
    alternates: { canonical: `/library/${a.id}/` },
  };
}

export default async function AddonPage({ params }: PageProps<"/library/[id]">) {
  const a = find((await params).id);
  if (!a) notFound();
  const now = latest(a);
  return (
    <article>
      <p className="text-sm text-dim">
        <Link className="hover:text-ink" href="/library/">Myriad Library</Link> / {a.name}
      </p>

      <div className="mt-6 flex gap-5">
        <AddonIcon addon={a} className="h-16 w-16 shrink-0 text-2xl" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-3xl font-semibold sm:text-4xl">{a.name}</h1>
            <Badge kind={a.badge} />
          </div>
          <p className="mt-1 text-dim">
            {a.author ? <>by {a.author} · </> : null}
            <span className="font-mono text-sm">{a.id}</span>
          </p>
        </div>
      </div>

      {a.description && <p className="mt-6 max-w-3xl text-lg leading-relaxed text-dim">{a.description}</p>}

      <dl className="mt-8 grid max-w-3xl gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-dim">{badgeText[a.badge].label}</dt>
          <dd className="text-ink">{badgeText[a.badge].detail}</dd>
        </div>
        {now && (
          <div>
            <dt className="text-dim">Latest</dt>
            <dd className="text-ink">
              {now.version}
              {now.minecraft ? ` for Minecraft ${now.minecraft}` : ""}
              {now.added ? `, ${day(now.added)}` : ""}
            </dd>
          </div>
        )}
        {a.repo && (
          <div>
            <dt className="text-dim">{a.badge === "verified" ? "Source" : "Releases"}</dt>
            <dd>
              <a className="text-ink underline underline-offset-4 hover:text-mint" href={`https://github.com/${a.repo}`} rel="nofollow noopener">
                github.com/{a.repo}
              </a>
            </dd>
          </div>
        )}
      </dl>

      <section className="mt-10 max-w-3xl rounded-lg border border-line bg-raised p-5">
        <h2 className="font-display text-lg font-semibold">Install</h2>
        <p className="mt-2 leading-relaxed text-dim">
          In game, open <strong className="font-medium text-ink">Addons</strong> from the launcher, press{" "}
          <strong className="font-medium text-ink">Browse</strong> and search for {a.name}. Myriad checks the jar against
          its signatures before installing it, and from then on takes its updates only through the Library.
        </p>
      </section>

      {a.versions.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">Releases</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="text-dim">
                <tr className="border-b border-line">
                  <th className="py-2 pr-4 font-normal">Version</th>
                  <th className="py-2 pr-4 font-normal">Minecraft</th>
                  <th className="py-2 pr-4 font-normal">Added</th>
                  <th className="py-2 pr-4 font-normal">Size</th>
                  <th className="py-2 font-normal">SHA-256</th>
                </tr>
              </thead>
              <tbody>
                {a.versions.map((v) => (
                  <tr key={`${v.version}/${v.sha256}`} className={`border-b border-line ${v.yanked ? "text-dim" : ""}`}>
                    <td className="py-2 pr-4 font-mono">
                      <a className={`hover:text-mint ${v.yanked ? "line-through" : ""}`} href={v.url} rel="nofollow noopener">{v.version}</a>
                      {v.yanked && <span className="ml-2 font-sans">withdrawn</span>}
                    </td>
                    <td className="py-2 pr-4">{v.minecraft ?? ""}</td>
                    <td className="py-2 pr-4">{day(v.added)}</td>
                    <td className="py-2 pr-4">{size(v.size)}</td>
                    <td className="py-2 font-mono text-xs" title={v.sha256}>{v.sha256.slice(0, 16)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-dim">
            Each jar is the developer&rsquo;s own GitHub release. A withdrawn release is never offered again, and Myriad
            won&rsquo;t install it.
          </p>
        </section>
      )}
    </article>
  );
}
