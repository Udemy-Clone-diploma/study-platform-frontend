import Link from "next/link";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

type AccentButtonBaseProps = {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md";
};

type AccentButtonAsButtonProps = AccentButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type AccentButtonAsLinkProps = AccentButtonBaseProps & {
  href: string;
  style?: CSSProperties;
};

type AccentButtonProps = AccentButtonAsButtonProps | AccentButtonAsLinkProps;

// All values derived from original fixed sizes at 1920px viewport
const sizeStyles: Record<"sm" | "md", CSSProperties> = {
  sm: {
    minWidth: "clamp(100px, 7vw, 134px)",
    padding: "clamp(8px, 0.625vw, 12px) clamp(20px, 1.875vw, 36px)",
    fontSize: "clamp(9px, 0.61vw, 12px)",
    letterSpacing: "0.32em",
  },
  md: {
    height: "clamp(36px, 2.71vw, 52px)",
    minWidth: "clamp(140px, 10.42vw, 200px)",
    padding: "0 clamp(16px, 1.46vw, 28px)",
    fontSize: "clamp(13px, 1.04vw, 20px)",
  },
};

const baseClasses =
  "inline-flex items-center justify-center rounded-full bg-[#09070a] font-(family-name:--font-source-code-pro) font-medium text-white uppercase transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60";

export function AccentButton({
  children,
  className = "",
  size = "sm",
  ...props
}: AccentButtonProps) {
  const classes = `${baseClasses} ${className}`.trim();

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes} style={{ ...sizeStyles[size], ...props.style }}>
        {children}
      </Link>
    );
  }

  const { style: buttonStyle, ...buttonProps } = props as AccentButtonAsButtonProps;
  return (
    <button className={classes} style={{ ...sizeStyles[size], ...buttonStyle }} {...buttonProps}>
      {children}
    </button>
  );
}