import type { NextConfig } from "next";
import nextra from "nextra";

// The docs (src/content, served at /docs): Nextra, with Pagefind search built after export (see package.json).
const withNextra = nextra({
  contentDirBasePath: "/docs",
  defaultShowCopyCode: true,
  search: { codeblocks: true },
});

const nextConfig: NextConfig = {
  // A static site: `next build` writes out/, which the Dockerfile serves with nginx.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextra(nextConfig);
