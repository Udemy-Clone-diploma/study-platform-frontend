import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getMe } from "@/entities/user";
import { getAccessToken, getRefreshToken } from "@/shared/api/authCookies";
import { AppShell } from "@/widgets/app-shell";
import { getSidebarItems } from "@/widgets/app-shell/sidebar/model/sidebarConfig";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();
  const headerStore = await headers();
  const currentPath = headerStore.get("x-current-path") || "/";
  const refreshPath = `/api/auth/refresh?next=${encodeURIComponent(currentPath)}`;

  if (!accessToken) {
    if (refreshToken) {
      redirect(refreshPath);
    }

    redirect("/login");
  }

  const user = await getMe(accessToken).catch(() => null);

  if (!user) {
    if (refreshToken) {
      redirect(refreshPath);
    }

    redirect("/login");
  }

  return <AppShell sidebarItems={getSidebarItems(user.role)}>{children}</AppShell>;
}
