import type { UserRole } from "@/entities/user";
import type { SidebarItem } from "@/features/app-shell";

/** Which 4 sidebar item ids show in the mobile bottom nav, in order. Index 2 is always "dashboard" (visual center). */
export const BOTTOM_NAV_PRIMARY_IDS: Record<UserRole, string[]> = {
  student: ["homework", "courses", "dashboard", "chats"],
  teacher: ["homework", "courses", "dashboard", "chats"],
  moderator: ["courses", "chats", "dashboard", "reports"],
  administrator: ["students", "courses", "dashboard", "reports"],
};

/** Page listing the remaining sidebar items for the current user's role, linked from the bottom nav's "Others" slot. */
export const OTHERS_HREF = "/others";

/** Splits a role's sidebar items into the 4 primary bottom-nav items (in order) and the rest ("Others" page). */
export function getBottomNavSplit(role: UserRole, items: SidebarItem[]) {
  const ids = BOTTOM_NAV_PRIMARY_IDS[role];
  const byId = new Map(items.map((item) => [item.id, item]));
  const primary = ids.map((id) => byId.get(id)).filter((item): item is SidebarItem => item != null);
  const overflow = items.filter((item) => !ids.includes(item.id));
  return { primary, overflow };
}

/**
 * Ids that have a short label in the `BottomNav` namespace. The sidebar labels
 * are full phrases ("Домашні завдання", "Tableau de bord") that blow out a
 * ~68px slot, so the bottom nav uses its own one-word labels instead.
 */
export const BOTTOM_NAV_LABEL_IDS = new Set(Object.values(BOTTOM_NAV_PRIMARY_IDS).flat());
