import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PublicProfileLoader } from "@/features/profile";
import { getUserRoleCookie } from "@/shared/api/authCookies";

const DETAILED_PROFILE_ROLES = new Set(["administrator", "moderator", "teacher"]);

function detailedProfileReturnPath(
  source: string | undefined,
  viewerRole: string | undefined,
): string {
  switch (source) {
    case "moderator-reports":
      return "/moderator-dashboard/reports";
    case "moderator-chats":
      return "/moderator-dashboard/chats/reports";
    case "moderator-chat":
      return "/moderator-dashboard/chats";
    case "moderator-reviews":
      return "/moderator-dashboard/reviews";
    case "admin-reports":
      return "/admin/reports";
    case "teacher-reviews":
      return "/teacher-dashboard/courses";
    default:
      return viewerRole === "moderator" ? "/moderator-dashboard" : "/student-dashboard";
  }
}

export default async function PublicUserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ view?: string; from?: string }>;
}) {
  const { userId } = await params;
  const numericUserId = Number(userId);

  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    notFound();
  }

  const viewerRole = await getUserRoleCookie();
  const { view, from } = await searchParams;

  const showDetailedProfile =
    viewerRole === "moderator" ||
    (view === "review" && viewerRole && DETAILED_PROFILE_ROLES.has(viewerRole));

  if (showDetailedProfile) {
    const { AdminProfileLoader } = await import("@/features/profile");
    const t = await getTranslations("PublicProfile");
    return (
      <AdminProfileLoader
        key={numericUserId}
        userId={numericUserId}
        backHref={detailedProfileReturnPath(from, viewerRole)}
        backLabel={t("backToComplaints")}
      />
    );
  }

  return (
    <PublicProfileLoader
      key={numericUserId}
      userId={numericUserId}
      modal={viewerRole === "student"}
    />
  );
}
