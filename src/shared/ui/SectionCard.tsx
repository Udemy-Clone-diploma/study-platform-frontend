import type { CSSProperties, ReactNode } from "react";

type Props = {
  children: ReactNode;
  style?: CSSProperties;
};

/** Bordered white card without shadow — use as an inner section container. */
export function SectionCard({ children, style }: Props) {
  return (
    <div
      style={{
        border: "2px solid var(--color-border-light)",
        borderRadius: 16,
        padding: "clamp(20px, 2.08vw, 40px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
