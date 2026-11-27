"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LibraryAddon } from "@/lib/library";

/** The Library's addons with a search box; searching happens in the page, nothing is sent anywhere. */
export function LibraryList({ addons }: { addons: LibraryAddon[] }) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return addons;
    return addons.filter((a) => {
      const hay = `${a.name} ${a.id} ${a.author} ${a.description}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [addons, query]);

  return (
    <div>
      <label className="block">
        <span className="sr-only">Search the Library</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${addons.length} addon${addons.length === 1 ? "" : "s"}`}
          className="w-full rounded-md border border-line-strong bg-raised px-4 py-2.5 text-ink placeholder:text-dim focus:border-mint focus:outline-none"
        />
      </label>
      {shown.length === 0 ? (
        <p className="mt-8 text-dim">Nothing matches &ldquo;{query}&rdquo;.</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {shown.map((a) => (
            <li key={a.id}>
              <LibraryCard addon={a} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function LibraryCard({ addon: a }: { addon: LibraryAddon }) {
  const latest = a.versions.find((v) => !v.yanked);
  return (
    <Link
      href={`/library/${a.id}/`}
      className="flex h-full gap-4 rounded-lg border border-line bg-raised p-4 transition-colors hover:border-line-strong"
    >
      <AddonIcon addon={a} className="h-12 w-12 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h2 className="font-display text-lg font-semibold text-ink">{a.name}</h2>
          <Badge kind={a.badge} />
        </div>
        {a.author && <p className="text-sm text-dim">by {a.author}</p>}
        {a.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-dim">{a.description}</p>}
        {latest && (
          <p className="mt-2 font-mono text-xs text-dim">
            {latest.version}
            {latest.minecraft ? ` · Minecraft ${latest.minecraft}` : ""}
          </p>
        )}
      </div>
    </Link>
  );
}

export function Badge({ kind }: { kind: "verified" | "reviewed" }) {
  return kind === "verified" ? (
    <span title="Built from its public source and checked by Myriad" className="rounded border border-mint/40 px-1.5 py-0.5 text-xs text-mint">
      Verified
    </span>
  ) : (
    <span title="Closed source, reviewed by Myriad" className="rounded border border-line-strong px-1.5 py-0.5 text-xs text-ink">
      Reviewed
    </span>
  );
}

export function AddonIcon({ addon: a, className }: { addon: LibraryAddon; className: string }) {
  if (a.icon) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/library-icons/${a.id}.png`} alt="" width={64} height={64} className={`${className} rounded-md`} />;
  }
  return (
    <div aria-hidden className={`${className} flex items-center justify-center rounded-md border border-line-strong font-display text-lg text-dim`}>
      {a.name.slice(0, 1).toUpperCase()}
    </div>
  );
}
