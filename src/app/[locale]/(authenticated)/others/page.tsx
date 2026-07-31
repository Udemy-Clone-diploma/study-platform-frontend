import { getTranslations } from "next-intl/server";
import { getMe } from "@/entities/user";
import { getAccessToken } from "@/shared/api/authCookies";
import { PageShell } from "@/shared/ui/PageShell";
import { getBottomNavSplit } from "@/widgets/app-shell/bottom-nav/model/bottomNavConfig";
import { OthersGrid } from "@/widgets/app-shell/bottom-nav/OthersGrid";
import { getSidebarItems } from "@/widgets/app-shell/sidebar/model/sidebarConfig";

/** Mobile-only page listing the sidebar items that don't fit in the bottom nav's 4 primary slots. */
export default async function OthersPage() {
  const accessToken = await getAccessToken();
  const user = accessToken ? await getMe(accessToken).catch(() => null) : null;
  const role = user?.role ?? "student";
  const [tSidebar, tCommon] = await Promise.all([
    getTranslations("AppSidebar"),
    getTranslations("Common"),
  ]);

  const { overflow } = getBottomNavSplit(role, getSidebarItems(role, tSidebar, tCommon));

  return (
    <PageShell className="bg-my-courses">
      <OthersGrid items={overflow} />
    </PageShell>
  );
}
