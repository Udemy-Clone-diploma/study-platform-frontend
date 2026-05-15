"use client";

import { ArrowLeft } from "lucide-react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

/** White outlined pill button with a left arrow — used for back/cancel actions. */
export function WhiteButton({ children, ...props }: Props) {
  return (
    <button
      type="button"
      {...props}
      className="inline-flex items-center justify-center transition hover:opacity-80"
      style={{
        gap: "clamp(8px, 0.69vw, 10px)",
        minWidth: "clamp(160px, 13.89vw, 200px)",
        height: "clamp(38px, 3.06vw, 44px)",
        background: "#FFFFFF",
        border: "1px solid #CACACA",
        borderRadius: 28,
        fontFamily: "var(--font-accent)",
        fontWeight: 500,
        fontSize: "clamp(14px, 1.04vw, 20px)",
        letterSpacing: "-0.011em",
        color: "var(--color-text-primary)",
        cursor: "pointer",
        padding: "clamp(3px, 0.21vw, 4px) clamp(12px, 1.11vw, 16px)",
        ...props.style,
      }}
    >
      <ArrowLeft size={20} />
      {children}
    </button>
  );
}
