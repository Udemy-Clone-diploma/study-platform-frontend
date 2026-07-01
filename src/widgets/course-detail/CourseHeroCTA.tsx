"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiError } from "@/shared/api/base";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";
import { getClientCookie } from "@/shared/lib/cookies";
import { AccentButton } from "@/shared/ui/AccentButton";
import { PRICING_ANCHOR_ID } from "./pricingAnchor";

type Props = {
  courseId: number;
  slug: string;
  isEnrolled: boolean;
  /** ID of the first available PricingPlan, or null for free courses. */
  defaultPricingPlanId: number | null;
};

const COURSE_AVAILABLE_NOTICE = "The course is already available in My Courses.";
const FREE_ENROLLMENT_SUCCESS_NOTICE = "Enrollment complete. You can start this course now.";
const STUDENT_ONLY_MESSAGE = "Enrollment is available only for students.";

function scrollToPricing() {
  document.getElementById(PRICING_ANCHOR_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Hero CTA. Free courses create an enrollment directly; paid courses scroll down
 * to the pricing block so the student picks a format (cohort/slots) before
 * anything is added to the cart — the cart requires that choice to be valid.
 */
export function CourseHeroCTA({ courseId, slug, isEnrolled, defaultPricingPlanId }: Props) {
  const router = useRouter();
  const [enrolled, setEnrolled] = useState(isEnrolled);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const buttonStyle = { minWidth: 200, height: 52, whiteSpace: "nowrap" } as const;

  if (enrolled) {
    return (
      <AccentButton size="md" className="self-start" style={buttonStyle} href={`/learn/${slug}`}>
        Continue learning
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
      setNotice(STUDENT_ONLY_MESSAGE);
      return;
    }

    if (defaultPricingPlanId !== null) {
      scrollToPricing();
      return;
    }

    setPending(true);
    setNotice(null);

    try {
      const { enrollInCourse } = await import("@/entities/course");
      await enrollInCourse(courseId);
      setEnrolled(true);
      setNotice(FREE_ENROLLMENT_SUCCESS_NOTICE);
    } catch (error) {
      const apiError = error as Partial<ApiError>;

      if (apiError.status === 409) {
        setEnrolled(true);
        setNotice(COURSE_AVAILABLE_NOTICE);
        return;
      }

      setNotice(apiError.message || apiError.detail || "Could not process your request.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <AccentButton size="md" className="self-start" style={buttonStyle} onClick={handleClick} disabled={pending}>
        {pending ? "Processing..." : defaultPricingPlanId !== null ? "Choose a plan" : "Enroll for free"}
      </AccentButton>
      {notice && (
        <p role="status" className="max-w-[460px] text-base text-(--color-pink-dark)">
          {notice}
        </p>
      )}
    </div>
  );
}
