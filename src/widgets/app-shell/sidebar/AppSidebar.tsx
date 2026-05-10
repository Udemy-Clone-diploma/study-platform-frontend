"use client";

import Image from "next/image";
import { useState } from "react";
import { SidebarNavItem } from "@/features/app-shell/ui/SidebarNavItem";
import type { SidebarItem } from "@/features/app-shell/model/types";

type AppSidebarProps = {
  items: SidebarItem[];
};

export function AppSidebar({ items }: AppSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside
      className={[
        "z-30 shrink-0 self-stretch overflow-hidden bg-[#A7BAFA] px-4 pt-[28px] transition-[width] duration-200",
        isExpanded ? "w-[292px]" : "w-20",
      ].join(" ")}
    >
      <nav className="flex w-full flex-col gap-[28px] p-0" aria-label="Application navigation">
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((expanded) => !expanded)}
          className={[
            "flex h-12 w-full items-center overflow-hidden rounded-sm text-[#092878] transition-[background-color,background-image,margin,padding,width] duration-200",
            isExpanded
              ? "-mx-4 w-[calc(100%+2rem)] pl-4 hover:bg-[linear-gradient(90deg,#fff4da_0%,#fcc4c3_49%,#a7bafa_100%)]"
              : "hover:bg-[linear-gradient(90deg,#fff4da_0%,#fcc4c3_49%,#fcc4c3_100%)]",
          ].join(" ")}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center">
            <Image src="/icons/menu.svg" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
          </span>
        </button>

        {items.map((item) => (
          <SidebarNavItem key={item.id} item={item} isExpanded={isExpanded} />
        ))}
      </nav>
    </aside>
  );
}
