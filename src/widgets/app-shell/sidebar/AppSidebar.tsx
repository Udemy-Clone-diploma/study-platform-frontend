"use client";

import Image from "next/image";
import { SidebarNavItem } from "@/features/app-shell/ui/SidebarNavItem";
import type { SidebarItem } from "@/features/app-shell/model/types";

type AppSidebarProps = {
  items: SidebarItem[];
};

export function AppSidebar({ items }: AppSidebarProps) {
  return (
    <aside className="group/sidebar z-30 w-20 shrink-0 self-stretch overflow-hidden bg-[#A7BAFA] transition-[width] duration-200 hover:w-[292px]">
      <nav className="flex flex-col gap-2.5 pb-[476px] pt-[104px]" aria-label="Application navigation">
        <button
          type="button"
          aria-label="Menu"
          className="mb-4 flex h-10 items-center rounded-sm pl-5 text-[#092878] transition-colors duration-200 hover:bg-[linear-gradient(90deg,#fff4da_0%,#fcc4c3_49%,#fcc4c3_100%)] group-hover/sidebar:hover:bg-[linear-gradient(90deg,#fff4da_0%,#fcc4c3_49%,#a7bafa_100%)]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center">
            <span className="flex h-7 w-7 items-center justify-center">
              <Image src="/icons/menu.svg" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
            </span>
          </span>
        </button>

        {items.map((item) => (
          <SidebarNavItem key={item.id} item={item} />
        ))}
      </nav>
    </aside>
  );
}
