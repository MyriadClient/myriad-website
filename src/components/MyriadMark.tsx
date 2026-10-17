import { logoFirst, logoSecond, logoStroke } from "@/lib/logo";

/** The Myriad mark (two interlocking squares) in mint, at any size. */
export function MyriadMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="40 40 176 176" fill="none" aria-hidden="true" className={className}>
      <path d={logoFirst} stroke="#7fd8ae" strokeWidth={logoStroke} strokeLinecap="round" />
      <path d={logoSecond} stroke="#7fd8ae" strokeWidth={logoStroke} strokeLinecap="round" />
    </svg>
  );
}
