import type { ReactNode } from "react";

type Props = { children: ReactNode };

/** Consistent background + centered max-width wrapper for course creation pages. */
export function CourseCreationLayout({ children }: Props) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-creation)",
        minHeight: "100dvh",
        paddingBlock: "clamp(16px, 2.22vw, 32px)",
        paddingLeft: "clamp(40px, calc(-110px + 10.42vw), 90px)",
        paddingRight: "clamp(40px, calc(-110px + 10.42vw), 90px)",
      }}
    >
      <div style={{ maxWidth: "clamp(640px, 71.875vw, 1380px)", margin: "0 auto" }}>{children}</div>
    </div>
  );
}
