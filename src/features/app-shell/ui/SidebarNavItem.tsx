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

const activeIconGradient =
    "bg-[linear-gradient(90deg,#fff4da_0%,#fcc4c3_49%,#fcc4c3_100%)]";
const activeRowGradient =
    "bg-[linear-gradient(90deg,#fff4da_0%,#fcc4c3_49%,#a7bafa_100%)]";
const collapsedHoverGradient =
    "hover:bg-[linear-gradient(90deg,#fff4da_0%,#fcc4c3_49%,#fcc4c3_100%)]";
const expandedHoverGradient =
    "hover:bg-[linear-gradient(90deg,#fff4da_0%,#fcc4c3_49%,#a7bafa_100%)]";
const expandedRowLayout = "-mx-4 w-[calc(100%+2rem)] pl-4";

export function SidebarNavItem({ item, isExpanded }: SidebarNavItemProps) {
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
                "group/item flex h-12 w-full items-center overflow-hidden rounded-sm text-[#092878] transition-[background-color,background-image,margin,padding,width] duration-200",
                isExpanded ? expandedRowLayout : "",
                isExpanded ? expandedHoverGradient : collapsedHoverGradient,
                isActive ? (isExpanded ? activeRowGradient : activeIconGradient) : "",
            ].join(" ")}
        >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center">
                {item.iconSrc ? (
                    <Image
                        src={item.iconSrc}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 object-contain"
                    />
                ) : (
                    <SidebarIcon name={item.icon} width={40} height={40} className="h-10 w-10" />
                )}
            </span>
            <span
                className={[
                    "ml-3 overflow-hidden whitespace-nowrap font-mono text-base font-medium leading-5 uppercase tracking-normal transition-all duration-200",
                    isExpanded ? "w-[200px] opacity-100" : "w-0 opacity-0",
                ].join(" ")}
            >
                {item.label}
            </span>
        </Link>
    );
}
