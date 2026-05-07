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
                paddingLeft: "13vw", 
                paddingRight: "13vw",
                ...style,
            }}
        >
            {children}
        </div>
    );
}
