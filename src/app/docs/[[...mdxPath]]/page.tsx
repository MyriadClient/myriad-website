import { generateStaticParamsFor, importPage } from "nextra/pages";
import { useMDXComponents as getMDXComponents } from "@/mdx-components";

export const generateStaticParams = generateStaticParamsFor("mdxPath");

export async function generateMetadata(props: PageProps<"/docs/[[...mdxPath]]">) {
  const params = await props.params;
  const { metadata } = await importPage(params.mdxPath);
  return metadata;
}

// The docs theme always provides the wrapper (the page with its table of contents).
const Wrapper = getMDXComponents().wrapper!;

export default async function Page(props: PageProps<"/docs/[[...mdxPath]]">) {
  const params = await props.params;
  const { default: MDXContent, toc, metadata, sourceCode } = await importPage(params.mdxPath);
  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}
