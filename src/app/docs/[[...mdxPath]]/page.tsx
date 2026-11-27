import Link from "next/link";
import { normalizePages } from "nextra/normalize-pages";
import { getPageMap } from "nextra/page-map";
import { generateStaticParamsFor, importPage } from "nextra/pages";
import { MobileToc, Toc, type TocEntry } from "@/components/docs/Toc";
import { useMDXComponents as getMDXComponents } from "@/mdx-components";

export const generateStaticParams = generateStaticParamsFor("mdxPath");

export async function generateMetadata(props: PageProps<"/docs/[[...mdxPath]]">) {
  const params = await props.params;
  const { metadata } = await importPage(params.mdxPath);
  const path = "/docs" + (params.mdxPath?.length ? "/" + params.mdxPath.join("/") : "") + "/";
  return { ...metadata, alternates: { canonical: path } };
}

const components = getMDXComponents();
const REPO = "https://github.com/MyriadClient/myriad-website/blob/master/";

type Flat = { route: string; title: string };

export default async function Page(props: PageProps<"/docs/[[...mdxPath]]">) {
  const params = await props.params;
  const { default: MDXContent, toc, metadata } = await importPage(params.mdxPath);
  const route = "/docs" + (params.mdxPath?.length ? "/" + params.mdxPath.join("/") : "");
  const { activePath, flatDocsDirectories, activeIndex } = normalizePages({ list: await getPageMap("/docs"), route });
  const flat = flatDocsDirectories as unknown as Flat[];
  const here = flat[activeIndex]?.route === route;
  const prev = here ? flat[activeIndex - 1] : undefined;
  const next = here ? flat[activeIndex + 1] : undefined;
  const trail = (activePath as unknown as Flat[]).slice(0, -1);
  const entries = toc as unknown as TocEntry[];
  const filePath = (metadata as { filePath?: string }).filePath;

  return (
    <div className="flex gap-10">
      <article className="doc min-w-0 flex-1 pb-16 pt-8" data-pagefind-body>
        {trail.length > 0 && (
          <nav aria-label="Breadcrumb" className="doc-trail" data-pagefind-ignore>
            {trail.map((t) => (
              <span key={t.route}>
                <Link href={t.route + "/"}>{t.title}</Link>
                <span aria-hidden="true"> / </span>
              </span>
            ))}
          </nav>
        )}
        <div className="xl:hidden" data-pagefind-ignore>
          <MobileToc toc={entries} />
        </div>
        <MDXContent {...props} params={params} components={components} />

        <footer className="doc-foot" data-pagefind-ignore>
          {filePath && (
            <a className="doc-edit" href={REPO + filePath}>
              <span className="icon" aria-hidden="true">{""}</span> Edit this page
            </a>
          )}
          <div className="doc-pager">
            {prev ? (
              <Link href={prev.route + "/"} className="doc-pager-link">
                <span className="doc-pager-dir">Previous</span>
                <span>{prev.title}</span>
              </Link>
            ) : <span />}
            {next && (
              <Link href={next.route + "/"} className="doc-pager-link text-right">
                <span className="doc-pager-dir">Next</span>
                <span>{next.title}</span>
              </Link>
            )}
          </div>
        </footer>
      </article>
      <aside className="doc-aside hidden w-56 shrink-0 xl:block" data-pagefind-ignore>
        <Toc toc={entries} />
      </aside>
    </div>
  );
}
