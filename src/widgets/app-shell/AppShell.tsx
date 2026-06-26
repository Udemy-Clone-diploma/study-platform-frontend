import { Header } from "@/widgets/header";
import { AppSidebar } from "./sidebar/AppSidebar";
import type { SidebarItem } from "@/features/app-shell";

type AppShellProps = {
  children: React.ReactNode;
  sidebarItems: SidebarItem[];
};

export function AppShell({ children, sidebarItems }: AppShellProps) {
  return (
    <div className="flex h-screen min-w-[1024px] flex-col overflow-hidden bg-white">
      <Header borderRadius="0px 0px clamp(12px,1vw,20px) 0px" />

      <div className="flex flex-1 overflow-hidden items-stretch">
        <AppSidebar items={sidebarItems} />

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}