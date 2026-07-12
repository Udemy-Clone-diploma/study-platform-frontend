"use client";

import Image from "next/image";
import { useState } from "react";
import {
  SidebarNavItem,
  type SidebarItem,
} from "@/features/app-shell";

type AppSidebarProps = {
  items: SidebarItem[];
};

export function AppSidebar({
  items,
}: AppSidebarProps) {
  const [isExpanded, setIsExpanded] =
    useState(false);

  return (
    <aside
      className={[
        "absolute inset-y-0 left-0 z-30 hidden overflow-y-auto overflow-x-hidden [background-image:var(--gradient-brand)] [background-size:100vw_100%] [background-position:0_0] bg-no-repeat px-[clamp(10px,0.85vw,16px)] pt-[clamp(16px,1.5vw,28px)] transition-[width] duration-200 lg:block",
        isExpanded
          ? "w-[clamp(240px,15.2vw,292px)]"
          : "w-[clamp(60px,4.5vw,80px)]",
      ].join(" ")}
    >
      <nav
        className="flex w-full flex-col gap-[clamp(16px,1.2vw,28px)] p-0"
        aria-label="Application navigation"
      >
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={isExpanded}
          onClick={() =>
            setIsExpanded((expanded) => !expanded)
          }
          className={[
            "flex h-[clamp(36px,2.5vw,48px)] w-full items-center overflow-hidden rounded-sm text-[#092878] transition-[background-color,background-image,margin,padding,width] duration-200",
            isExpanded ? "sidebar-nav-gradient-expanded" : "sidebar-nav-gradient-collapsed",
            isExpanded
              ? "-mx-[clamp(10px,0.85vw,16px)] w-[calc(100%_+_clamp(20px,1.7vw,32px))] pl-[clamp(10px,0.85vw,16px)]"
              : "",
          ].join(" ")}
        >
          <span className="flex h-[clamp(36px,2.5vw,48px)] w-[clamp(36px,2.5vw,48px)] shrink-0 items-center justify-center">
            <Image
              src="/icons/menu.svg"
              alt=""
              width={40}
              height={40}
              className="h-[clamp(28px,2.1vw,40px)] w-[clamp(28px,2.1vw,40px)] object-contain"
            />
          </span>
        </button>

        {items.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isExpanded={isExpanded}
          />
        ))}
      </nav>
    </aside>
  );
}
