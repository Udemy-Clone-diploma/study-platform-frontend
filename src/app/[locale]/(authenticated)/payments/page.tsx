import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getMe } from "@/entities/user";
import { getAccessToken } from "@/shared/api/authCookies";

export default async function PaymentsPage() {
  const accessToken = await getAccessToken();
  const user = accessToken ? await getMe(accessToken).catch(() => null) : null;
  const locale = await getLocale();

  if (user?.role === "student") {
    redirect({ href: "/student-dashboard/payment", locale });
  }

  if (user?.role === "teacher") {
    redirect({ href: "/teacher-dashboard/payment", locale });
  }

  redirect({ href: "/403", locale });
}
