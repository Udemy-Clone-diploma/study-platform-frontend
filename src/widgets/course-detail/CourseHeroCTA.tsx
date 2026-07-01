"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enrollInFreeCourse, type PricingPlan } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";
import { getClientCookie } from "@/shared/lib/cookies";
import { AccentButton } from "@/shared/ui/AccentButton";
import { PRICING_ANCHOR_ID } from "./pricingAnchor";

type Props = {
  courseId: number;
  slug: string;
  isEnrolled: boolean;
  defaultPricingPlan: PricingPlan | null;
};

const COURSE_AVAILABLE_NOTICE = "The course is already available in My Courses.";
const FREE_ENROLLMENT_SUCCESS_NOTICE = "Enrollment complete. You can start this course now.";
const STUDENT_ONLY_MESSAGE = "Enrollment is available only for students.";
const NO_PRICING_PLAN_NOTICE = "This course does not have an available pricing plan.";

function scrollToPricing() {
  document.getElementById(PRICING_ANCHOR_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Hero CTA. A zero-price plan grants access immediately; a paid plan scrolls down
 * to the pricing block so the student picks a format (cohort/slots) before
 * anything is added to the cart — the cart requires that choice to be valid.
 */
export function CourseHeroCTA({ slug, isEnrolled, defaultPricingPlan }: Props) {
  const router = useRouter();
  const [enrolled, setEnrolled] = useState(isEnrolled);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const buttonStyle = { minWidth: 200, height: 52, whiteSpace: "nowrap" } as const;
  const isFreeCourse = defaultPricingPlan !== null && Number(defaultPricingPlan.price) === 0;

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

    if (defaultPricingPlan === null) {
      setNotice(NO_PRICING_PLAN_NOTICE);
      return;
    }

    if (!isFreeCourse) {
      scrollToPricing();
      return;
    }

    setPending(true);
    setNotice(null);

    try {
      await enrollInFreeCourse(slug);
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
        {pending ? "Processing..." : isFreeCourse ? "Enroll for free" : "Choose a plan"}
      </AccentButton>
      {notice && (
        <p role="status" className="max-w-[460px] text-base text-(--color-pink-dark)">
          {notice}
        </p>
      )}
    </div>
  );
}
