"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

export type TocEntry = { id: string; value: ReactNode; depth: number };

/** "On this page": the page's `##` and `###` headings, the one being read marked as you scroll. */
export function Toc({ toc }: { toc: TocEntry[] }) {
  const items = useMemo(() => toc.filter((t) => t.depth <= 3), [toc]);
  const [current, setCurrent] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (items.length === 0) return;
    const headings = items.map((t) => document.getElementById(t.id)).filter((h): h is HTMLElement => !!h);
    // The current heading is the last one above a line a little below the header.
    const update = () => {
      const line = 120;
      let id = headings[0]?.id ?? null;
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= line) id = h.id;
        else break;
      }
      setCurrent(id);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [items]);

  if (items.length === 0) return null;
  return (
    <nav aria-label="On this page" className="doc-toc">
      <p className="doc-toc-title">On this page</p>
      <ul>
        {items.map((t) => (
          <li key={t.id} data-depth={t.depth}>
            <a href={`#${t.id}`} aria-current={current === t.id ? "location" : undefined}>{t.value}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** The same list for narrow screens, folded under the page title. */
export function MobileToc({ toc }: { toc: TocEntry[] }) {
  const items = toc.filter((t) => t.depth <= 3);
  if (items.length < 2) return null;
  return (
    <details className="doc-toc-mobile">
      <summary>On this page</summary>
      <ul>
        {items.map((t) => (
          <li key={t.id} data-depth={t.depth}>
            <a href={`#${t.id}`}>{t.value}</a>
          </li>
        ))}
      </ul>
    </details>
  );
}
