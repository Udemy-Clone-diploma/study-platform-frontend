import type { ReactNode } from "react";

/**
 * The authenticated shell pads <main> with a clamp(14px,1.5vw,28px) gutter on
 * every side. The learn pages render a full-bleed decorative background, so this
 * layout cancels that gutter with a matching negative margin to keep the page
 * background flush to the edges (no white strips around it).
 */
export default function LearnLayout({ children }: { children: ReactNode }) {
  return <div className="-m-[clamp(14px,1.5vw,28px)]">{children}</div>;
}
