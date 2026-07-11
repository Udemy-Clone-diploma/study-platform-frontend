import { Header } from "@/widgets/header";
import { AppSidebar } from "./sidebar/AppSidebar";
import { BottomNav } from "./bottom-nav";
import type { SidebarItem } from "@/features/app-shell";
import type { UserRole } from "@/entities/user";

type AppShellProps = {
  children: React.ReactNode;
  sidebarItems: SidebarItem[];
  role: UserRole;
  fullBleed?: boolean;
};

export function AppShell({ children, sidebarItems, role, fullBleed = false }: AppShellProps) {
  return (
    <div className="flex h-dvh min-w-0 flex-col overflow-hidden bg-white lg:h-screen lg:min-w-[1024px]">
      <Header borderRadius="0px 0px clamp(12px,1vw,20px) 0px" />

      <div className="relative flex flex-1 items-stretch overflow-hidden">
        <div className="hidden w-[clamp(60px,4.5vw,80px)] shrink-0 lg:block" aria-hidden="true" />

        <AppSidebar items={sidebarItems} />

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden pt-16 pb-[calc(103px+env(safe-area-inset-bottom))] lg:pt-0 lg:pb-0">
          <main className={fullBleed ? "min-h-full" : "flex-1"}>{children}</main>
        </div>
      </div>

      <BottomNav role={role} items={sidebarItems} />
    </div>
  );
}
