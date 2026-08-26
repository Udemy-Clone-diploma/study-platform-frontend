import type { CSSProperties, ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  /** Fixed viewport height with its own overflow, for pages that manage internal scrolling themselves. */
  fixedHeight?: boolean;
  /** Extra styles — e.g. paddingBottom, or an override for paddingLeft/paddingRight/paddingTop. */
  style?: CSSProperties;
};

/** Shared `<main>` wrapper: sidebar-gap left/right padding + top padding, consistent across main dashboard pages. */
export function PageShell({
  children,
  className = "",
  fixedHeight = false,
  style,
}: PageShellProps) {
  return (
    <main
      className={`${fixedHeight ? "flex flex-col" : "min-h-[calc(100vh-76px)]"} ${className}`.trim()}
      style={{
        ...(fixedHeight ? { height: "calc(100vh - 76px)", overflow: "hidden" } : {}),
        paddingLeft: "var(--page-padding-x)",
        paddingRight: "var(--page-padding-x)",
        paddingTop: "var(--page-padding-y)",
        paddingBottom: "var(--page-padding-y)",
        ...style,
      }}
    >
      {children}
    </main>
  );
}
