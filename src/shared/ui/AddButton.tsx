import Image from "next/image";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface AddButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

/** Gradient pill "Add" button matching the "Add Course" design on the my-courses page. */
export function AddButton({ children, style, ...props }: AddButtonProps) {
  return (
    <button
      type="button"
      {...props}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "clamp(6px, 0.52vw, 10px)",
        background: "var(--gradient-brand)",
        border: "none",
        borderRadius: 999,
        padding: "clamp(6px, 0.42vw, 9px) clamp(14px, 1.04vw, 20px)",
        fontFamily: "var(--font-accent)",
        fontWeight: 500,
        fontSize: "clamp(11px, 0.76vw, 14px)",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: "var(--color-text-primary)",
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.5 : 1,
        whiteSpace: "nowrap",
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
      <Image src="/icons/add.svg" alt="" width={20} height={20} aria-hidden="true" />
    </button>
  );
}
