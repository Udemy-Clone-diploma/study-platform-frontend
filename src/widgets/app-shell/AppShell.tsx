import { Header } from "@/widgets/header";
import { AppSidebar } from "./sidebar/AppSidebar";
import type { SidebarItem } from "@/features/app-shell/model/types";

type AppShellProps = {
  children: React.ReactNode;
  sidebarItems: SidebarItem[];
};

export function AppShell({ children, sidebarItems }: AppShellProps) {
  return (
    <div className="flex min-h-screen min-w-[1024px] flex-col bg-white">
      <Header borderRadius="0px 0px 20px 0px" />
      <div className="flex flex-1 items-stretch">
        <AppSidebar items={sidebarItems} />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
