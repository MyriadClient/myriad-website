import Link from "next/link";
import type { Metadata, Viewport } from "next";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";
import { MyriadMark } from "@/components/MyriadMark";
import { fontClasses } from "@/lib/fonts";
import { site } from "@/lib/site";
import "./docs.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Docs", template: `%s · ${site.name} docs` },
  description: "How to use Myriad, and how to build addons for it: modules, settings, the menu, hooks, shared configs.",
  openGraph: { siteName: site.name, type: "website", locale: "en_US" },
};

export const viewport: Viewport = { themeColor: "#0c0c0c", colorScheme: "dark" };

const navbar = (
  <Navbar
    logo={
      <span className="docs-logo">
        <MyriadMark size={22} /> <span>Myriad</span> <span className="docs-logo-dim">docs</span>
      </span>
    }
    logoLink="/docs"
    projectLink={site.github}
  />
);

const footer = (
  <Footer>
    <span className="docs-footer">
      Myriad is free and open source. <Link href="/">myriadclient.dev</Link> · <a href={site.org}>GitHub</a> ·{" "}
      <Link href="/llms.txt">llms.txt</Link>
    </span>
  </Footer>
);

export default async function DocsLayout({ children }: LayoutProps<"/docs">) {
  return (
    <html lang="en" dir="ltr" className={fontClasses} suppressHydrationWarning>
      <Head color={{ hue: 152, saturation: 55, lightness: { dark: 67, light: 38 } }} backgroundColor={{ dark: "#0c0c0c", light: "#f6f8f7" }}>
        <link rel="alternate" type="text/plain" href="/llms.txt" title="Myriad docs for language models" />
      </Head>
      <body>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap("/docs")}
          docsRepositoryBase="https://github.com/MyriadClient/myriad-website/blob/master"
          editLink="Edit this page"
          feedback={{ content: "Something unclear? Tell us", labels: "docs" }}
          sidebar={{ defaultMenuCollapseLevel: 1, toggleButton: true }}
          nextThemes={{ defaultTheme: "dark", forcedTheme: "dark" }}
          darkMode={false}
          copyPageButton
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
