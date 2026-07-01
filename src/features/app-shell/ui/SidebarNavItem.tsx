"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarIcon } from "@/shared/ui/icons/SidebarIcons";
import type { SidebarItem } from "@/features/app-shell/model/types";

type SidebarNavItemProps = {
  item: SidebarItem;
  isExpanded: boolean;
};

const expandedRowLayout =
  "-mx-[clamp(10px,0.85vw,16px)] w-[calc(100%_+_clamp(20px,1.7vw,32px))] pl-[clamp(10px,0.85vw,16px)]";

export function SidebarNavItem({
  item,
  isExpanded,
}: SidebarNavItemProps) {
  const pathname = usePathname();

  const isActive =
    item.match === "exact"
      ? pathname === item.href
      : pathname === item.href ||
        pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={[
        "group/item flex h-[clamp(28px,2.2vw,48px)] w-full items-center overflow-hidden rounded-sm text-[#092878] transition-[background-color,background-image,margin,padding,width] duration-200",
        isExpanded ? "sidebar-nav-gradient-expanded" : "sidebar-nav-gradient-collapsed",
        isExpanded ? expandedRowLayout : "",
      ].join(" ")}
    >
      <span className="flex h-[clamp(28px,2.2vw,48px)] w-[clamp(36px,2.2vw,48px)] shrink-0 items-center justify-center">
        {item.iconSrc ? (
          <Image
            src={item.iconSrc}
            alt=""
            width={40}
            height={40}
            className="h-[clamp(28px,2.1vw,40px)] w-[clamp(28px,2.1vw,40px)] object-contain"
          />
        ) : (
          <SidebarIcon
            name={item.icon}
            width={40}
            height={40}
            className="h-[clamp(28px,2.1vw,40px)] w-[clamp(28px,2.1vw,40px)]"
          />
        )}
      </span>

      <span
        className={[
          "ml-[clamp(10px,0.8vw,14px)] overflow-hidden whitespace-nowrap font-mono text-[clamp(13px,0.9vw,16px)] font-medium uppercase tracking-normal transition-all duration-200",
          isExpanded
            ? "w-[clamp(140px,10vw,200px)] opacity-100"
            : "w-0 opacity-0",
        ].join(" ")}
      >
        {item.label}
      </span>
    </Link>
  );
}
