import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

/** The site's pages (landing, Library, tutorial, shared configs): the shared header and footer around them. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
