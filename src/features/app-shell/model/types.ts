import type { SidebarIconName } from "@/shared/ui/icons/SidebarIcons";

export type SidebarMatchMode = "exact" | "startsWith";

export type SidebarItem = {
  id: string;
  label: string;
  href: string;
  icon: SidebarIconName;
  iconSrc?: string;
  match: SidebarMatchMode;
};
