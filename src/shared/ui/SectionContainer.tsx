import type { ReactNode, CSSProperties } from "react";

type Props = {
    children: ReactNode;
    style?: CSSProperties;
    className?: string;
};

export function SectionContainer({ children, style, className = "" }: Props) {
    return (
        <div
            className={className}
            style={{
                width: "100%",
                paddingLeft: "max(16px, calc((100vw - 1420px) / 2))",
                paddingRight: "max(16px, calc((100vw - 1420px) / 2))",
                ...style,
            }}
        >
            {children}
        </div>
    );
}
