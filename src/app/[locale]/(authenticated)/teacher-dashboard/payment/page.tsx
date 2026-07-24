import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getMe } from "@/entities/user";
import { getAccessToken } from "@/shared/api/authCookies";
import { PaymentWorkspace } from "@/widgets/payments";

export default async function TeacherPaymentPage() {
  const accessToken = await getAccessToken();
  const user = accessToken ? await getMe(accessToken).catch(() => null) : null;

  if (!user || user.role !== "teacher") {
    redirect({ href: "/403", locale: await getLocale() });
  }

  return <PaymentWorkspace role="teacher" />;
}
