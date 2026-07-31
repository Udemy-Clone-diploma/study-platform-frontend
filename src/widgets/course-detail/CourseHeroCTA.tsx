"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { enrollInFreeCourse, type PublicCourseDeliveryFormat } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";
import { getClientCookie } from "@/shared/lib/cookies";
import { AccentButton } from "@/shared/ui/AccentButton";
import { ramp, fluid3 } from "@/shared/lib/fluidScale";
import { PRICING_ANCHOR_ID } from "./pricingAnchor";

const heroCtaStyle = {
  height: fluid3(375, 40, 1024, 50, 1920, 52),
  minWidth: fluid3(375, 160, 1024, 190, 1920, 200),
  fontSize: `clamp(13px, ${ramp(375, 13, 1024, 18)}, 20px)`,
  padding: `0 ${fluid3(375, 20, 1024, 27, 1920, 28)}`,
  whiteSpace: "nowrap",
} as const;

type Props = {
  courseId: number;
  slug: string;
  isEnrolled: boolean;
  defaultFormat: PublicCourseDeliveryFormat | null;
};

function scrollToPricing() {
  document
    .getElementById(PRICING_ANCHOR_ID)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Hero CTA. A zero-price plan grants access immediately — unless it's a
 * group/individual format, which still needs a cohort/session pick, so that
 * case scrolls to the pricing block instead, same as any paid plan.
 */
export function CourseHeroCTA({ slug, isEnrolled, defaultFormat }: Props) {
  const router = useRouter();
  const [enrolled, setEnrolled] = useState(isEnrolled);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const t = useTranslations("CourseHeroCTA");

  const defaultPricingPlan = defaultFormat?.pricing ?? null;
  const isFreeCourse = defaultPricingPlan !== null && Number(defaultPricingPlan.price) === 0;
  const needsSelection =
    defaultFormat?.format_type === "group" || defaultFormat?.format_type === "individual";

  if (enrolled) {
    return (
      <AccentButton
        size="md"
        className="self-center lg:self-start"
        style={heroCtaStyle}
        href={`/learn/${slug}`}
      >
        {t("continueLearning")}
      </AccentButton>
    );
  }

  const handleClick = async () => {
    if (!getClientCookie(AUTH_COOKIE_NAMES.access)) {
      router.push(`/login?next=${encodeURIComponent(`/courses/${slug}`)}`);
      return;
    }

    const role = getClientCookie(AUTH_COOKIE_NAMES.role);
    if (role && role !== "student") {
      setNotice(t("studentOnly"));
      return;
    }

    if (defaultFormat === null || defaultPricingPlan === null) {
      setNotice(t("noPricingPlan"));
      return;
    }

    if (!isFreeCourse || needsSelection) {
      scrollToPricing();
      return;
    }

    setPending(true);
    setNotice(null);

    try {
      await enrollInFreeCourse(slug, { delivery_format_id: defaultFormat.id });
      setEnrolled(true);
      setNotice(t("freeEnrollmentSuccess"));
    } catch (error) {
      const apiError = error as Partial<ApiError>;

      if (apiError.status === 409) {
        setEnrolled(true);
        setNotice(t("courseAvailable"));
        return;
      }

      setNotice(apiError.message || apiError.detail || t("genericError"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <AccentButton
        size="md"
        className="self-center lg:self-start"
        style={heroCtaStyle}
        onClick={handleClick}
        disabled={pending}
      >
        {pending ? t("processing") : isFreeCourse ? t("enrollFree") : t("choosePlan")}
      </AccentButton>
      {notice && (
        <p role="status" className="max-w-[460px] text-base text-(--color-pink-dark)">
          {notice}
        </p>
      )}
    </div>
  );
}
