import { redirect } from "next/navigation";
import { getMe } from "@/entities/user";
import { getAccessToken } from "@/shared/api/authCookies";

export default async function PaymentsPage() {
  const accessToken = await getAccessToken();
  const user = accessToken ? await getMe(accessToken).catch(() => null) : null;

  if (user?.role === "student") {
    redirect("/student-dashboard/payment");
  }

  if (user?.role === "teacher") {
    redirect("/teacher-dashboard/payment");
  }

  redirect("/403");
}
