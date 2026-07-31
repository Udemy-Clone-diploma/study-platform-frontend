import { redirect } from "next/navigation";
import { redirect as redirectLocalized } from "@/i18n/navigation";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
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
  const locale = await getLocale();

  if (!accessToken) {
    if (refreshToken) {
      redirect(refreshPath);
    }

    redirectLocalized({ href: "/login", locale });
  }

  const user = await getMe(accessToken).catch(() => null);

  if (!user) {
    if (refreshToken) {
      redirect(refreshPath);
    }

    redirectLocalized({ href: "/login", locale });
  }

  const [tSidebar, tCommon] = await Promise.all([
    getTranslations("AppSidebar"),
    getTranslations("Common"),
  ]);

  // next-intl's `redirect` resolves to `never` only after generic instantiation, which
  // TypeScript's control-flow analysis doesn't always pick up; the guard above guarantees
  // `user` is non-null here at runtime.
  return (
    <AppShell sidebarItems={getSidebarItems(user!.role, tSidebar, tCommon)} role={user!.role}>
      {children}
    </AppShell>
  );
}
