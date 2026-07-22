import { notFound } from "next/navigation";
import { AdminProfileLoader } from "@/features/profile";

export default async function AdminChatUserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const numericUserId = Number(userId);

  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    notFound();
  }

  return <AdminProfileLoader userId={numericUserId} />;
}
