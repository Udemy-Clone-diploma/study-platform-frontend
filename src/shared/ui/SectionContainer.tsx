import type { ReactNode, CSSProperties } from "react";

type Props = {
    children: ReactNode;
    style?: CSSProperties;
    className?: string;
};

/**
 * Page content container. Caps content at 1420px and centres it with auto
 * margins. Side gutters scale with the viewport (5vw) but are clamped to a
 * minimum of 16px so small screens always have breathing room.
 */
export function SectionContainer({ children, style, className = "" }: Props) {
    return (
        <div
            className={className}
            style={{
                width: "min(1420px, 100% - max(32px, 7vw))",
                marginInline: "auto",
                ...style,
            }}
        >
            {children}
        </div>
    );
}
