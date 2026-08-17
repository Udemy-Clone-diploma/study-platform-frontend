"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UserRole } from "@/entities/user";
import type { SidebarItem } from "@/features/app-shell";
import { SidebarIcon } from "@/shared/ui/icons/SidebarIcons";
import { getBottomNavSplit, OTHERS_HREF } from "./model/bottomNavConfig";

type Props = {
  role: UserRole;
  items: SidebarItem[];
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontSize: "clamp(10px, calc(8.47px + 0.39vw), 12px)",
  lineHeight: "13px",
};

const ICON_SIZE = "clamp(2.5rem, 12.8vw, 3rem)";

function isItemActive(item: SidebarItem, pathname: string): boolean {
  return item.match === "exact"
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavSlot({
  href,
  active,
  label,
  children,
  onClick,
}: {
  href: string;
  active: boolean;
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className="flex flex-1 flex-col items-center gap-1 text-(--color-blue-dark)"
    >
      <span
        className="flex items-center justify-center rounded-[4px] p-1"
        style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          ...(active ? { backgroundImage: "var(--gradient-bottom-nav-active)" } : {}),
        }}
      >
        {children}
      </span>
      <span style={labelStyle} className="max-w-full truncate">
        {label}
      </span>
    </Link>
  );
}

export function BottomNav({ role, items }: Props) {
  const t = useTranslations("AppSidebar");
  const pathname = usePathname();
  const { primary, overflow } = getBottomNavSplit(role, items);
  const othersActive =
    pathname.startsWith(OTHERS_HREF) || overflow.some((item) => isItemActive(item, pathname));

  return (
    <nav
      aria-label={t("primaryNavAriaLabel")}
      className="fixed inset-x-0 bottom-0 z-40 flex items-start justify-between lg:hidden"
      style={{
        background: "var(--color-brand-lavender)",
        minHeight: 103,
        paddingTop: 8,
        paddingBottom: "env(safe-area-inset-bottom)",
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        paddingInline: 4,
      }}
    >
      {primary.map((item) => (
        <NavSlot
          key={item.id}
          href={item.href}
          active={isItemActive(item, pathname)}
          label={item.label}
          onClick={
            item.id === "chats"
              ? () => window.dispatchEvent(new Event("chat:list-requested"))
              : undefined
          }
        >
          {item.iconSrc ? (
            <Image
              src={item.iconSrc}
              alt=""
              width={40}
              height={40}
              className="object-contain"
              style={{ width: "83%", height: "83%" }}
            />
          ) : (
            <SidebarIcon
              name={item.icon}
              width={40}
              height={40}
              style={{ width: "83%", height: "83%" }}
            />
          )}
        </NavSlot>
      ))}

      <NavSlot href={OTHERS_HREF} active={othersActive} label={t("others")}>
        <MoreHorizontal style={{ width: "83%", height: "83%" }} aria-hidden />
      </NavSlot>
    </nav>
  );
}
