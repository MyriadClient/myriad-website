/** The Library's pages, inside the shared header and footer. */
export default function LibraryLayout({ children }: LayoutProps<"/library">) {
  return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">{children}</main>;
}
