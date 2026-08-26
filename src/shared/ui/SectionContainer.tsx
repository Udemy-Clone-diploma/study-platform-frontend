import type { ReactNode, CSSProperties } from "react";

type Props = {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
};

/**
 * Page content container. Caps content at 1420px and centres it with auto
 * margins. Below 1024px the side gutter is a flat 16px (content should hug
 * the edge consistently on mobile/tablet); at 1024px+ it scales with the
 * viewport (7vw) as before.
 */
export function SectionContainer({ children, style, className = "" }: Props) {
  return (
    <div
      className={`mx-auto w-[min(1420px,calc(100%-32px))] lg:w-[min(1420px,calc(100%-max(32px,7vw)))] ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
