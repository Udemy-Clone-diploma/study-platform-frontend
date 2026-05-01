import type { ReactNode, CSSProperties } from "react";

type Props = {
    children: ReactNode;
    style?: CSSProperties;
    className?: string;
};

export function SectionContainer({ children, style, className = "" }: Props) {
    return (
        <div
            className={`w-[calc(100%-2rem)] max-w-[1480px] mx-auto px-4 md:px-6 xl:px-8 ${className}`}
            style={{ background: "var(--color-bg-surface)", ...style }}
        >
            {children}
        </div>
    );
}
