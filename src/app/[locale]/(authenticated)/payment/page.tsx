import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getMe } from "@/entities/user";
import { getAccessToken } from "@/shared/api/authCookies";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function tabSuffix(params: Record<string, string | string[] | undefined>): string {
  const tab = params.tab;
  if (typeof tab !== "string") return "";
  return `?tab=${encodeURIComponent(tab === "cart" ? "card" : tab)}`;
}

export default async function PaymentPage({ searchParams }: { searchParams: SearchParams }) {
  const accessToken = await getAccessToken();
  const user = accessToken ? await getMe(accessToken).catch(() => null) : null;
  const params = await searchParams;
  const suffix = tabSuffix(params);
  const locale = await getLocale();

  if (user?.role === "student") {
    redirect({ href: `/student-dashboard/payment${suffix}`, locale });
  }

  if (user?.role === "teacher") {
    redirect({ href: `/teacher-dashboard/payment${suffix}`, locale });
  }

  redirect({ href: "/403", locale });
}
