import { redirect } from "next/navigation";
import { getMe } from "@/entities/user";
import { getAccessToken } from "@/shared/api/authCookies";
import { AppShell } from "@/widgets/app-shell";
import { getSidebarItems } from "@/widgets/app-shell/sidebar/model/sidebarConfig";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    redirect("/login");
  }

  const user = await getMe(accessToken).catch(() => null);

  if (!user) {
    redirect("/login");
  }

  return <AppShell sidebarItems={getSidebarItems(user.role)}>{children}</AppShell>;
}
