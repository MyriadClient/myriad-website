import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

/** The site's fonts, shared by the site and the docs: Bricolage for headings, IBM Plex for text and code. */
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz", "wdth"],
  display: "swap",
});

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

/** The CSS variables for all three, for the root element. */
export const fontClasses = `${bricolage.variable} ${plex.variable} ${plexMono.variable}`;
