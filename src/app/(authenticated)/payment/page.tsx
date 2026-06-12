import { redirect } from "next/navigation";
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

  if (user?.role === "student") {
    redirect(`/student-dashboard/payment${suffix}`);
  }

  if (user?.role === "teacher") {
    redirect(`/teacher-dashboard/payment${suffix}`);
  }

  redirect("/403");
}
