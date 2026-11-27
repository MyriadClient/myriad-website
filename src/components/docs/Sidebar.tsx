"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { normalizePages } from "nextra/normalize-pages";
import type { PageMapItem } from "nextra";

type Item = {
  name: string;
  route: string;
  title: ReactNode;
  type: string;
  children?: Item[];
  frontMatter?: unknown;
  href?: string;
};

/** "/docs/use/menu/" → "/docs/use/menu", the form Nextra's page map uses. */
export function routeOf(path: string) {
  return path.length > 1 ? path.replace(/\/$/, "") : path;
}

/** The docs' page list, from Nextra's page map: sections fold, the current page and its section are marked. */
export function Sidebar({ pageMap, className = "" }: { pageMap: PageMapItem[]; className?: string }) {
  const route = routeOf(usePathname() ?? "/docs");
  const { docsDirectories } = normalizePages({ list: pageMap, route });
  return (
    <nav aria-label="Docs" className={`doc-sidebar ${className}`}>
      <List items={docsDirectories as unknown as Item[]} route={route} depth={0} />
    </nav>
  );
}

function List({ items, route, depth }: { items: Item[]; route: string; depth: number }) {
  return (
    <ul className={depth === 0 ? "grid gap-0.5" : "doc-sidebar-sub"}>
      {items.map((item) => (
        <Entry key={item.route || item.name} item={item} route={route} depth={depth} />
      ))}
    </ul>
  );
}

function Entry({ item, route, depth }: { item: Item; route: string; depth: number }) {
  const href = item.href ?? item.route;
  const current = route === item.route;
  const inside = !!item.route && (route === item.route || route.startsWith(item.route + "/"));
  // The section you're in starts open; on the docs' front page both top sections do.
  const [open, setOpen] = useState(inside || (depth === 0 && route === "/docs"));
  if (item.type === "separator") return <li className="doc-sidebar-sep">{item.title}</li>;

  if (item.children?.length) {
    return (
      <li>
        <div className="doc-sidebar-folder" data-inside={inside || undefined}>
          {/* The name unfolds the section too: going to its page opens it, and on its page it folds and unfolds. */}
          {"frontMatter" in item ? (
            <Link
              href={href + "/"}
              className="doc-sidebar-link flex-1"
              aria-current={current ? "page" : undefined}
              onClick={() => setOpen((o) => (current ? !o : true))}
            >
              {item.title}
            </Link>
          ) : (
            <button type="button" className="doc-sidebar-link flex-1 text-left" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              {item.title}
            </button>
          )}
          <button
            type="button"
            className="doc-sidebar-toggle"
            aria-expanded={open}
            aria-label={open ? `Fold ${String(item.title)}` : `Unfold ${String(item.title)}`}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="icon" aria-hidden="true">{open ? "" : ""}</span>
          </button>
        </div>
        {open && <List items={item.children} route={route} depth={depth + 1} />}
      </li>
    );
  }
  return (
    <li>
      <Link href={item.href ?? href + "/"} className="doc-sidebar-link" aria-current={current ? "page" : undefined}>
        {item.title}
      </Link>
    </li>
  );
}
