import Link from "next/link";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

type GradientButtonBaseProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

type GradientButtonAsButtonProps = GradientButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type GradientButtonAsLinkProps = GradientButtonBaseProps & {
  href: string;
};

type GradientButtonProps = GradientButtonAsButtonProps | GradientButtonAsLinkProps;

const baseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.625vw",
  padding: "clamp(8px, 0.52vw, 10px) clamp(18px, 1.46vw, 28px)",
  background: "var(--gradient-brand)",
  borderRadius: 28,
  fontFamily: "var(--font-accent)",
  fontWeight: 500,
  fontSize: "clamp(12px, 1.04vw, 20px)",
  lineHeight: 1.5,
  textTransform: "uppercase",
  color: "var(--color-text-primary)",
  textDecoration: "none",
  whiteSpace: "nowrap",
  transition: "opacity 0.2s, transform 0.2s",
  flexShrink: 0,
};

const disabledStyle: CSSProperties = {
  background: "var(--color-draft)",
  color: "var(--color-text-secondary)",
  cursor: "not-allowed",
};

export function GradientButton({ children, className, style, ...props }: GradientButtonProps) {
  const isDisabled = !("href" in props) && !!(props as GradientButtonAsButtonProps).disabled;
  const mergedStyle = { ...baseStyle, ...(isDisabled ? disabledStyle : {}), ...style };

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={className} style={mergedStyle}>
        {children}
      </Link>
    );
  }

  return (
    <button className={className} style={mergedStyle} {...props}>
      {children}
    </button>
  );
}
