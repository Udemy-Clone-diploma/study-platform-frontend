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

const sizeClasses = {
  sm: "min-w-[8.4rem] px-9 py-3 text-[0.73rem] tracking-[0.32em]",
  md: "h-[52px] min-w-[200px] px-7 text-[1.25rem] tracking-normal",
};

const baseClasses =
  "inline-flex items-center justify-center rounded-full bg-[#09070a] font-[family-name:var(--font-source-code-pro)] font-medium text-white uppercase transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60";

export function AccentButton({
  children,
  className = "",
  size = "sm",
  ...props
}: AccentButtonProps) {
  const classes = `${baseClasses} ${sizeClasses[size]} ${className}`.trim();

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes} style={props.style}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
