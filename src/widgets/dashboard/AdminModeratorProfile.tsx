"use client";

import { Link } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { getAdminModeratorDashboard, type ModeratorDashboardData } from "@/entities/user";
import type { ApiError } from "@/shared/api/base";
import { PageShell } from "@/shared/ui/PageShell";
import { UserIdentityCard, type UserIdentitySocial } from "@/shared/ui/UserIdentityCard";
import { ModeratorMetricGrid } from "./ModeratorMetrics";

const SOCIAL_ICONS = {
  instagram: { src: "/social-media-icons/instagrm-gray.svg", label: "Instagram" },
  linkedin: { src: "/social-media-icons/LinKedln-gray.svg", label: "LinkedIn" },
  facebook: { src: "/social-media-icons/Facebook-gray.svg", label: "Facebook" },
  behance: { src: "/social-media-icons/behance-gray.svg", label: "Behance" },
} as const;

function moderatorName(data: ModeratorDashboardData): string {
  const { first_name, last_name, email } = data.moderator;
  return `${first_name} ${last_name}`.trim() || email;
}

export function AdminModeratorProfile({ moderatorId }: { moderatorId: number }) {
  const [result, setResult] = useState<{
    moderatorId: number;
    data: ModeratorDashboardData | null;
    error: string;
  }>(() => ({ moderatorId, data: null, error: "" }));
  const isCurrentResult = result.moderatorId === moderatorId;
  const data = isCurrentResult ? result.data : null;
  const error = isCurrentResult ? result.error : "";
  const loading = !isCurrentResult || (!result.data && !result.error);

  useEffect(() => {
    let active = true;
    getAdminModeratorDashboard(moderatorId)
      .then((result) => {
        if (!active) return;
        setResult({ moderatorId, data: result, error: "" });
      })
      .catch((requestError) => {
        if (!active) return;
        const apiError = requestError as ApiError;
        setResult({
          moderatorId,
          data: null,
          error:
            apiError.status === 404
              ? "This moderator profile does not exist."
              : apiError.message || "The moderator profile could not be loaded.",
        });
      });

    return () => {
      active = false;
    };
  }, [moderatorId]);

  const socials = useMemo<UserIdentitySocial[]>(() => {
    if (!data) return [];
    return (Object.keys(SOCIAL_ICONS) as Array<keyof typeof SOCIAL_ICONS>).flatMap((key) => {
      const href = data.moderator[key];
      const social = SOCIAL_ICONS[key];
      return href ? [{ key, href, label: social.label, iconSrc: social.src }] : [];
    });
  }, [data]);

  return (
    <PageShell className="bg-(--color-brand-lavender-soft)">
      <div className="mx-auto w-full max-w-[1648px] font-(family-name:--font-base)">
        <Link
          href="/admin/users?role=moderator"
          className="mb-5 inline-flex items-center gap-2 text-sm text-(--color-blue-dark) transition hover:text-(--color-blue)"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to moderators
        </Link>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center text-(--color-blue)">
            <Loader2 className="h-7 w-7 animate-spin" aria-label="Loading moderator profile" />
          </div>
        ) : null}

        {!loading && error ? (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-2xl bg-white p-5 text-(--color-pink-dark) shadow-[0_0_17px_rgba(0,0,0,0.12)]"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        ) : null}

        {!loading && data ? (
          <>
            <header className="mb-6">
              <h1 className="text-3xl font-semibold text-(--color-text-primary)">
                Moderator profile
              </h1>
              <p className="mt-1 text-sm text-(--color-text-secondary)">
                {data.moderator.email} · Joined{" "}
                {new Date(data.moderator.date_joined).toLocaleDateString()}
              </p>
            </header>

            <div className="grid items-start gap-5 2xl:grid-cols-[420px_minmax(0,1fr)]">
              <div className="mx-auto w-full max-w-[420px] 2xl:mx-0">
                <UserIdentityCard
                  name={moderatorName(data)}
                  avatar={data.moderator.avatar}
                  socials={socials}
                  topLeftAction={
                    <span className="rounded-full bg-(--color-brand-cream) px-3 py-1 text-xs text-(--color-yellow-dark)">
                      {data.moderator.status === "active" && !data.moderator.is_blocked
                        ? "Active"
                        : "Inactive"}
                    </span>
                  }
                  topRightAction={
                    <span className="rounded-full bg-(--color-brand-lavender-soft) px-3 py-1 text-xs capitalize text-(--color-blue-dark)">
                      {data.moderator.profile.level || "Moderator"}
                    </span>
                  }
                />
              </div>

              <div className="min-w-0">
                <p className="mb-3 text-sm text-(--color-text-secondary)">
                  Performance for {data.period.start} – {data.period.end}
                </p>
                <ModeratorMetricGrid metrics={data.metrics} />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </PageShell>
  );
}
