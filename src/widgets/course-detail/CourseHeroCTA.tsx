"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addCartItem } from "@/entities/cart";
import type { ApiError } from "@/shared/api/base";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";
import { getClientCookie } from "@/shared/lib/cookies";
import { AccentButton } from "@/shared/ui/AccentButton";

type Props = {
  courseId: number;
  slug: string;
  isEnrolled: boolean;
  /** ID of the first available PricingPlan, or null for free courses. */
  defaultPricingPlanId: number | null;
};

const CART_URL = "/student-dashboard/payment?tab=card";
const COURSE_AVAILABLE_NOTICE = "The course is already available in My Courses.";
const FREE_ENROLLMENT_SUCCESS_NOTICE = "Enrollment complete. You can start this course now.";
const STUDENT_ONLY_MESSAGE = "Enrollment is available only for students.";

/**
 * Hero CTA. Free courses create an enrollment; paid courses add the default
 * pricing plan to the student's cart.
 */
export function CourseHeroCTA({ courseId, slug, isEnrolled, defaultPricingPlanId }: Props) {
  const router = useRouter();
  const [enrolled, setEnrolled] = useState(isEnrolled);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const buttonStyle = { width: 200, minWidth: 200, height: 52 } as const;

  if (enrolled) {
    return (
      <AccentButton size="md" style={buttonStyle} onClick={() => router.push(`/courses/${slug}`)}>
        Go to course
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

    setPending(true);
    setNotice(null);

    try {
      if (defaultPricingPlanId !== null) {
        await addCartItem(courseId, defaultPricingPlanId);
        router.push(CART_URL);
        return;
      }

      const { enrollInCourse } = await import("@/entities/course");
      await enrollInCourse(courseId);
      setEnrolled(true);
      setNotice(FREE_ENROLLMENT_SUCCESS_NOTICE);
    } catch (error) {
      const apiError = error as Partial<ApiError>;
      const courseError = String(apiError.fields?.course_id ?? "");

      if (courseError.includes("already in cart")) {
        router.push(CART_URL);
        return;
      }

      if (courseError.includes("already has access") || apiError.status === 409) {
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
      <AccentButton size="md" style={buttonStyle} onClick={handleClick} disabled={pending}>
        {pending ? "Processing..." : defaultPricingPlanId !== null ? "Add to cart" : "Enroll for free"}
      </AccentButton>
      {notice && (
        <p role="status" className="max-w-[460px] text-base text-(--color-pink-dark)">
          {notice}
        </p>
      )}
    </div>
  );
}
