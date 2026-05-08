import type { SVGProps } from "react";

export type SidebarIconName =
  | "dashboard"
  | "courses"
  | "students"
  | "attendance"
  | "gradebook"
  | "homework"
  | "materials"
  | "chats"
  | "statistics"
  | "schedule"
  | "payment"
  | "certificates"
  | "wishlist";

type SidebarIconProps = SVGProps<SVGSVGElement> & {
  name: SidebarIconName;
};

export function SidebarIcon({ name, ...props }: SidebarIconProps) {
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
          <path d="M9 21v-6h6v6" />
        </svg>
      );
    case "courses":
      return (
        <svg {...common}>
          <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" />
          <path d="M8 17h11" />
          <path d="m13 8 .75 1.55 1.7.25-1.23 1.2.29 1.69L13 11.9l-1.51.79.29-1.69-1.23-1.2 1.7-.25L13 8Z" />
        </svg>
      );
    case "students":
      return (
        <svg {...common}>
          <path d="M16 11a3 3 0 1 0-2.6-4.5" />
          <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M2.5 19a5.5 5.5 0 0 1 11 0" />
          <path d="M13.5 14.5A5 5 0 0 1 21.5 19" />
        </svg>
      );
    case "attendance":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "gradebook":
      return (
        <svg {...common}>
          <path d="M6 3h12v18H6z" />
          <path d="M9 8h6" />
          <path d="M9 12h3" />
          <path d="M16 17h.01" />
        </svg>
      );
    case "homework":
      return (
        <svg {...common}>
          <path d="M7 4h10v16H7z" />
          <path d="M10 8h4" />
          <path d="M10 12h4" />
        </svg>
      );
    case "materials":
      return (
        <svg {...common}>
          <path d="M5 5h14v14H5z" />
          <path d="M8 9h8" />
          <path d="M8 13h6" />
        </svg>
      );
    case "chats":
      return (
        <svg {...common}>
          <path d="M4 5h16v11H8l-4 4V5Z" />
          <path d="M8 9h8" />
          <path d="M8 13h5" />
        </svg>
      );
    case "statistics":
      return (
        <svg {...common}>
          <path d="M5 20V10" />
          <path d="M12 20V4" />
          <path d="M19 20v-7" />
        </svg>
      );
    case "schedule":
      return (
        <svg {...common}>
          <path d="M6 4v3" />
          <path d="M18 4v3" />
          <path d="M4 7h16v13H4z" />
          <path d="M8 12h8" />
        </svg>
      );
    case "payment":
      return (
        <svg {...common}>
          <path d="M3 7h18v10H3z" />
          <path d="M3 10h18" />
          <path d="M7 15h3" />
        </svg>
      );
    case "certificates":
      return (
        <svg {...common}>
          <path d="M4 5h12v10H4z" />
          <path d="M8 19l2-4 2 4 2-4 2 4" />
          <path d="m17 8 1 1.5 1.8.4-1.2 1.4.2 1.8-1.8-.7-1.8.7.2-1.8-1.2-1.4 1.8-.4L17 8Z" />
        </svg>
      );
    case "wishlist":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M12 21s-7.5-4.7-9.4-9.1C1.1 8.5 3.2 5 6.8 5c2 0 3.3 1.1 4.2 2.3C11.9 6.1 13.2 5 15.2 5c3.6 0 5.7 3.5 4.2 6.9C19.5 16.3 12 21 12 21Z" />
        </svg>
      );
  }
}
