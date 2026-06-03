import type { ReactNode } from "react";

type Props = { children: ReactNode };

/** Consistent background + centered max-width wrapper for course creation pages. */
export function CourseCreationLayout({ children }: Props) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-creation)",
        minHeight: "100dvh",
        padding: "clamp(20px, 3.23vw, 62px) clamp(16px, 2.22vw, 40px)",
      }}
    >
      <div style={{ maxWidth: "clamp(640px, 71.875vw, 1380px)", margin: "0 auto" }}>
        {children}
      </div>
    </div>
  );
}
