import type { MDXComponents } from "nextra/mdx-components";
import { docsComponents } from "@/components/docs/mdx";

/** The MDX components every docs page gets (Nextra looks for this file). */
export function useMDXComponents(components?: MDXComponents): MDXComponents {
  return { ...docsComponents, ...components };
}
