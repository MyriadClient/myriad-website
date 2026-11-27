import type { Metadata } from "next";
import { getPageMap } from "nextra/page-map";
import { Search } from "@/components/docs/Search";
import { Sidebar } from "@/components/docs/Sidebar";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import "./docs.css";

export const metadata: Metadata = {
  title: { default: "Docs", template: "%s · Myriad docs" },
  description: "How to use Myriad, and how to build addons for it.",
  alternates: { types: { "text/plain": "/llms.txt" } },
};

/**
 * The docs: the site's own header (with search, and the page list in its drawer on phones), the page list on the
 * left, the page in the middle and its contents on the right. Nextra only compiles the pages and maps them.
 */
export default async function DocsLayout({ children }: LayoutProps<"/docs">) {
  const pageMap = await getPageMap("/docs");
  return (
    <>
      <Header search={<Search />} drawer={<Sidebar pageMap={pageMap} />} />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-10 px-4 sm:px-6">
        <aside className="doc-aside hidden w-60 shrink-0 md:block" data-pagefind-ignore>
          <Sidebar pageMap={pageMap} />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <Footer />
    </>
  );
}
