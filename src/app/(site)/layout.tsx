import type { Metadata, Viewport } from "next";
import { fontClasses } from "@/lib/fonts";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "Myriad",
    "Minecraft utility client",
    "Minecraft client",
    "Fabric utility mod",
    "Minecraft 26.2",
    "2b2t client",
    "Grim bypass",
    "tiling window manager",
    "Hyprland",
    "addon API",
    "open source Minecraft client",
  ],
  authors: [{ name: site.author, url: site.org }],
  creator: site.author,
  category: "technology",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: site.title,
    description: site.description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontClasses} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
