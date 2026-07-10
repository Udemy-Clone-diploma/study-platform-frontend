import { Header } from "@/widgets/header";
import { AppSidebar } from "./sidebar/AppSidebar";
import type { SidebarItem } from "@/features/app-shell";

type AppShellProps = {
  children: React.ReactNode;
  sidebarItems: SidebarItem[];
  fullBleed?: boolean;
};

export function AppShell({ children, sidebarItems, fullBleed = false }: AppShellProps) {
  return (
    <div className="flex h-screen min-w-[1024px] flex-col overflow-hidden bg-white">
      <Header borderRadius="0px 0px clamp(12px,1vw,20px) 0px" />

      <div className="relative flex flex-1 items-stretch overflow-hidden">
        <div className="w-[clamp(60px,4.5vw,80px)] shrink-0" aria-hidden="true" />

        <AppSidebar items={sidebarItems} />

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <main className={fullBleed ? "min-h-full" : "flex-1"}>{children}</main>
        </div>
      </div>
    </div>
  );
}
