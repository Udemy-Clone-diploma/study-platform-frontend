import type { ReactNode, CSSProperties } from "react";

type Props = {
    children: ReactNode;
    style?: CSSProperties;
    className?: string;
};

/**
 * Page content container. Caps the body at 1420px and centres it with auto
 * margins, so a 1920px screen yields 250px gutters on each side. Below the
 * design width the body shrinks with a 16px safety gutter on each side.
 */
export function SectionContainer({ children, style, className = "" }: Props) {
    return (
        <div
            className={className}
            style={{
                width: "min(1420px, 100% - 32px)",
                marginInline: "auto",
                ...style,
            }}
        >
            {children}
        </div>
    );
}
