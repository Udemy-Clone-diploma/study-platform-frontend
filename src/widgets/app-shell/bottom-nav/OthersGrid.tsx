import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { SidebarItem } from "@/features/app-shell";
import { SidebarIcon } from "@/shared/ui/icons/SidebarIcons";

/** 2-column grid of the sidebar items that don't fit in the mobile bottom nav's 4 primary slots. */
export function OthersGrid({ items }: { items: SidebarItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="flex flex-col gap-3 rounded-2xl p-4 transition-opacity hover:opacity-90"
          style={{ background: "var(--color-brand-lavender)", height: 100 }}
        >
          {item.iconSrc ? (
            <Image src={item.iconSrc} alt="" width={40} height={40} className="h-10 w-10 object-contain" />
          ) : (
            <SidebarIcon name={item.icon} width={40} height={40} className="text-(--color-blue-dark)" />
          )}
          <span
            className="font-(family-name:--font-accent) text-(--color-blue-dark)"
            style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase", lineHeight: 1.2 }}
          >
            {item.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
