import { redirect } from "next/navigation";
import { getMe } from "@/entities/user";
import { getAccessToken } from "@/shared/api/authCookies";
import { PaymentWorkspace } from "@/widgets/payments";

export default async function StudentPaymentPage() {
  const accessToken = await getAccessToken();
  const user = accessToken ? await getMe(accessToken).catch(() => null) : null;

  if (!user || user.role !== "student") {
    redirect("/403");
  }

  return <PaymentWorkspace />;
}
