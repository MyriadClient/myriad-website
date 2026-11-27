"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Hit = { url: string; title: string; excerpt: string; section?: string };

type Pagefind = {
  init(): Promise<void>;
  debouncedSearch(q: string, opts?: object, ms?: number): Promise<{ results: { data(): Promise<PagefindData> }[] } | null>;
};
type PagefindData = { url: string; meta: { title?: string }; excerpt: string; sub_results?: { title: string; url: string; excerpt: string }[] };

let loading: Promise<Pagefind | null> | null = null;

/** Pagefind's index is built after `next build` into /_pagefind; it isn't there in `next dev`. */
function pagefind(): Promise<Pagefind | null> {
  loading ??= (async () => {
    try {
      const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
      // A runtime URL the bundler mustn't try to resolve.
      const load = new Function("u", "return import(u)") as (u: string) => Promise<Pagefind>;
      const pf = await load(`${base}/_pagefind/pagefind.js`);
      await pf.init();
      return pf;
    } catch {
      return null;
    }
  })();
  return loading;
}

/** Pagefind's excerpts are escaped text with <mark> around matches; keep only those marks. */
function excerpt(html: string) {
  return html.replace(/<(?!\/?mark>)[^>]*>/g, "");
}

function clean(url: string) {
  return url.replace(/\.html$/, "/").replace(/\/index\/$/, "/");
}

/**
 * Docs search, drawn like Myriad's launcher: Ctrl+K or / opens it, the arrows or Ctrl+J/K move, Enter goes, Esc
 * closes. Results come from the Pagefind index of the built site.
 */
export function Search() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{ query: string; hits: Hit[] }>({ query: "", hits: [] });
  const [selected, setSelected] = useState(0);
  const [state, setState] = useState<"idle" | "loading" | "missing">("idle");
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setFound({ query: "", hits: [] });
    setSelected(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Results belong to the query they were found for, so a stale or empty query shows none.
  const hits = query.trim() && found.query === query ? found.hits : [];

  useEffect(() => {
    if (!open || !query.trim()) return;
    let live = true;
    pagefind().then(async (pf) => {
      if (!pf) {
        if (live) setState("missing");
        return;
      }
      const found = await pf.debouncedSearch(query, {}, 120);
      if (!found || !live) return;
      const data = await Promise.all(found.results.slice(0, 8).map((r) => r.data()));
      if (!live) return;
      const out: Hit[] = [];
      for (const d of data) {
        const sub = d.sub_results?.find((s) => s.url !== d.url && s.url.includes("#"));
        out.push({ url: clean(sub?.url ?? d.url), title: d.meta.title ?? d.url, section: sub?.title, excerpt: excerpt(sub?.excerpt ?? d.excerpt) });
      }
      setFound({ query, hits: out });
      setSelected(0);
      setState("idle");
    });
    return () => {
      live = false;
    };
  }, [query, open]);

  function go(hit: Hit | undefined) {
    if (!hit) return;
    close();
    router.push(hit.url);
  }

  return (
    <>
      <button type="button" className="doc-search-button" onClick={() => setOpen(true)} aria-label="Search the docs">
        <span className="icon" aria-hidden="true">{""}</span>
        <span className="hidden lg:inline">Search</span>
        <kbd className="hidden lg:inline">Ctrl K</kbd>
      </button>
      {open && (
        <div className="launcher-scrim" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div className="launcher" role="dialog" aria-modal="true" aria-label="Search the docs">
            <div className="launcher-head">
              <span className="icon launcher-icon" aria-hidden="true">{""}</span>
              <input
                ref={input}
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setState("loading");
                }}
                placeholder="Search the docs…"
                aria-label="Search the docs"
                aria-controls="search-results"
                aria-activedescendant={hits[selected] ? `hit-${selected}` : undefined}
                onKeyDown={(e) => {
                  const down = e.key === "ArrowDown" || (e.ctrlKey && e.key === "j");
                  const up = e.key === "ArrowUp" || (e.ctrlKey && e.key === "k");
                  if (down || up) {
                    e.preventDefault();
                    if (hits.length) setSelected((s) => (s + (down ? 1 : hits.length - 1)) % hits.length);
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    go(hits[selected]);
                  } else if (e.key === "Escape") {
                    close();
                  }
                }}
              />
            </div>
            {query.trim() && (
              <ul id="search-results" role="listbox" className="launcher-list">
                {hits.map((h, i) => (
                  <li
                    key={h.url + i}
                    id={`hit-${i}`}
                    role="option"
                    aria-selected={i === selected}
                    className="launcher-row"
                    onMouseEnter={() => setSelected(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      go(h);
                    }}
                  >
                    <span className="icon launcher-icon" aria-hidden="true">{h.section ? "" : ""}</span>
                    <span className="min-w-0 flex-1">
                      <span className="launcher-title">
                        {h.title}
                        {h.section && <span className="text-dim"> · {h.section}</span>}
                      </span>
                      <span className="launcher-excerpt" dangerouslySetInnerHTML={{ __html: h.excerpt }} />
                    </span>
                  </li>
                ))}
                {hits.length === 0 && (
                  <li className="launcher-empty">
                    {state === "missing" ? "Search works on the built site." : state === "loading" ? "Searching…" : "Nothing found."}
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
