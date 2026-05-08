"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarIcon } from "@/shared/ui/icons/SidebarIcons";
import type { SidebarItem } from "@/features/app-shell/model/types";

type SidebarNavItemProps = {
    item: SidebarItem;
};

const activeIconGradient =
    "bg-[linear-gradient(90deg,#fff4da_0%,#fcc4c3_49%,#fcc4c3_100%)]";
const activeRowGradient =
    "group-hover/sidebar:bg-[linear-gradient(90deg,#fff4da_0%,#fcc4c3_49%,#a7bafa_100%)]";
const hoverRowGradient =
    "group-hover/sidebar:hover:bg-[linear-gradient(90deg,#fff4da_0%,#fcc4c3_49%,#a7bafa_100%)]";
const expandedIconBackgroundReset = "group-hover/sidebar:!bg-none group-hover/sidebar:!bg-transparent";

export function SidebarNavItem({ item }: SidebarNavItemProps) {
    const pathname = usePathname();
    const isActive =
        item.match === "exact"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
        <Link
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={[
                "group/item flex h-10 items-center rounded-sm pl-5 text-[#092878] transition-colors duration-200",
                hoverRowGradient,
                isActive ? activeRowGradient : "",
            ].join(" ")}
        >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                <span
                    className={[
                        "flex h-7 w-7 items-center justify-center rounded-[3px]",
                        expandedIconBackgroundReset,
                        isActive ? activeIconGradient : "",
                    ].join(" ")}
                >
                    {item.iconSrc ? (
                        <Image
                            src={item.iconSrc}
                            alt=""
                            width={24}
                            height={24}
                            className="h-6 w-6 object-contain"
                        />
                    ) : (
                        <SidebarIcon name={item.icon} className="h-6 w-6" />
                    )}
                </span>
            </span>
            <span
                className="ml-2 w-0 overflow-hidden whitespace-nowrap font-mono text-base font-medium leading-5 uppercase tracking-normal opacity-0 transition-all duration-200 group-hover/sidebar:w-[200px] group-hover/sidebar:opacity-100"
            >
                {item.label}
            </span>
        </Link>
    );
}
