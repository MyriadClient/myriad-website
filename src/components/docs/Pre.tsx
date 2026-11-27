"use client";

import { useRef, useState, type ComponentProps } from "react";

/** A highlighted code block (shiki's output) with its language and a copy button. */
export function Pre({ children, className, ...props }: ComponentProps<"pre"> & { "data-language"?: string }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const language = props["data-language"];

  async function copy() {
    const text = ref.current?.querySelector("code")?.innerText ?? ref.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text.replace(/\n$/, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // No clipboard (insecure context): the code can still be selected by hand.
    }
  }

  return (
    <div className="doc-pre group">
      {language && language !== "text" && language !== "plaintext" && <span className="doc-pre-lang" data-pagefind-ignore>{language}</span>}
      <button type="button" className="doc-pre-copy" data-pagefind-ignore onClick={copy} aria-label={copied ? "Copied" : "Copy code"}>
        {copied ? "Copied" : "Copy"}
      </button>
      <pre ref={ref} className={className} tabIndex={0} {...props}>
        {children}
      </pre>
    </div>
  );
}
