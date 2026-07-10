import type { CSSProperties, ReactNode } from "react";

/** Left/right gap between the sidebar and page content, shared by every main dashboard page. */
export const SIDEBAR_GAP = "clamp(40px, calc(-110px + 10.42vw), 90px)";
/** Top/bottom padding shared by every main dashboard page. */
export const PAGE_PADDING_TOP = "clamp(16px, 3.06vw, 44px)";
export const PAGE_PADDING_BOTTOM = PAGE_PADDING_TOP;

type PageShellProps = {
  children: ReactNode;
  className?: string;
  /** Fixed viewport height with its own overflow, for pages that manage internal scrolling themselves. */
  fixedHeight?: boolean;
  /** Extra styles — e.g. paddingBottom, or an override for paddingLeft/paddingRight/paddingTop. */
  style?: CSSProperties;
};

/** Shared `<main>` wrapper: sidebar-gap left/right padding + top padding, consistent across main dashboard pages. */
export function PageShell({ children, className = "", fixedHeight = false, style }: PageShellProps) {
  return (
    <main
      className={`${fixedHeight ? "flex flex-col" : "min-h-[calc(100vh-76px)]"} ${className}`.trim()}
      style={{
        ...(fixedHeight ? { height: "calc(100vh - 76px)", overflow: "hidden" } : {}),
        paddingLeft: SIDEBAR_GAP,
        paddingRight: SIDEBAR_GAP,
        paddingTop: PAGE_PADDING_TOP,
        paddingBottom: PAGE_PADDING_BOTTOM,
        ...style,
      }}
    >
      {children}
    </main>
  );
}
