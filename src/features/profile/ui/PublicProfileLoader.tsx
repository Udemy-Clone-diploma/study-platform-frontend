"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { getPublicUserProfile, type PublicUserProfile } from "@/entities/user";
import type { ApiError } from "@/shared/api/base";
import { ModalShell } from "@/shared/ui/ModalShell";
import { PublicProfileView } from "./PublicProfileView";

type Props = {
  userId: number;
  modal?: boolean;
  onClose?: () => void;
};

/** Loads an authenticated public profile in the browser and renders request states. */
export function PublicProfileLoader({ userId, modal = false, onClose }: Props) {
  const t = useTranslations("PublicProfile");
  const router = useRouter();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const closeProfile = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }

    const referrer = document.referrer;
    const cameFromThisApp = referrer && new URL(referrer).origin === window.location.origin;
    if (cameFromThisApp && window.history.length > 1) {
      router.back();
      return;
    }
    router.replace("/student-dashboard");
  }, [onClose, router]);

  useEffect(() => {
    let active = true;

    getPublicUserProfile(userId)
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch((requestError: Partial<ApiError>) => {
        if (!active) return;
        setError(
          requestError.status === 404
            ? t("profileUnavailableBody")
            : requestError.detail || requestError.message || t("couldNotLoad"),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId, t]);

  const content = loading ? (
    <div className="flex min-h-138 items-center justify-center px-6 text-(--color-text-secondary)">
      <Loader2 aria-label={t("loadingProfile")} className="h-8 w-8 animate-spin" />
    </div>
  ) : !profile ? (
    <div className="flex min-h-72 items-center justify-center px-6 py-12 text-center">
      <div className="max-w-md p-6">
        <h1 className="text-2xl font-bold text-(--color-text-primary)">
          {t("profileUnavailable")}
        </h1>
        <p className="mt-3 text-(--color-text-secondary)">{error || t("couldNotLoad")}</p>
      </div>
    </div>
  ) : (
    <PublicProfileView
      profile={profile}
      compact={modal}
      onClose={modal ? closeProfile : undefined}
      dismissBeforeNavigation={Boolean(onClose)}
    />
  );

  const isCompactTarget =
    !profile || (!profile.is_self && (profile.role === "student" || profile.role === "teacher"));

  if (modal && isCompactTarget) {
    return (
      <ModalShell
        onClose={closeProfile}
        ariaLabel={
          profile
            ? t("profileOf", { name: `${profile.first_name} ${profile.last_name}`.trim() })
            : t("userProfile")
        }
        width="min(420px, calc(100vw - 32px))"
        padding="0"
        maxHeight="min(90dvh, 552px)"
        shadow="var(--shadow-dashboard-card)"
      >
        {content}
      </ModalShell>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center px-6 py-20 text-(--color-text-secondary)">
        <Loader2 aria-label={t("loadingProfile")} className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-full items-center justify-center px-6 py-20 text-center">
        <div className="max-w-md rounded-2xl bg-(--color-bg) p-8 shadow-(--shadow-card)">
          <h1 className="text-2xl font-bold text-(--color-text-primary)">
            {t("profileUnavailable")}
          </h1>
          <p className="mt-3 text-(--color-text-secondary)">{error || t("couldNotLoad")}</p>
        </div>
      </div>
    );
  }

  return content;
}
