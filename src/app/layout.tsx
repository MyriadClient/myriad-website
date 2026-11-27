import type { Metadata, Viewport } from "next";
import { fontClasses } from "@/lib/fonts";
import { site } from "@/lib/site";
import { themeCss, themeScript } from "@/lib/site-theme-css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "Myriad",
    "Minecraft client",
    "Minecraft utility client",
    "Minecraft utility mod",
    "Fabric client",
    "Fabric utility mod",
    "2b2t client",
    "Grim bypass",
    "anarchy server client",
    "free Minecraft client",
    "open source Minecraft client",
    "Minecraft 26.3",
  ],
  authors: [{ name: site.author, url: site.org }],
  creator: site.author,
  category: "technology",
  openGraph: { type: "website", url: site.url, siteName: site.name, title: site.title, description: site.description, locale: "en_US" },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0c0c",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

/** Who publishes the site, and the site itself, for search engines. */
const siteLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${site.url}/#org`, name: site.name, url: site.url, logo: `${site.url}/icon.png`, sameAs: [site.org] },
    { "@type": "WebSite", "@id": `${site.url}/#site`, name: site.name, url: site.url, publisher: { "@id": `${site.url}/#org` } },
  ],
};

/** The one root layout: the site, the Library, the tutorial and the docs all share it, and its header and footer. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The saved theme goes on <html> before React runs (themeScript), so it can differ from the server's markup.
    <html lang="en" className={`${fontClasses} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body className="flex min-h-full flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }} />
        {children}
      </body>
    </html>
  );
}
