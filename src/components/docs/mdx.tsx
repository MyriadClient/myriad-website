import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { MDXComponents } from "nextra/mdx-components";
import { Pre } from "./Pre";
import { ClientTabs, Tab } from "./Tabs";

/*
 * The docs' own MDX components: the same names and props the content already uses (Callout, Steps, Cards, Tabs, from
 * Nextra's set before), drawn in the site's style. Nextra still compiles the MDX, gives headings their ids and
 * highlights code with shiki; everything visible is here and in docs.css.
 */

function heading(Tag: "h2" | "h3" | "h4" | "h5" | "h6") {
  return function Heading({ id, children, ...props }: ComponentProps<"h2">) {
    return (
      <Tag id={id} {...props}>
        {children}
        {id && <a href={`#${id}`} className="doc-anchor" aria-label="Link to this section" data-pagefind-ignore>#</a>}
      </Tag>
    );
  };
}

function Anchor({ href = "", children, ...props }: ComponentProps<"a">) {
  // Internal pages go through Next's router; /api/ (the javadoc), files and other sites are plain links.
  if (href.startsWith("/") && !href.startsWith("/api/") && !/\.\w+$/.test(href.split(/[?#]/)[0])) {
    return <Link href={href} {...props}>{children}</Link>;
  }
  if (href.startsWith("#")) return <a href={href} {...props}>{children}</a>;
  return <a href={href} rel={href.startsWith("http") ? "noopener" : undefined} {...props}>{children}</a>;
}

export function Callout({ type = "info", children }: { type?: "info" | "warning" | "error" | "default"; emoji?: string; children: ReactNode }) {
  return (
    <div className="doc-callout" data-type={type} role={type === "warning" || type === "error" ? "note" : undefined}>
      <span className="icon doc-callout-icon" aria-hidden="true">{type === "warning" || type === "error" ? "" : ""}</span>
      <div className="doc-callout-body">{children}</div>
    </div>
  );
}

/** Numbered steps: each `###` inside is one step. */
export function Steps({ children }: { children: ReactNode }) {
  return <div className="doc-steps">{children}</div>;
}

function CardsGrid({ num = 2, children }: { num?: number; children: ReactNode }) {
  return (
    <div className="doc-cards" style={{ ["--cols" as string]: String(num) }}>
      {children}
    </div>
  );
}

function Card({ title, href, children }: { title: string; href: string; arrow?: boolean; icon?: ReactNode; children?: ReactNode }) {
  return (
    <Link href={href} className="doc-card">
      <span className="doc-card-title">
        {title}
        <span className="doc-card-arrow" aria-hidden="true">→</span>
      </span>
      {children && <span className="doc-card-text">{children}</span>}
    </Link>
  );
}

export const Cards = Object.assign(CardsGrid, { Card });

function TabsWrapper(props: { items: string[]; children: ReactNode }) {
  return <ClientTabs {...props} />;
}

export const Tabs = Object.assign(TabsWrapper, { Tab });

function DocImage({ alt = "", ...props }: ComponentProps<"img">) {
  // Docs images are small static files; there's no optimiser in a static export.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} loading="lazy" {...props} />;
}

export const docsComponents: MDXComponents = {
  h2: heading("h2"),
  h3: heading("h3"),
  h4: heading("h4"),
  h5: heading("h5"),
  h6: heading("h6"),
  a: Anchor as unknown as NonNullable<MDXComponents["a"]>,
  pre: Pre,
  table: ({ children, ...props }: ComponentProps<"table">) => (
    <div className="doc-table">
      <table {...props}>{children}</table>
    </div>
  ),
  img: DocImage as unknown as NonNullable<MDXComponents["img"]>,
  Callout,
  Steps,
  Cards,
  Tabs,
};
