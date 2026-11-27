"use client";

import { Children, useId, useState, type ReactNode } from "react";

/** Tabs over code or text; the docs write them as `<Tabs items={[...]}><Tabs.Tab>…</Tabs.Tab></Tabs>` (see mdx.tsx). */
export function ClientTabs({ items, children }: { items: string[]; children: ReactNode }) {
  const [index, setIndex] = useState(0);
  const id = useId();
  const panels = Children.toArray(children);
  return (
    <div className="doc-tabs">
      <div role="tablist" className="doc-tablist">
        {items.map((item, i) => (
          <button
            key={item}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === index}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={i === index ? 0 : -1}
            onClick={() => setIndex(i)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                const next = (i + (e.key === "ArrowRight" ? 1 : items.length - 1)) % items.length;
                setIndex(next);
                document.getElementById(`${id}-tab-${next}`)?.focus();
              }
            }}
          >
            {item}
          </button>
        ))}
      </div>
      {panels.map((panel, i) => (
        <div key={i} role="tabpanel" id={`${id}-panel-${i}`} aria-labelledby={`${id}-tab-${i}`} hidden={i !== index}>
          {panel}
        </div>
      ))}
    </div>
  );
}

/** One tab's content. */
export function Tab({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
